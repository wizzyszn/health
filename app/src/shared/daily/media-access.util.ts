export type MediaAccessKind = "audio" | "video";

export type MediaPermissionState = "granted" | "denied" | "prompt" | "unknown";

export type MediaAccessErrorCode =
  | "permission-denied"
  | "not-found"
  | "in-use"
  | "unsupported"
  | "constraints"
  | "unknown";

export type MobilePlatform = "ios" | "android" | "desktop";

export interface MediaAccessPreferences {
  audio: boolean;
  video: boolean;
}

export interface MediaPermissionSnapshot {
  audio: MediaPermissionState;
  video: MediaPermissionState;
}

export interface MediaAccessErrorDetails {
  code: MediaAccessErrorCode;
  title: string;
  message: string;
  media: MediaAccessKind[];
}

interface DailyCameraErrorLike {
  error?: {
    type?: string;
    msg?: string;
    blockedMedia?: string[];
    missingMedia?: string[];
  };
  errorMsg?: {
    errorMsg?: string;
  };
}

export function getRequestedMedia(
  preferences: MediaAccessPreferences,
): MediaAccessKind[] {
  const media: MediaAccessKind[] = [];
  if (preferences.audio) media.push("audio");
  if (preferences.video) media.push("video");
  return media;
}

function mediaLabel(media: MediaAccessKind[]): string {
  if (media.length > 1) return "camera and microphone";
  return media[0] === "video" ? "camera" : "microphone";
}

async function queryPermission(
  kind: MediaAccessKind,
): Promise<MediaPermissionState> {
  if (typeof navigator === "undefined" || !navigator.permissions?.query) {
    return "unknown";
  }

  try {
    const descriptor = {
      name: kind === "audio" ? "microphone" : "camera",
    } as unknown as PermissionDescriptor;
    const status = await navigator.permissions.query(descriptor);
    return status.state;
  } catch {
    // Safari does not expose camera/microphone through the Permissions API.
    return "unknown";
  }
}

/** Best-effort permission read. "unknown" simply means "ask on next tap". */
export async function getMediaPermissionSnapshot(): Promise<MediaPermissionSnapshot> {
  const [audio, video] = await Promise.all([
    queryPermission("audio"),
    queryPermission("video"),
  ]);

  return { audio, video };
}

/**
 * Requests camera/microphone access from an actual user gesture. The returned
 * stream must be stopped if the caller only needed to confirm permission.
 */
export async function requestMediaAccess(
  preferences: MediaAccessPreferences,
): Promise<MediaStream> {
  if (typeof window !== "undefined" && !window.isSecureContext) {
    throw new DOMException(
      "Camera and microphone access requires a secure (HTTPS) connection.",
      "SecurityError",
    );
  }

  if (!navigator.mediaDevices?.getUserMedia) {
    throw new DOMException(
      "This browser cannot access the camera or microphone.",
      "TypeError",
    );
  }

  const media = getRequestedMedia(preferences);
  if (media.length === 0) {
    throw new DOMException("No media access was requested.", "TypeError");
  }

  return navigator.mediaDevices.getUserMedia({
    audio: preferences.audio
      ? {
          echoCancellation: true,
          noiseSuppression: true,
          autoGainControl: true,
        }
      : false,
    video: preferences.video
      ? {
          facingMode: { ideal: "user" },
          width: { ideal: 1280 },
          height: { ideal: 720 },
        }
      : false,
  });
}

export function stopMediaStream(stream: MediaStream | null | undefined): void {
  stream?.getTracks().forEach((track) => track.stop());
}

function errorName(error: unknown): string {
  if (error instanceof DOMException || error instanceof Error) {
    return error.name;
  }
  return "";
}

function errorMessage(error: unknown): string {
  if (error instanceof DOMException || error instanceof Error) {
    return error.message;
  }
  return "";
}

export function describeMediaAccessError(
  error: unknown,
  preferences: MediaAccessPreferences,
): MediaAccessErrorDetails {
  const media = getRequestedMedia(preferences);
  const name = errorName(error);
  const fallbackMessage = errorMessage(error);

  if (typeof window !== "undefined" && !window.isSecureContext) {
    return {
      code: "unsupported",
      title: "A secure connection is required",
      message:
        "Camera and microphone access only works over HTTPS. Open this page using a secure link.",
      media,
    };
  }

  if (
    name === "NotAllowedError" ||
    name === "PermissionDeniedError" ||
    name === "SecurityError"
  ) {
    return {
      code: "permission-denied",
      title: `${capitalize(mediaLabel(media))} blocked`,
      message: `Your browser is blocking access to your ${mediaLabel(media)}. Allow access for this site, then try again.`,
      media,
    };
  }

  if (name === "NotFoundError" || name === "DevicesNotFoundError") {
    return {
      code: "not-found",
      title: `No ${mediaLabel(media)} found`,
      message: `This device doesn't have a usable ${mediaLabel(media)}. Connect one or try another device.`,
      media,
    };
  }

  if (
    name === "NotReadableError" ||
    name === "TrackStartError" ||
    name === "AbortError"
  ) {
    return {
      code: "in-use",
      title: `${capitalize(mediaLabel(media))} unavailable`,
      message: `Your ${mediaLabel(media)} is being used by another app or browser tab. Close it, then try again.`,
      media,
    };
  }

  if (
    name === "OverconstrainedError" ||
    name === "ConstraintNotSatisfiedError"
  ) {
    return {
      code: "constraints",
      title: "Device settings aren't supported",
      message: `Your ${mediaLabel(media)} can't use the requested settings. Try another browser or device.`,
      media,
    };
  }

  if (name === "TypeError") {
    return {
      code: "unsupported",
      title: "Camera and microphone unavailable",
      message:
        "This browser cannot access the camera or microphone. Open the page in Chrome or Safari over HTTPS.",
      media,
    };
  }

  return {
    code: "unknown",
    title: "Couldn't start your camera or microphone",
    message:
      fallbackMessage ||
      `We couldn't access your ${mediaLabel(media)}. Check your device settings and try again.`,
    media,
  };
}

/** Maps Daily's camera-error payload to the same user-facing contract. */
export function describeDailyCameraError(
  event: DailyCameraErrorLike | undefined,
  preferences: MediaAccessPreferences,
): MediaAccessErrorDetails {
  const type = event?.error?.type;
  const blockedMedia = (event?.error?.blockedMedia ?? []).filter(
    (kind): kind is MediaAccessKind => kind === "audio" || kind === "video",
  );
  const missingMedia = (event?.error?.missingMedia ?? []).filter(
    (kind): kind is MediaAccessKind => kind === "audio" || kind === "video",
  );

  if (type === "permissions") {
    return describeMediaAccessError(
      new DOMException(
        event?.error?.msg ?? "Permission denied",
        "NotAllowedError",
      ),
      blockedMedia.length > 0 ? mediaPreferences(blockedMedia) : preferences,
    );
  }

  if (type === "not-found") {
    return describeMediaAccessError(
      new DOMException(
        event?.error?.msg ?? "Device not found",
        "NotFoundError",
      ),
      missingMedia.length > 0 ? mediaPreferences(missingMedia) : preferences,
    );
  }

  if (
    type === "cam-in-use" ||
    type === "mic-in-use" ||
    type === "cam-mic-in-use"
  ) {
    const media: MediaAccessKind[] =
      type === "cam-in-use"
        ? ["video"]
        : type === "mic-in-use"
          ? ["audio"]
          : ["audio", "video"];
    return describeMediaAccessError(
      new DOMException(event?.error?.msg ?? "Device busy", "NotReadableError"),
      mediaPreferences(media),
    );
  }

  if (type === "constraints") {
    return describeMediaAccessError(
      new DOMException(
        event?.error?.msg ?? "Constraints not satisfied",
        "OverconstrainedError",
      ),
      preferences,
    );
  }

  if (type === "undefined-mediadevices") {
    return describeMediaAccessError(
      new DOMException(
        event?.error?.msg ?? "Media devices unavailable",
        "TypeError",
      ),
      preferences,
    );
  }

  return {
    code: "unknown",
    title: "Couldn't start your camera or microphone",
    message:
      event?.errorMsg?.errorMsg ||
      event?.error?.msg ||
      "Check your device settings and try again.",
    media: getRequestedMedia(preferences),
  };
}

function mediaPreferences(media: MediaAccessKind[]): MediaAccessPreferences {
  return {
    audio: media.includes("audio"),
    video: media.includes("video"),
  };
}

function capitalize(value: string): string {
  return value.charAt(0).toUpperCase() + value.slice(1);
}

export function detectMobilePlatform(
  userAgent = typeof navigator === "undefined" ? "" : navigator.userAgent,
): MobilePlatform {
  if (/iPhone|iPad|iPod/i.test(userAgent)) return "ios";
  if (/Android/i.test(userAgent)) return "android";
  return "desktop";
}

/** Named in-app browsers known to restrict or block getUserMedia. */
export function detectInAppBrowser(
  userAgent = typeof navigator === "undefined" ? "" : navigator.userAgent,
): string | null {
  const known: Array<[RegExp, string]> = [
    [/Instagram/i, "Instagram"],
    [/WhatsApp/i, "WhatsApp"],
    [/FBAN|FBAV|FB_IAB|FB4A/i, "Facebook"],
    [/TikTok|BytedanceWebview|musical_ly/i, "TikTok"],
    [/Snapchat/i, "Snapchat"],
    [/LinkedInApp/i, "LinkedIn"],
    [/Telegram/i, "Telegram"],
    [/Twitter/i, "X"],
    [/Line\//i, "LINE"],
    [/GSA\//i, "Google"],
    [/; wv\)/i, "an embedded app"],
  ];

  return known.find(([pattern]) => pattern.test(userAgent))?.[1] ?? null;
}

export function getMediaPermissionHelpLines(options: {
  code: MediaAccessErrorCode;
  mobilePlatform: MobilePlatform;
  inAppBrowser: string | null;
}): string[] {
  const { code, mobilePlatform, inAppBrowser } = options;
  const lines: string[] = [];

  if (inAppBrowser) {
    lines.push(
      `You're using ${inAppBrowser}'s in-app browser, which often blocks camera and microphone access.`,
    );
    lines.push(
      "Open this page in Chrome or Safari: use the browser menu and choose “Open in browser”.",
    );
  }

  if (code === "in-use") {
    lines.push(
      "Close other apps, camera apps, and browser tabs that may be using the camera or microphone.",
    );
    lines.push("Then return here and tap the mic or camera button again.");
    return lines;
  }

  if (code === "not-found") {
    lines.push(
      "Connect a working camera and microphone, or switch to another phone, tablet, or computer.",
    );
    return lines;
  }

  if (code === "unsupported") {
    lines.push(
      "Open the invitation in an up-to-date Chrome, Safari, or Edge browser over HTTPS.",
    );
    return lines;
  }

  if (code === "constraints") {
    lines.push("Try a different camera or browser, then reload this page.");
    return lines;
  }

  if (mobilePlatform === "ios") {
    lines.push(
      "Open iPhone Settings, find Chrome (or Safari), and allow Camera and Microphone.",
    );
    lines.push(
      "In Safari, tap the “aA” button in the address bar, open Website Settings, and allow Camera and Microphone.",
    );
    lines.push("Fully close the browser, reopen this page, and try again.");
  } else if (mobilePlatform === "android") {
    lines.push(
      "In Chrome, tap the lock or tune icon beside the address, open Permissions, and allow Camera and Microphone.",
    );
    lines.push("Reload this page after changing the permission.");
  } else {
    lines.push(
      "Click the lock or tune icon beside the address, open Site settings, and allow Camera and Microphone.",
    );
    lines.push("Reload this page after changing the permission.");
  }

  lines.push(
    "If it still fails, check that no other app or browser tab is using the camera or microphone.",
  );
  return lines;
}
