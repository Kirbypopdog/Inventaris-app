/**
 * Normalises a VAT number: removes spaces, dots and dashes, uppercases, and adds "BE" to a
 * bare Belgian enterprise number (10 digits, or 9 digits from before 2023).
 */
export function normalizeVatNumber(input: string): string {
  const compact = input.replace(/[\s.\-]/g, "").toUpperCase();
  if (/^\d{9}$/.test(compact)) {
    return `BE0${compact}`;
  }
  if (/^\d{10}$/.test(compact)) {
    return `BE${compact}`;
  }
  return compact;
}

/** Checks the mod-97 check digits of a Belgian enterprise number (BE + 10 digits). */
export function isValidBelgianVatNumber(vatNumber: string): boolean {
  const match = /^BE([01]\d{9})$/.exec(vatNumber);
  if (!match?.[1]) {
    return false;
  }
  const digits = match[1];
  const base = Number(digits.slice(0, 8));
  const check = Number(digits.slice(8));
  return 97 - (base % 97) === check;
}

/** Belgian numbers are checked fully; others only for the general EU format. */
export function isValidVatNumber(vatNumber: string): boolean {
  if (vatNumber.startsWith("BE")) {
    return isValidBelgianVatNumber(vatNumber);
  }
  return /^[A-Z]{2}[0-9A-Z]{2,13}$/.test(vatNumber);
}

export function formatBelgianVatNumber(vatNumber: string): string {
  const match = /^BE(\d{4})(\d{3})(\d{3})$/.exec(vatNumber);
  return match ? `BE ${match[1]}.${match[2]}.${match[3]}` : vatNumber;
}
