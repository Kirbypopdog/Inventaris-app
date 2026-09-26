import { createAuthUser, sql, users } from "./support";

export default async function globalSetup() {
  await createAuthUser(users.owner.email);
  await createAuthUser(users.noAccess.email);
  sql(`select private.add_app_user('${users.owner.email}', 'owner', '${users.owner.displayName}')`);
}
