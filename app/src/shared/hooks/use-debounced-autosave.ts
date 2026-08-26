import { useEffect, useRef, useState } from "react";

export type AutosaveState = "idle" | "saving" | "saved" | "error";

interface UseDebouncedAutosaveOptions<T> {
  value: T;
  enabled: boolean;
  onSave: (value: T) => Promise<boolean>;
  delay?: number;
  isSaving?: boolean;
}

export function useDebouncedAutosave<T>({
  value,
  enabled,
  onSave,
  delay = 1200,
  isSaving = false,
}: UseDebouncedAutosaveOptions<T>) {
  const firstRunRef = useRef(true);
  const lastSavedSnapshotRef = useRef("");
  const onSaveRef = useRef(onSave);
  const [autosaveState, setAutosaveState] = useState<AutosaveState>("idle");

  useEffect(() => {
    onSaveRef.current = onSave;
  }, [onSave]);

  useEffect(() => {
    const snapshot = JSON.stringify(value);

    if (!enabled) {
      firstRunRef.current = true;
      lastSavedSnapshotRef.current = snapshot;
      setAutosaveState("idle");
      return;
    }

    if (firstRunRef.current) {
      firstRunRef.current = false;
      lastSavedSnapshotRef.current = snapshot;
      return;
    }

    if (isSaving || snapshot === lastSavedSnapshotRef.current) {
      return;
    }

    const timer = window.setTimeout(async () => {
      setAutosaveState("saving");

      try {
        const didSave = await onSaveRef.current(value);

        if (!didSave) {
          setAutosaveState("error");
          // Update the snapshot so we don't infinitely retry the exact same failing payload
          lastSavedSnapshotRef.current = snapshot;
          return;
        }

        lastSavedSnapshotRef.current = snapshot;
        setAutosaveState("saved");
      } catch {
        setAutosaveState("error");
        // Update the snapshot to avoid infinite retry loops on failure
        lastSavedSnapshotRef.current = snapshot;
      }
    }, delay);

    return () => window.clearTimeout(timer);
  }, [delay, enabled, isSaving, value]);

  useEffect(() => {
    if (autosaveState !== "saved") return;

    const timer = window.setTimeout(() => {
      setAutosaveState("idle");
    }, 2000);

    return () => window.clearTimeout(timer);
  }, [autosaveState]);

  return { autosaveState };
}
