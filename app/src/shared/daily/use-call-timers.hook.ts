import { useEffect, useState } from "react";

/** mm:ss / h:mm:ss elapsed clock for an active call. */
export function useCallDuration(startedAtMs: number | null): string {
  const [elapsedSeconds, setElapsedSeconds] = useState(0);

  useEffect(() => {
    if (startedAtMs === null) {
      setElapsedSeconds(0);
      return;
    }
    const tick = () =>
      setElapsedSeconds(
        Math.max(0, Math.floor((Date.now() - startedAtMs) / 1000)),
      );
    tick();
    const interval = window.setInterval(tick, 1000);
    return () => window.clearInterval(interval);
  }, [startedAtMs]);

  const hours = Math.floor(elapsedSeconds / 3600);
  const minutes = Math.floor((elapsedSeconds % 3600) / 60);
  const seconds = elapsedSeconds % 60;

  if (hours > 0) {
    return `${hours}:${String(minutes).padStart(2, "0")}:${String(seconds).padStart(2, "0")}`;
  }
  return `${String(minutes).padStart(2, "0")}:${String(seconds).padStart(2, "0")}`;
}

export interface CallCountdown {
  /** "mm:ss" (or "h:mm:ss") remaining until endUtc. */
  display: string;
  /** True when under 5 minutes remain. */
  isWarning: boolean;
  /** True once the scheduled end has passed. */
  isExpired: boolean;
}

/** Countdown to the appointment's scheduled end (spec §5 join-window tail). */
export function useCountdownToEnd(endUtc?: string | null): CallCountdown {
  const [remainingSeconds, setRemainingSeconds] = useState<number | null>(null);

  useEffect(() => {
    if (!endUtc) {
      setRemainingSeconds(null);
      return;
    }
    const endTimeMs = new Date(endUtc).getTime();

    const tick = () =>
      setRemainingSeconds(
        Math.max(0, Math.floor((endTimeMs - Date.now()) / 1000)),
      );
    tick();
    const interval = window.setInterval(tick, 1000);
    return () => window.clearInterval(interval);
  }, [endUtc]);

  if (remainingSeconds === null) {
    return { display: "", isWarning: false, isExpired: false };
  }

  const hours = Math.floor(remainingSeconds / 3600);
  const minutes = Math.floor((remainingSeconds % 3600) / 60);
  const seconds = remainingSeconds % 60;

  const display =
    hours > 0
      ? `${hours}:${String(minutes).padStart(2, "0")}:${String(seconds).padStart(2, "0")}`
      : `${String(minutes).padStart(2, "0")}:${String(seconds).padStart(2, "0")}`;

  return {
    display,
    isWarning: remainingSeconds <= 300 && remainingSeconds > 0,
    isExpired: remainingSeconds === 0,
  };
}
