/**
 * Maps the backend's deep_link route hints (spec §3: "a route hint, not a
 * URL") onto this app's real navigation routes, per role.
 *
 * Verified app routes:
 *   patient → /patient/dashboard/{appointments,consultations,referrals}/:id
 *             /patient/dashboard/appointments/:id/video
 *   doctor  → /doctor/dashboard/{appointments,consultations}/:id
 *             (no doctor investigations route exists)
 */
import { parseVideoDeepLink } from "@/shared/utils/video-session-errors.util";
import type { NotificationItem } from "./notification.types";

export type NotifRole = "patient" | "doctor";

export interface ResolvedLink {
  to: string;
  /** True when no safe destination existed; UI should keep the feed open. */
  fallback: boolean;
}

const ID_PATTERN = "([^/\\s]+)";

/** Extract a trailing id from a hint segment like "/appointments/:id". */
function matchHint(deepLink: string, pattern: RegExp): string | null {
  const match = pattern.exec(deepLink);
  return match?.[1] ?? null;
}

/**
 * Resolve a notification's deep_link to an in-app destination.
 * Returns null when there is no link at all; returns fallback:true when a
 * link exists but can't be safely mapped (unknown shape) — callers should
 * treat that as "stay put" rather than navigating to a 404.
 */
export function resolveNotificationLink(
  item: Pick<NotificationItem, "deep_link" | "type">,
  role: NotifRole,
): ResolvedLink | null {
  const hint = item.deep_link;
  if (!hint || typeof hint !== "string") return null;

  // Video room — reuse the parser built for exactly this push.
  if (item.type === "VIDEO_ROOM_OPENED") {
    const parsed = parseVideoDeepLink(hint);
    if (!parsed) return { to: "", fallback: true };
    // The call screen is patient-side only.
    return role === "patient"
      ? {
          to: `/patient/dashboard/appointments/${parsed.appointmentId}/video`,
          fallback: false,
        }
      : {
          to: `/doctor/dashboard/appointments/${parsed.appointmentId}`,
          fallback: false,
        };
  }

  // Appointments
  const appointmentId = matchHint(
    hint,
    new RegExp(`^/appointments/${ID_PATTERN}$`),
  );
  if (appointmentId) {
    return {
      to:
        role === "patient"
          ? `/patient/dashboard/appointments/${appointmentId}`
          : `/doctor/dashboard/appointments/${appointmentId}`,
      fallback: false,
    };
  }

  // Consultations (+ sub-sections collapse to the consultation space)
  const consultationMatch = /^\/consultations\/([^/\s]+)(?:\/([a-z-]+))?$/.exec(
    hint,
  );
  if (consultationMatch) {
    const consultationId = consultationMatch[1];
    const prefix =
      role === "patient"
        ? "/patient/dashboard/consultations"
        : "/doctor/dashboard/consultations";
    return { to: `${prefix}/${consultationId}`, fallback: false };
  }

  // Referrals (patient-side detail page)
  const referralId = matchHint(hint, new RegExp(`^/referrals/${ID_PATTERN}$`));
  if (referralId) {
    return role === "patient"
      ? { to: `/patient/dashboard/referrals/${referralId}`, fallback: false }
      : { to: "", fallback: true }; // doctor tree has no referral detail route
  }

  // Investigations — doctor has no standalone route today; fall back safely.
  const investigationId = matchHint(
    hint,
    new RegExp(`^/investigations/${ID_PATTERN}$`),
  );
  if (investigationId) {
    return role === "patient"
      ? { to: "/patient/dashboard/investigation", fallback: true }
      : { to: "", fallback: true };
  }

  // Unknown hint shapes must never navigate blind.
  return { to: "", fallback: true };
}
