/** "Markt 1, 8000 Brugge", leaving out what is missing; "" when there is no address. */
export function formatAddress(
  line: string | null,
  postalCode: string | null,
  city: string | null,
): string {
  return [line, [postalCode, city].filter(Boolean).join(" ")].filter(Boolean).join(", ");
}

/** A Google Maps link that opens the address (and offers a route) on phone and laptop. */
export function mapsUrl(address: string): string {
  return `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(address)}`;
}
