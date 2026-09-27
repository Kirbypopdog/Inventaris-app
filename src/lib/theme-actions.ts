"use server";

import { revalidatePath } from "next/cache";
import { cookies } from "next/headers";
import { THEME_COOKIE, themeChoiceSchema } from "@/lib/theme";

const ONE_YEAR = 60 * 60 * 24 * 365;

/** Light, dark or automatic (follow the device), remembered on this device. */
export async function setTheme(formData: FormData): Promise<void> {
  const choice = themeChoiceSchema.safeParse(formData.get("theme"));
  if (!choice.success) {
    // Only a tampered form gets here; the page keeps its current look.
    console.error("setTheme: unknown theme", { value: formData.get("theme") });
    return;
  }
  const cookieStore = await cookies();
  if (choice.data === "auto") {
    cookieStore.delete(THEME_COOKIE);
  } else {
    cookieStore.set(THEME_COOKIE, choice.data, {
      path: "/",
      maxAge: ONE_YEAR,
      sameSite: "lax",
      httpOnly: true,
    });
  }
  revalidatePath("/", "layout");
}
