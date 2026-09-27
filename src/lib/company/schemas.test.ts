import { describe, expect, it } from "vitest";
import { companyRow, companySchema } from "./schemas";

const valid = {
  companyName: " Schrijnwerkerij Peeters ",
  vatNumber: "0123.456.749",
  addressLine: "Markt 1",
  postalCode: "8000",
  city: "Brugge",
  email: " Info@Peeters.be ",
  phone: "050 12 34 56",
  iban: "be68 5390 0754 7034",
};

describe("companySchema", () => {
  it("normalises the company's details", () => {
    expect(companyRow(companySchema.parse(valid))).toEqual({
      company_name: "Schrijnwerkerij Peeters",
      vat_number: "BE0123456749",
      address_line: "Markt 1",
      postal_code: "8000",
      city: "Brugge",
      email: "info@peeters.be",
      phone: "050 12 34 56",
      iban: "BE68539007547034",
    });
  });

  it("allows empty optional fields for now", () => {
    const row = companyRow(
      companySchema.parse({
        companyName: "Peeters",
        vatNumber: "",
        addressLine: "",
        postalCode: "",
        city: "",
        email: "",
        phone: "",
        iban: "",
      }),
    );
    expect(row.vat_number).toBeNull();
    expect(row.iban).toBeNull();
  });

  it.each([
    [{ companyName: " " }, "naam van het bedrijf"],
    [{ vatNumber: "BE 0123.456.748" }, "btw-nummer klopt niet"],
    [{ iban: "BE68 5390 0754 7035" }, "rekeningnummer klopt niet"],
    [{ postalCode: "800" }, "postcode"],
    [{ email: "info@" }, "e-mailadres"],
  ])("refuses %j", (change, message) => {
    const result = companySchema.safeParse({ ...valid, ...change });
    expect(result.success).toBe(false);
    expect(result.error?.issues[0]?.message).toContain(message);
  });
});
