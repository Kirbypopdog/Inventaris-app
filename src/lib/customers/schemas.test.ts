import { describe, expect, it } from "vitest";
import { customerRow, customerSchema } from "./schemas";

const empty = {
  type: "private",
  name: "Jan Peeters",
  vatNumber: "",
  email: "",
  phone: "",
  addressLine: "",
  postalCode: "",
  city: "",
  notes: "",
  travelMethod: "",
  kmRate: "",
  tripFlat: "",
};

describe("customerSchema", () => {
  it("keeps travel exceptions for this customer", () => {
    const row = customerRow(
      customerSchema.parse({ ...empty, travelMethod: "flat", tripFlat: "35,00" }),
    );
    expect(row).toMatchObject({
      travel_method: "flat",
      trip_flat_cents: 3500,
      km_rate_cents: null,
    });
  });

  it("turns empty optional fields into null", () => {
    expect(customerRow(customerSchema.parse(empty))).toEqual({
      type: "private",
      name: "Jan Peeters",
      vat_number: null,
      email: null,
      phone: null,
      address_line: null,
      postal_code: null,
      city: null,
      notes: null,
      travel_method: null,
      km_rate_cents: null,
      trip_flat_cents: null,
    });
  });

  it("normalises a business customer", () => {
    const result = customerSchema.parse({
      ...empty,
      type: "business",
      name: " Schrijnwerkerij Peeters bv ",
      vatNumber: "be 0123.456.749",
      email: " Info@Peeters.BE ",
      postalCode: "8000",
      city: " Brugge ",
    });
    expect(result).toMatchObject({
      name: "Schrijnwerkerij Peeters bv",
      vatNumber: "BE0123456749",
      email: "info@peeters.be",
      postalCode: "8000",
      city: "Brugge",
    });
  });

  it.each([
    [{ name: "  " }, "Geef een naam in."],
    [{ vatNumber: "BE0123456748" }, "Dit btw-nummer klopt niet"],
    [{ email: "jan@" }, "Geef een geldig e-mailadres in"],
    [{ postalCode: "80000" }, "4 cijfers"],
    [{ type: "anders" }, "Kies particulier of bedrijf."],
  ])("rejects %o", (override, message) => {
    const result = customerSchema.safeParse({ ...empty, ...override });
    expect(result.success).toBe(false);
    expect(result.error?.issues[0]?.message).toContain(message);
  });
});
