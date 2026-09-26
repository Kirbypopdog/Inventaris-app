import { createAuthUser, sql, users } from "./support";

export default async function globalSetup() {
  // Elke run begint met verse testgegevens.
  sql(
    `delete from public.time_entries where job_id in (select id from public.jobs where title like 'E2E %')
       or user_id in (select id from auth.users where email like 'e2e-%@example.com')`,
  );
  sql(`delete from public.jobs where title like 'E2E %'`);
  sql(`update public.hourly_rates set is_default = false where name like 'E2E %'`);
  sql(`delete from public.hourly_rates where name like 'E2E %'`);
  sql(`delete from public.customers where name like 'E2E %'`);
  sql(`delete from auth.users where email like 'e2e-%@example.com'`);

  await createAuthUser(users.owner.email, users.owner.password);
  await createAuthUser(users.admin.email, users.admin.password);
  await createAuthUser(users.temporary.email, users.temporary.password);
  await createAuthUser(users.noAccess.email, users.noAccess.password);

  sql(`select private.add_app_user('${users.owner.email}', 'owner', '${users.owner.displayName}')`);
  sql(`select private.add_app_user('${users.admin.email}', 'admin', '${users.admin.displayName}')`);
  sql(
    `select private.add_app_user('${users.temporary.email}', 'owner', '${users.temporary.displayName}')`,
  );
  sql(
    `update public.app_users set must_change_password = true
     where user_id = (select id from auth.users where email = '${users.temporary.email}')`,
  );
}
