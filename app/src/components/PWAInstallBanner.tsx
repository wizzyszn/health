import { Smartphone, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { usePWAInstall } from "@/shared/hooks/use-pwa-install";

export function PWAInstallBanner() {
  const {
    isInstallable,
    isInstalled,
    isDismissed,
    promptInstall,
    dismissPrompt,
  } = usePWAInstall();

  if (!isInstallable || isInstalled || isDismissed) return null;

  return (
    <div className="fixed left-0 right-0 top-0 z-50 flex justify-center px-3 pt-3 sm:px-0 sm:pt-4">
      <div className="flex w-full max-w-md items-center gap-3 rounded-2xl border border-primary/20 bg-white/90 px-4 py-3 shadow-[0_8px_32px_-8px_rgba(99,102,241,0.25)] backdrop-blur-md">
        {/* Icon */}
        <div className="flex h-9 w-9 flex-shrink-0 items-center justify-center rounded-xl bg-gradient-to-br from-primary to-secondary shadow-sm">
          <Smartphone className="h-4 w-4 text-white" />
        </div>

        {/* Text */}
        <div className="min-w-0 flex-1">
          <p className="truncate text-sm font-semibold text-foreground">
            Install HealthMe
          </p>
          <p className="text-xs text-muted-foreground">
            Get the full app experience — fast &amp; offline-ready
          </p>
        </div>

        {/* Actions */}
        <div className="flex flex-shrink-0 items-center gap-2">
          <Button
            size="sm"
            className="h-8 rounded-lg bg-primary px-3 text-xs font-semibold text-white shadow-sm hover:opacity-90"
            onClick={async () => {
              await promptInstall();
            }}
          >
            Install
          </Button>
          <button
            onClick={dismissPrompt}
            aria-label="Dismiss install banner"
            className="flex h-7 w-7 items-center justify-center rounded-lg text-muted-foreground transition-colors hover:bg-accent hover:text-foreground"
          >
            <X className="h-3.5 w-3.5" />
          </button>
        </div>
      </div>
    </div>
  );
}
