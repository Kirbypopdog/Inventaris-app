import { z } from "zod";

/** Cookie with the look chosen on this device; without it the app follows the device. */
export const THEME_COOKIE = "theme";

export const themeChoiceSchema = z.enum(["auto", "light", "dark"]);
export type ThemeChoice = z.infer<typeof themeChoiceSchema>;
export type Theme = Exclude<ThemeChoice, "auto">;

export const THEME_LABELS: Record<ThemeChoice, string> = {
  auto: "Automatisch",
  light: "Licht",
  dark: "Donker",
};

/** The fixed look from the cookie, or undefined to follow the device. */
export function parseTheme(value: string | undefined): Theme | undefined {
  const parsed = themeChoiceSchema.safeParse(value);
  return parsed.success && parsed.data !== "auto" ? parsed.data : undefined;
}
