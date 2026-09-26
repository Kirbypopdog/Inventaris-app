/** The part of a Postgres/PostgREST error we use to pick a message. */
export type DatabaseErrorLike = { code?: string | undefined };

/**
 * Turns an error from the member functions in the database into a message for the
 * user. Unknown errors get a generic message; the caller logs the details.
 */
export function memberErrorMessage(error: DatabaseErrorLike): string {
  switch (error.code) {
    case "23505":
      return "Deze persoon is al lid.";
    case "P0002":
      return "Deze gebruiker werd niet gevonden. Vernieuw de pagina en probeer opnieuw.";
    case "42501":
      return "Dat mag niet: je eigen rol, wachtwoord of account beheer je niet via deze pagina, en enkel de eigenaar of een beheerder kan gebruikers beheren.";
  }
  return "Er ging iets mis bij het opslaan. Probeer het later opnieuw.";
}
