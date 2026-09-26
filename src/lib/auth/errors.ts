/** The parts of a Supabase AuthError we use to pick a message. */
export type AuthErrorLike = { code?: string | undefined; status?: number | undefined };

/**
 * Turns a Supabase auth error into a message for the user. Unknown errors get a
 * generic message; the caller logs the technical details.
 */
export function authErrorMessage(error: AuthErrorLike): string {
  switch (error.code) {
    case "invalid_credentials":
      return "E-mailadres of wachtwoord klopt niet.";
    case "weak_password":
      return "Dit wachtwoord is te zwak. Kies een langer wachtwoord.";
    case "same_password":
      return "Kies een ander wachtwoord dan je huidige.";
    case "over_request_rate_limit":
      return "Er zijn te veel pogingen gedaan. Wacht een paar minuten en probeer opnieuw.";
  }
  if (error.status === 429) {
    return "Er zijn te veel pogingen gedaan. Wacht een paar minuten en probeer opnieuw.";
  }
  return "Er ging iets mis bij het aanmelden. Probeer het later opnieuw.";
}
