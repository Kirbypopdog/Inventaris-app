import "server-only";
import { cache } from "react";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { canManageMembers, type AppRole } from "./roles";

export type Member = {
  userId: string;
  email: string;
  role: AppRole;
  displayName: string;
};

export type Session =
  | { status: "member"; member: Member }
  // Ingelogd, maar (nog) niet toegevoegd aan app_users.
  | { status: "no-access"; email: string };

/**
 * The verified session of the current request, or null when nobody is logged in.
 * Cached per request, so pages and components can call it freely.
 */
export const getSession = cache(async (): Promise<Session | null> => {
  const supabase = await createClient();
  const { data, error } = await supabase.auth.getClaims();
  if (error) {
    console.error("Could not verify session", { code: error.code, status: error.status });
    return null;
  }
  const claims = data?.claims;
  if (!claims) {
    return null;
  }

  const email = claims.email ?? "";
  const { data: row, error: rowError } = await supabase
    .from("app_users")
    .select("role, display_name")
    .eq("user_id", claims.sub)
    .maybeSingle();
  if (rowError) {
    throw new Error(`Could not load app user: ${rowError.message}`);
  }
  if (!row) {
    return { status: "no-access", email };
  }
  return {
    status: "member",
    member: { userId: claims.sub, email, role: row.role, displayName: row.display_name },
  };
});

/** Like getSession, but sends visitors who are not logged in to the login page. */
export async function requireSession(): Promise<Session> {
  const session = await getSession();
  if (!session) {
    redirect("/login");
  }
  return session;
}

/** For pages that only the owner or an admin may open. Others go back to the home page. */
export async function requireManager(): Promise<Member> {
  const session = await requireSession();
  if (session.status !== "member" || !canManageMembers(session.member.role)) {
    redirect("/");
  }
  return session.member;
}
