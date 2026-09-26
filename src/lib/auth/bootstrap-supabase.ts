import "server-only";
import { createAdminClient } from "@/lib/supabase/admin";
import { bootstrapAdmin, type BootstrapResult } from "./bootstrap";

/** Runs bootstrapAdmin against Supabase with ADMIN_EMAIL and ADMIN_PASSWORD. */
export async function runBootstrapAdmin(): Promise<BootstrapResult> {
  const config = { email: process.env.ADMIN_EMAIL, password: process.env.ADMIN_PASSWORD };
  if (!config.email || !config.password) {
    return "not-configured";
  }

  const admin = createAdminClient();
  return bootstrapAdmin(config, {
    async countMembers() {
      const { count, error } = await admin
        .from("app_users")
        .select("user_id", { count: "exact", head: true });
      if (error) {
        throw new Error(`Counting members failed: ${error.message}`);
      }
      return count ?? 0;
    },
    async createAccount(email, password) {
      const { error } = await admin.auth.admin.createUser({
        email,
        password,
        email_confirm: true,
      });
      if (error?.code === "email_exists") {
        return "exists";
      }
      if (error) {
        throw new Error(`Creating admin account failed: ${error.code ?? error.message}`);
      }
      return "created";
    },
    async makeFirstAdmin(email) {
      const { data, error } = await admin.rpc("bootstrap_admin", { admin_email: email });
      if (error) {
        throw new Error(`bootstrap_admin failed: ${error.message}`);
      }
      return data;
    },
  });
}
