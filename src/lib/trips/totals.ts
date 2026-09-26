import { add, cents, multiply, type Cents } from "@/lib/money";

export type PricedTrip = {
  method: "per_km" | "flat";
  distanceKm: number | null;
  rateCents: number;
};

/** Cost of one trip: km × rate per km, or the fixed amount of the trip. */
export function tripCost(trip: PricedTrip): Cents {
  if (trip.method === "flat") {
    return cents(trip.rateCents);
  }
  if (trip.distanceKm === null) {
    throw new RangeError("Een rit per km heeft een afstand nodig");
  }
  return multiply(cents(trip.rateCents), trip.distanceKm);
}

/** Total cost of several trips: each trip is rounded once, then summed. */
export function sumTrips(trips: readonly PricedTrip[]): Cents {
  return add(...trips.map(tripCost));
}
