import { describe, expect, it } from "vitest";
import { centsToEuros, toCsv } from "./csv";

describe("toCsv", () => {
  it("uses semicolons, decimal commas, CRLF and a byte order mark", () => {
    expect(
      toCsv(
        ["Naam", "Bedrag"],
        [
          ["Vijzen", 12.5],
          ["Lijm", null],
        ],
      ),
    ).toBe("﻿Naam;Bedrag\r\nVijzen;12,5\r\nLijm;\r\n");
  });

  it("quotes cells with separators, quotes or line breaks", () => {
    expect(toCsv(["A"], [['Kast "eik"; 2 deuren\nop maat']])).toBe(
      '﻿A\r\n"Kast ""eik""; 2 deuren\nop maat"\r\n',
    );
  });

  it("never lets Excel run a cell as a formula", () => {
    expect(toCsv(["A"], [["=SUM(A1)"], ["-5 cm"]])).toBe("﻿A\r\n'=SUM(A1)\r\n'-5 cm\r\n");
  });

  it("keeps negative numbers as numbers", () => {
    expect(toCsv(["A"], [[-3.5]])).toBe("﻿A\r\n-3,5\r\n");
  });
});

describe("centsToEuros", () => {
  it("turns cents into euros", () => {
    expect(centsToEuros(1250)).toBe(12.5);
    expect(centsToEuros(null)).toBeNull();
  });
});
