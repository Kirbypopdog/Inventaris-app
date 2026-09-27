/**
 * CSV for Excel with Belgian settings: semicolon as separator, decimal comma, UTF-8 with a
 * byte order mark so accents (é, ë) show correctly.
 */

export type CsvCell = string | number | null;

const SEPARATOR = ";";
const BYTE_ORDER_MARK = "﻿";

const numberFormat = new Intl.NumberFormat("nl-BE", {
  useGrouping: false,
  maximumFractionDigits: 3,
});

function formatCell(cell: CsvCell): string {
  if (cell === null) {
    return "";
  }
  const text = typeof cell === "number" ? numberFormat.format(cell) : cell;
  // Quote when needed; a leading =, +, - or @ is prefixed so Excel never runs it as a formula.
  const safe = /^[=+\-@]/.test(text) && typeof cell === "string" ? `'${text}` : text;
  return /[";\r\n]/.test(safe) ? `"${safe.replaceAll('"', '""')}"` : safe;
}

export function toCsv(headers: readonly string[], rows: readonly (readonly CsvCell[])[]): string {
  const lines = [headers, ...rows].map((row) => row.map(formatCell).join(SEPARATOR));
  return BYTE_ORDER_MARK + lines.join("\r\n") + "\r\n";
}

/** Euro cents as euros for a spreadsheet, e.g. 1250 → 12.5 (shown as 12,5). */
export function centsToEuros(amount: number | null): number | null {
  return amount === null ? null : amount / 100;
}
