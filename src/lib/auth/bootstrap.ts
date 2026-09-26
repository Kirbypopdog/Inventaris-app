import { emailSchema, newPasswordSchema } from "./schemas";

export type BootstrapConfig = { email?: string | undefined; password?: string | undefined };

export type BootstrapDeps = {
  countMembers(): Promise<number>;
  /** Creates the auth account. Never changes the password of an existing account. */
  createAccount(email: string, password: string): Promise<"created" | "exists">;
  /** Makes the account an admin, but only while there are no members at all. */
  makeFirstAdmin(email: string): Promise<boolean>;
};

export type BootstrapResult =
  "not-configured" | "invalid-config" | "already-has-members" | "admin-created";

/**
 * Creates the very first admin from ADMIN_EMAIL and ADMIN_PASSWORD, like the seed in the
 * roster app. Only does something while nobody has access yet, so it is safe to run on
 * every start. The admin must choose their own password at the first login.
 */
export async function bootstrapAdmin(
  config: BootstrapConfig,
  deps: BootstrapDeps,
): Promise<BootstrapResult> {
  if (!config.email || !config.password) {
    return "not-configured";
  }
  const email = emailSchema.safeParse(config.email);
  const password = newPasswordSchema.safeParse(config.password);
  if (!email.success || !password.success) {
    console.error(
      "ADMIN_EMAIL or ADMIN_PASSWORD is invalid (password needs at least 10 characters); no admin created.",
    );
    return "invalid-config";
  }

  if ((await deps.countMembers()) > 0) {
    return "already-has-members";
  }

  await deps.createAccount(email.data, password.data);
  const created = await deps.makeFirstAdmin(email.data);
  if (created) {
    console.warn(`First admin created for ${email.data}.`);
  }
  return created ? "admin-created" : "already-has-members";
}
