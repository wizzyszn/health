/**
 * Classifiers for the video-consultation API's error contract.
 * Reference: docs/video-call-integration.spec.md §3 (endpoints) and §6 (errors).
 */
import { asApiError } from "@/lib/api-error";

/**
 * Exact message the backend returns on the patient token route when the
 * doctor hasn't opened the room yet. Written by the backend to be shown to a
 * patient as-is (spec §3).
 */
export const ROOM_NOT_OPEN_MESSAGE =
  "Doctor hasn't opened the session yet. Please wait.";

/** Extract the most user-relevant message from any thrown value. */
function rawMessage(error: unknown): string {
  const apiError = asApiError(error);
  if (apiError?.description) return apiError.description;
  if (apiError?.message) return apiError.message;
  if (error instanceof Error) return error.message;
  return "";
}

/**
 * HTTP 400 — patient requested a token before the doctor opened the room
 * (patient token route only). The client may retry briefly with backoff;
 * see shouldRetryTokenFetch.
 *
 * Matches on the backend's fixed copy, with an httpStatus guard when the
 * structured ApiError is available so unrelated 400s don't false-positive.
 */
export function isRoomNotOpenYet(error: unknown): boolean {
  const apiError = asApiError(error);
  if (apiError?.httpStatus !== undefined && apiError.httpStatus !== 400) {
    return false;
  }
  return rawMessage(error).includes("opened the session");
}

/**
 * HTTP 409 — consultation already COMPLETED/CANCELED and cannot be reopened
 * by starting a session. Only meaningful on PATCH .../video/start.
 *
 * Spec warning: this status's response_code falls through to the literal
 * string "Internal Server error", so this deliberately branches on
 * httpStatus first, never on response_code.
 */
export function isSessionAlreadyClosed(error: unknown): boolean {
  return asApiError(error)?.httpStatus === 409;
}

/**
 * HTTP 400 "006" — outside the join window (start −10 min … scheduled end).
 * Spec instruction: show the message, don't retry.
 */
export function isOutsideJoinWindow(error: unknown): boolean {
  return (
    asApiError(error)?.responseCode === "006" ||
    rawMessage(error).includes("scheduled time")
  );
}

/**
 * HTTP 400 "006" — the appointment window has already ENDED. Distinct from
 * isOutsideJoinWindow's too-early case because the user guidance differs
 * completely (nothing to wait for; the visit can no longer be joined).
 */
export function isJoinWindowEnded(error: unknown): boolean {
  const message = rawMessage(error).toLowerCase();
  return (
    asApiError(error)?.responseCode === "006" &&
    (message.includes("already ended") ||
      message.includes("window has ended") ||
      message.includes("no longer"))
  );
}

/** HTTP 503 "016" — deployment has no Daily.co API key configured. */
export function isVideoNotConfigured(error: unknown): boolean {
  return asApiError(error)?.responseCode === "016";
}

/** HTTP 401 "011" — bad/expired token OR deactivated doctor account. */
export function isVideoAuthRejected(error: unknown): boolean {
  return asApiError(error)?.responseCode === "011";
}

/**
 * Spec §4: retrying the token fetch is acceptable ONLY for the rare
 * room-still-being-created case — never for window/auth errors.
 */
export function shouldRetryTokenFetch(error: unknown): boolean {
  return isRoomNotOpenYet(error);
}

/* ── VIDEO_ROOM_OPENED push (spec §4) ────────────────────────────────
 * Emitted by the backend the moment the doctor's room is created. The
 * patient's client should act on this notification rather than polling.
 * Full feed wiring is pending; these typed constants exist so whoever
 * builds it consumes one source of truth. */

/** Notification `type` for "the doctor's room is now open". */
export const VIDEO_ROOM_OPENED_TYPE = "VIDEO_ROOM_OPENED";

/** Deep-link path template carried by the push. */
export const VIDEO_ROOM_DEEP_LINK_TEMPLATE = "/appointments/:id/video";

/** Successfully parsed VIDEO_ROOM_OPENED deep link. */
export interface VideoDeepLink {
  appointmentId: string;
}

/**
 * Parse a VIDEO_ROOM_OPENED deep_link ("/appointments/:id/video") into its
 * appointment id. Returns null for anything else (other notification types,
 * trailing slashes, malformed ids).
 */
export function parseVideoDeepLink(deepLink: string): VideoDeepLink | null {
  const match = /^\/appointments\/([^/]+)\/video$/.exec(deepLink);
  return match?.[1] ? { appointmentId: match[1] } : null;
}
