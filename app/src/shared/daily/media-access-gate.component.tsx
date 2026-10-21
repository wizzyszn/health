import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import {
  AlertTriangle,
  Camera,
  CameraOff,
  Check,
  Copy,
  Loader2,
  Mic,
  MicOff,
  ShieldCheck,
} from "lucide-react";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  describeMediaAccessError,
  detectInAppBrowser,
  detectMobilePlatform,
  getMediaPermissionHelpLines,
  getMediaPermissionSnapshot,
  requestMediaAccess,
  stopMediaStream,
  type MediaAccessErrorDetails,
  type MediaAccessKind,
  type MediaAccessPreferences,
  type MediaPermissionSnapshot,
  type MediaPermissionState,
} from "./media-access.util";

interface MediaAccessGateProps {
  /** Preferred media when both permissions are already granted. */
  defaultPreferences: MediaAccessPreferences;
  onReady: (preferences: MediaAccessPreferences) => void;
  onCancel: () => void;
}

const PERMISSION_LABELS: Record<MediaPermissionState, string> = {
  granted: "Allowed",
  denied: "Blocked",
  prompt: "Ask next",
  unknown: "Ask next",
};

const PERMISSION_STYLES: Record<MediaPermissionState, string> = {
  granted: "border-emerald-200 bg-emerald-50 text-emerald-700",
  denied: "border-red-200 bg-red-50 text-red-700",
  prompt: "border-amber-200 bg-amber-50 text-amber-700",
  unknown: "border-gray-200 bg-gray-50 text-gray-600",
};

function PermissionRow({
  kind,
  state,
}: {
  kind: MediaAccessKind;
  state: MediaPermissionState;
}) {
  const granted = state === "granted";
  const denied = state === "denied";
  const Icon =
    kind === "audio" ? (granted ? Mic : MicOff) : granted ? Camera : CameraOff;

  return (
    <div className="flex items-center justify-between gap-2 rounded-lg border border-border px-3 py-2">
      <span className="flex items-center gap-2 text-xs font-medium text-gray-700">
        {granted ? (
          <Check className="size-3.5 text-emerald-600" aria-hidden="true" />
        ) : (
          <Icon
            className={`size-3.5 ${denied ? "text-red-500" : "text-gray-500"}`}
            aria-hidden="true"
          />
        )}
        {kind === "audio" ? "Microphone" : "Camera"}
      </span>
      <span
        className={`rounded-full border px-2 py-0.5 text-[10px] font-semibold ${PERMISSION_STYLES[state]}`}
      >
        {PERMISSION_LABELS[state]}
      </span>
    </div>
  );
}

function ErrorHelp({ error }: { error: MediaAccessErrorDetails }) {
  const helpLines = getMediaPermissionHelpLines({
    code: error.code,
    mobilePlatform: detectMobilePlatform(),
    inAppBrowser: detectInAppBrowser(),
  });

  return (
    <div
      role="alert"
      className="rounded-xl border border-red-200 bg-red-50 p-3 text-left"
    >
      <div className="flex items-start gap-2">
        <AlertTriangle
          className="mt-0.5 size-4 shrink-0 text-red-500"
          aria-hidden="true"
        />
        <div className="min-w-0">
          <p className="text-sm font-semibold text-red-800">{error.title}</p>
          <p className="mt-0.5 text-xs leading-relaxed text-red-700">
            {error.message}
          </p>
          {helpLines.length > 0 && (
            <ul className="mt-2 list-disc space-y-1 pl-4 text-[11px] leading-relaxed text-red-700">
              {helpLines.map((line) => (
                <li key={line}>{line}</li>
              ))}
            </ul>
          )}
        </div>
      </div>
    </div>
  );
}

/**
 * Pre-call permission gate.
 *
 * Mobile browsers (especially Chrome on Android and iOS Safari/Chrome) only
 * grant camera/microphone access reliably when the prompt follows a direct
 * tap. Joining automatically from an effect can therefore leave the call with
 * no media and no way to recover. This gate makes the permission request an
 * explicit gesture and gives blocked users a way forward.
 */
export function MediaAccessGate({
  defaultPreferences,
  onReady,
  onCancel,
}: MediaAccessGateProps) {
  const [permissions, setPermissions] =
    useState<MediaPermissionSnapshot | null>(null);
  const [isChecking, setIsChecking] = useState(true);
  const [isRequesting, setIsRequesting] = useState(false);
  const [error, setError] = useState<MediaAccessErrorDetails | null>(null);
  const [inAppBrowser] = useState(() => detectInAppBrowser());

  const permissionError = useMemo<MediaAccessErrorDetails | null>(() => {
    if (!permissions) return null;

    const blocked: MediaAccessKind[] = [];
    if (permissions.audio === "denied") blocked.push("audio");
    if (permissions.video === "denied") blocked.push("video");
    if (blocked.length === 0) return null;

    const label =
      blocked.length === 2
        ? "Camera and microphone"
        : blocked[0] === "audio"
          ? "Microphone"
          : "Camera";

    return {
      code: "permission-denied",
      title: `${label} blocked`,
      message: `Your browser has blocked ${label.toLowerCase()} access for this site. Allow access in your browser settings, then try again.`,
      media: blocked,
    };
  }, [permissions]);

  const visibleError = error ?? permissionError;

  const mountedRef = useRef(true);
  const readyRef = useRef(false);

  useEffect(() => {
    mountedRef.current = true;
    return () => {
      mountedRef.current = false;
    };
  }, []);

  const finish = useCallback(
    (preferences: MediaAccessPreferences) => {
      if (readyRef.current || !mountedRef.current) return;
      readyRef.current = true;
      onReady(preferences);
    },
    [onReady],
  );

  useEffect(() => {
    let cancelled = false;

    void getMediaPermissionSnapshot().then((snapshot) => {
      if (cancelled || !mountedRef.current) return;

      setPermissions(snapshot);
      setIsChecking(false);

      // Returning users have already granted both permissions; keep the
      // existing one-tap join experience for them.
      if (snapshot.audio === "granted" && snapshot.video === "granted") {
        finish(defaultPreferences);
      }
    });

    return () => {
      cancelled = true;
    };
  }, [defaultPreferences, finish]);

  const request = async (preferences: MediaAccessPreferences) => {
    if (isRequesting) return;

    setIsRequesting(true);
    setError(null);

    try {
      const stream = await requestMediaAccess(preferences);
      stopMediaStream(stream);

      // Give the OS/browser a moment to release the camera before Daily asks
      // for it again. Without this pause, some Android devices answer the
      // second request with NotReadableError even though permission is fine.
      await new Promise((resolve) => window.setTimeout(resolve, 200));

      if (!mountedRef.current) return;
      setIsRequesting(false);
      finish(preferences);
    } catch (requestError) {
      if (!mountedRef.current) return;

      setError(describeMediaAccessError(requestError, preferences));
      setIsRequesting(false);

      const latestPermissions = await getMediaPermissionSnapshot();
      if (mountedRef.current) setPermissions(latestPermissions);
    }
  };

  const copyLink = async () => {
    try {
      await navigator.clipboard.writeText(window.location.href);
      toast.success("Link copied. Open it in Chrome or Safari.");
    } catch {
      toast.warning("Couldn't copy the link. Copy it from the address bar.");
    }
  };

  return (
    <Dialog
      open
      onOpenChange={(open) => {
        if (!open) onCancel();
      }}
    >
      <DialogContent className="max-h-[90dvh] max-w-md overflow-y-auto rounded-2xl p-5 text-left sm:p-6">
        <DialogHeader className="space-y-2 text-left">
          <div className="flex size-11 items-center justify-center rounded-xl bg-primary/10 text-primary">
            <ShieldCheck className="size-6" aria-hidden="true" />
          </div>
          <DialogTitle>Set up camera &amp; microphone</DialogTitle>
          <DialogDescription className="text-xs leading-relaxed sm:text-sm">
            Your browser will ask for permission. We only use your camera and
            microphone during this consultation.
          </DialogDescription>
        </DialogHeader>

        {isChecking ? (
          <div className="flex items-center justify-center gap-2 py-8 text-sm text-gray-500">
            <Loader2 className="size-4 animate-spin" aria-hidden="true" />
            Checking device permissions…
          </div>
        ) : (
          <div className="mt-4 space-y-3">
            {inAppBrowser && (
              <div className="rounded-xl border border-amber-200 bg-amber-50 p-3 text-left">
                <div className="flex items-start gap-2">
                  <AlertTriangle
                    className="mt-0.5 size-4 shrink-0 text-amber-600"
                    aria-hidden="true"
                  />
                  <div className="min-w-0">
                    <p className="text-xs font-semibold text-amber-800">
                      Open this page in a full browser
                    </p>
                    <p className="mt-0.5 text-[11px] leading-relaxed text-amber-700">
                      {inAppBrowser} can block camera and microphone access.
                      Open the link in Chrome or Safari for the best call
                      experience.
                    </p>
                    <Button
                      type="button"
                      size="sm"
                      variant="outline"
                      className="mt-2 h-7 border-amber-300 bg-white text-[10px] text-amber-800 hover:bg-amber-100"
                      onClick={() => void copyLink()}
                    >
                      <Copy className="mr-1.5 size-3" aria-hidden="true" />
                      Copy page link
                    </Button>
                  </div>
                </div>
              </div>
            )}

            {permissions && (
              <div className="grid grid-cols-2 gap-2">
                <PermissionRow kind="audio" state={permissions.audio} />
                <PermissionRow kind="video" state={permissions.video} />
              </div>
            )}

            {visibleError && <ErrorHelp error={visibleError} />}

            {!visibleError && (
              <p className="rounded-lg bg-gray-50 p-2.5 text-[11px] leading-relaxed text-gray-500">
                If the prompt doesn't appear, check the site permissions in your
                browser settings. On a phone, make sure no other app is using
                the camera or microphone.
              </p>
            )}

            <div className="flex flex-col gap-2">
              <Button
                type="button"
                className="h-11 w-full text-sm"
                disabled={isRequesting}
                onClick={() => void request({ audio: true, video: true })}
              >
                {isRequesting ? (
                  <>
                    <Loader2
                      className="mr-2 size-4 animate-spin"
                      aria-hidden="true"
                    />
                    Requesting access…
                  </>
                ) : (
                  <>
                    <Camera className="mr-2 size-4" aria-hidden="true" />
                    Join with camera &amp; microphone
                  </>
                )}
              </Button>
              <Button
                type="button"
                variant="outline"
                className="h-10 w-full text-sm"
                disabled={isRequesting}
                onClick={() => void request({ audio: true, video: false })}
              >
                <Mic className="mr-2 size-4" aria-hidden="true" />
                Join with microphone only
              </Button>
              <Button
                type="button"
                variant="ghost"
                className="h-9 w-full text-xs text-gray-500"
                disabled={isRequesting}
                onClick={onCancel}
              >
                Cancel
              </Button>
            </div>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}
