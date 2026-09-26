import { describe, expect, it } from "vitest";
import { saveErrorMessage } from "./database-errors";

describe("saveErrorMessage", () => {
  it.each([
    ["23503", /niet \(meer\) bestaan/],
    ["23514", /klopt niet/],
    ["22P02", /klopt niet/],
    ["42501", /geen toegang/],
    ["PGRST116", /niet gevonden/],
    [undefined, /iets mis/],
  ])("maps %s", (code, message) => {
    expect(saveErrorMessage({ code })).toMatch(message);
  });
});
