"use client";

import { useEffect, useState } from "react";
import { formatDuration, minutesBetween } from "@/lib/time";

/** Time since `startedAt`, updated every 20 seconds. */
export function ElapsedTime({ startedAt }: { startedAt: string }) {
  const [now, setNow] = useState(() => new Date().toISOString());
  useEffect(() => {
    const timer = setInterval(() => setNow(new Date().toISOString()), 20_000);
    return () => clearInterval(timer);
  }, []);
  return <span suppressHydrationWarning>{formatDuration(minutesBetween(startedAt, now))}</span>;
}
