"use client";

import { useActionState } from "react";
import {
  FormMessage,
  dangerButtonClass,
  inputClass,
  secondaryButtonClass,
} from "@/components/form";
import { APP_ROLES, ROLE_LABELS, type AppRole } from "@/lib/auth/roles";
import { MIN_PASSWORD_LENGTH } from "@/lib/auth/schemas";
import { idleFormState } from "@/lib/forms";
import { removeMember, resetPassword, updateMember } from "./actions";

export type MemberView = {
  userId: string;
  email: string;
  role: AppRole;
  displayName: string;
  mustChangePassword: boolean;
  lastSignIn: string;
};

export function MemberCard({ member, isSelf }: { member: MemberView; isSelf: boolean }) {
  const [updateState, updateAction, updating] = useActionState(updateMember, idleFormState);
  const [resetState, resetAction, resetting] = useActionState(resetPassword, idleFormState);
  const [removeState, removeAction, removing] = useActionState(removeMember, idleFormState);
  const state = [removeState, resetState, updateState].find((s) => s.status !== "idle");

  return (
    <li className="flex flex-col gap-4 rounded-2xl border border-stone-200 p-4 dark:border-stone-800">
      <div>
        <p className="text-lg font-semibold">
          {member.displayName}
          {isSelf && <span className="font-normal text-stone-500"> (jij)</span>}
        </p>
        <p className="text-base break-all text-stone-600 dark:text-stone-400">{member.email}</p>
        <p className="text-sm text-stone-500">{member.lastSignIn}</p>
        {member.mustChangePassword && (
          <p className="text-sm text-amber-700 dark:text-amber-400">
            Moet nog een eigen wachtwoord kiezen
          </p>
        )}
      </div>

      <form action={updateAction} className="flex flex-col gap-3">
        <input type="hidden" name="userId" value={member.userId} />
        <label className="flex flex-col gap-2">
          <span className="text-base font-medium">Naam</span>
          <input
            name="displayName"
            required
            defaultValue={member.displayName}
            className={inputClass}
          />
        </label>
        <label className="flex flex-col gap-2">
          <span className="text-base font-medium">Rol</span>
          {isSelf ? (
            <>
              <input type="hidden" name="role" value={member.role} />
              <select disabled value={member.role} className={inputClass}>
                <option value={member.role}>{ROLE_LABELS[member.role]}</option>
              </select>
            </>
          ) : (
            <select name="role" defaultValue={member.role} className={inputClass}>
              {APP_ROLES.map((role) => (
                <option key={role} value={role}>
                  {ROLE_LABELS[role]}
                </option>
              ))}
            </select>
          )}
        </label>
        <button type="submit" disabled={updating} className={secondaryButtonClass}>
          {updating ? "Bezig met opslaan…" : "Opslaan"}
        </button>
      </form>

      {!isSelf && (
        <form action={resetAction} className="flex flex-col gap-3">
          <input type="hidden" name="userId" value={member.userId} />
          <label className="flex flex-col gap-2">
            <span className="text-base font-medium">Nieuw tijdelijk wachtwoord</span>
            <input
              name="temporaryPassword"
              type="text"
              required
              minLength={MIN_PASSWORD_LENGTH}
              autoComplete="off"
              spellCheck={false}
              className={inputClass}
            />
          </label>
          <button type="submit" disabled={resetting} className={secondaryButtonClass}>
            {resetting ? "Bezig…" : "Wachtwoord resetten"}
          </button>
        </form>
      )}

      {!isSelf && (
        <form
          action={removeAction}
          onSubmit={(event) => {
            if (!window.confirm(`${member.displayName} verwijderen? De toegang stopt meteen.`)) {
              event.preventDefault();
            }
          }}
        >
          <input type="hidden" name="userId" value={member.userId} />
          <button type="submit" disabled={removing} className={dangerButtonClass}>
            {removing ? "Bezig met verwijderen…" : "Verwijderen"}
          </button>
        </form>
      )}

      {state && <FormMessage status={state.status} message={state.message} />}
    </li>
  );
}
