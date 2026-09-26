import { Constants, type Database } from "@/lib/supabase/database.types";

export type AppRole = Database["public"]["Enums"]["app_role"];

export const APP_ROLES = Constants.public.Enums.app_role;

export const ROLE_LABELS: Record<AppRole, string> = {
  owner: "Eigenaar",
  admin: "Beheerder",
};

/** Roles that may manage users. Must match private.is_manager() in the database. */
const MANAGER_ROLES: ReadonlySet<AppRole> = new Set(["owner", "admin"]);

export function canManageMembers(role: AppRole): boolean {
  return MANAGER_ROLES.has(role);
}
