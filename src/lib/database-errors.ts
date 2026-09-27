/** The part of a Postgres/PostgREST error we use to pick a message. */
export type DatabaseErrorLike = { code?: string | undefined };

/**
 * A message for the user when saving business data fails. The database constraints are
 * the last line of defence, so these mostly show up when data changed in the meantime.
 */
export function saveErrorMessage(error: DatabaseErrorLike): string {
  switch (error.code) {
    case "23503":
      return "Dit hangt samen met gegevens die niet (meer) bestaan. Vernieuw de pagina en probeer opnieuw.";
    case "23514":
    case "22P02":
      return "Een van de ingevulde waarden klopt niet. Controleer het formulier.";
    case "42501":
      return "Je hebt geen toegang om dit te wijzigen.";
    case "PGRST116":
    case "P0002":
      return "Dit werd niet gevonden. Misschien werd het intussen verwijderd.";
    case "23505":
      return "Dit bestaat al.";
    case "TS001":
      return "Stel eerst een standaard-uurtarief in (Meer → Uurtarieven).";
    case "TS002":
      return "Je bent niet ingeklokt.";
    case "TS003":
      return "Deze job is afgewerkt of geannuleerd. Zet de status eerst terug op Bezig.";
    case "TS004":
      return "Verplaatsingen zijn inbegrepen voor deze job. Er worden geen ritten aangerekend.";
    case "TS006":
      return "Deze offerte is niet meer in ontwerp. Zet ze eerst terug op Ontwerp om ze aan te passen.";
    case "TS005":
      return "Geef de afstand in km in, bv. 42 of 42,5.";
  }
  return "Er ging iets mis bij het opslaan. Probeer het later opnieuw.";
}
