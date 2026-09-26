import { createAuthUser, sql, users } from "./support";

export default async function globalSetup() {
  await createAuthUser(users.owner.email);
  await createAuthUser(users.admin.email);
  await createAuthUser(users.noAccess.email);
  sql(`select private.add_app_user('${users.owner.email}', 'owner', '${users.owner.displayName}')`);
  sql(`select private.add_app_user('${users.admin.email}', 'admin', '${users.admin.displayName}')`);
  // De collega wordt in de test zelf aangemaakt; een vorige run mag geen account achterlaten.
  sql(`delete from auth.users where email = '${users.colleague.email}'`);
}
