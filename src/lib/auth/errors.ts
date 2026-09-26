/** The parts of a Supabase AuthError we use to pick a message. */
export type AuthErrorLike = { code?: string | undefined; status?: number | undefined };

/**
 * Turns a Supabase auth error into a message for the user. Unknown errors get a
 * generic message; the caller logs the technical details.
 */
export function authErrorMessage(error: AuthErrorLike): string {
  switch (error.code) {
    case "otp_disabled":
    case "signup_disabled":
    case "user_not_found":
      return "Dit e-mailadres heeft geen toegang. Vraag de beheerder om je uit te nodigen.";
    case "otp_expired":
      return "Deze code is verlopen of klopt niet. Vraag een nieuwe code aan.";
    case "over_email_send_rate_limit":
    case "over_request_rate_limit":
      return "Er zijn te veel codes aangevraagd. Wacht een paar minuten en probeer opnieuw.";
    case "email_address_invalid":
      return "Geef een geldig e-mailadres in.";
  }
  if (error.status === 429) {
    return "Er zijn te veel pogingen gedaan. Wacht een paar minuten en probeer opnieuw.";
  }
  return "Er ging iets mis bij het aanmelden. Probeer het later opnieuw.";
}
