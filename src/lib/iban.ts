/** Removes spaces and dashes and uppercases an IBAN as typed, e.g. "be68 5390-0754 7034". */
export function normalizeIban(input: string): string {
  return input.replace(/[\s-]/g, "").toUpperCase();
}

/**
 * Checks the format and the mod-97 check digits of an IBAN (ISO 13616). Belgian IBANs
 * must have exactly 16 characters.
 */
export function isValidIban(iban: string): boolean {
  if (!/^[A-Z]{2}\d{2}[A-Z0-9]{11,30}$/.test(iban)) {
    return false;
  }
  if (iban.startsWith("BE") && iban.length !== 16) {
    return false;
  }
  // Move the country code and check digits to the end, turn letters into numbers
  // (A = 10 … Z = 35), and take the remainder piece by piece to stay within safe integers.
  const rearranged = iban.slice(4) + iban.slice(0, 4);
  let remainder = 0;
  for (const character of rearranged) {
    const value = /\d/.test(character) ? character : String(character.charCodeAt(0) - 55);
    remainder = Number(`${remainder}${value}`) % 97;
  }
  return remainder === 1;
}

/** Groups of 4 for display: "BE68 5390 0754 7034". */
export function formatIban(iban: string): string {
  return iban.replace(/(.{4})(?=.)/g, "$1 ");
}
