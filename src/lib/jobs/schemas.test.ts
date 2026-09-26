import { describe, expect, it } from "vitest";
import { jobRow, jobSchema } from "./schemas";

const valid = {
  customerId: "11111111-1111-4111-8111-111111111111",
  title: "Keuken Assebroek",
  description: "",
  addressLine: "",
  postalCode: "",
  city: "",
  status: "planned",
  startsOn: "",
  endsOn: "",
};

describe("jobSchema", () => {
  it("maps a minimal job to database columns", () => {
    expect(jobRow(jobSchema.parse(valid))).toEqual({
      customer_id: valid.customerId,
      title: "Keuken Assebroek",
      description: null,
      address_line: null,
      postal_code: null,
      city: null,
      status: "planned",
      starts_on: null,
      ends_on: null,
    });
  });

  it("accepts a period", () => {
    const job = jobSchema.parse({ ...valid, startsOn: "2026-10-01", endsOn: "2026-10-01" });
    expect(job.startsOn).toBe("2026-10-01");
  });

  it.each([
    [{ customerId: "" }, "Kies een klant."],
    [{ title: " " }, "Geef de job een naam"],
    [{ status: "bezig" }, "Kies een geldige status."],
    [{ startsOn: "2026-02-30" }, "Geef een geldige datum in."],
    [{ startsOn: "01/10/2026" }, "Geef een geldige datum in."],
    [{ startsOn: "2026-10-02", endsOn: "2026-10-01" }, "De einddatum ligt vóór de startdatum."],
  ])("rejects %o", (override, message) => {
    const result = jobSchema.safeParse({ ...valid, ...override });
    expect(result.success).toBe(false);
    expect(result.error?.issues[0]?.message).toContain(message);
  });
});
