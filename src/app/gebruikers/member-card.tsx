"use client";

import { useActionState } from "react";
import {
  FormMessage,
  dangerButtonClass,
  inputClass,
  secondaryButtonClass,
} from "@/components/form";
import { APP_ROLES, ROLE_LABELS, type AppRole } from "@/lib/auth/roles";
import { removeMember, updateMember, type FormState } from "./actions";

export type MemberView = {
  userId: string;
  email: string;
  role: AppRole;
  displayName: string;
  lastSignIn: string;
};

const initialState: FormState = { status: "idle" };

export function MemberCard({ member, isSelf }: { member: MemberView; isSelf: boolean }) {
  const [updateState, updateAction, updating] = useActionState(updateMember, initialState);
  const [removeState, removeAction, removing] = useActionState(removeMember, initialState);
  const state = removeState.status !== "idle" ? removeState : updateState;

  return (
    <li className="flex flex-col gap-4 rounded-2xl border border-zinc-200 p-4 dark:border-zinc-800">
      <div>
        <p className="text-lg font-semibold">
          {member.displayName}
          {isSelf && <span className="font-normal text-zinc-500"> (jij)</span>}
        </p>
        <p className="text-base break-all text-zinc-600 dark:text-zinc-400">{member.email}</p>
        <p className="text-sm text-zinc-500">{member.lastSignIn}</p>
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

      {state.status !== "idle" && <FormMessage status={state.status} message={state.message} />}
    </li>
  );
}
