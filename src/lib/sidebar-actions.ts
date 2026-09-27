"use server";

import { revalidatePath } from "next/cache";
import { cookies } from "next/headers";
import { SIDEBAR_COOKIE, isSidebarCollapsed } from "@/lib/sidebar";

const ONE_YEAR = 60 * 60 * 24 * 365;

/** Folds the laptop sidebar to icons, or opens it again. Remembered on this device. */
export async function toggleSidebar(): Promise<void> {
  const cookieStore = await cookies();
  if (isSidebarCollapsed(cookieStore.get(SIDEBAR_COOKIE)?.value)) {
    cookieStore.delete(SIDEBAR_COOKIE);
  } else {
    cookieStore.set(SIDEBAR_COOKIE, "collapsed", {
      path: "/",
      maxAge: ONE_YEAR,
      sameSite: "lax",
      httpOnly: true,
    });
  }
  revalidatePath("/", "layout");
}
