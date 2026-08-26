import { AlertCircle, CheckCircle2, RefreshCcw } from "lucide-react";
import type { AutosaveState } from "@/shared/hooks/use-debounced-autosave";

interface AutosaveIndicatorProps {
  state: AutosaveState;
}

export default function AutosaveIndicator({ state }: AutosaveIndicatorProps) {
  if (state === "error") {
    return (
      <div className="inline-flex w-fit items-center gap-2 rounded-full border border-red-200 bg-red-50 px-3 py-1 text-xs font-medium text-red-700">
        <AlertCircle className="h-3.5 w-3.5" />
        <span>Autosave failed</span>
      </div>
    );
  }

  if (state === "saved") {
    return (
      <div className="inline-flex w-fit items-center gap-2 rounded-full border border-emerald-200 bg-emerald-50 px-3 py-1 text-xs font-medium text-emerald-700">
        <CheckCircle2 className="h-3.5 w-3.5" />
        <span>All changes saved</span>
      </div>
    );
  }

  return (
    <div className="inline-flex w-fit items-center gap-2 rounded-full border border-slate-200 bg-slate-50 px-3 py-1 text-xs font-medium text-slate-600">
      <RefreshCcw
        className={`h-3.5 w-3.5 ${state === "saving" ? "animate-spin" : ""}`}
      />
      <span>{state === "saving" ? "Autosaving..." : "Autosave enabled"}</span>
    </div>
  );
}
