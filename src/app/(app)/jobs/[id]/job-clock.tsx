import { clockIn, clockOut } from "@/app/(app)/uren/actions";
import { ActionButton } from "@/components/action-button";
import { clockInButtonClass, clockOutButtonClass } from "@/components/form";

/** Clock in or out on this job, at the top of every tab. Closed jobs have no button. */
export function JobClock({
  jobId,
  jobIsOpen,
  runningHere,
}: {
  jobId: string;
  jobIsOpen: boolean;
  runningHere: boolean;
}) {
  if (runningHere) {
    return (
      <ActionButton
        action={clockOut}
        values={{}}
        label="Uitklokken"
        pendingLabel="Bezig met uitklokken…"
        className={clockOutButtonClass}
      />
    );
  }
  if (!jobIsOpen) {
    return null;
  }
  return (
    <ActionButton
      action={clockIn}
      values={{ jobId }}
      label="Inklokken op deze job"
      pendingLabel="Bezig met inklokken…"
      className={clockInButtonClass}
    />
  );
}
