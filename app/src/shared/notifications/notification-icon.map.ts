/**
 * Notification type → icon mapping (spec §4: "the server never sends an
 * icon or emoji — that's yours, keyed off type"). Unknown or future types
 * fall back to a neutral glyph so a new backend enum can never break the UI.
 */
import {
  BellRing,
  CalendarPlus,
  CalendarClock,
  CalendarCheck2,
  CalendarX2,
  CalendarRange,
  UserPlus,
  UserMinus,
  AlarmClock,
  Video,
  FileText,
  Stethoscope,
  Pill,
  Mail,
  Upload,
  type LucideIcon,
} from "lucide-react";
import {
  NOTIFICATION_TYPES,
  type NotificationType,
} from "./notification.types";

export const NOTIFICATION_ICON_FALLBACK: LucideIcon = BellRing;

/** One entry per known notification type. */
export const NOTIFICATION_ICONS: Record<NotificationType, LucideIcon> = {
  APPOINTMENT_BOOKED: CalendarPlus,
  APPOINTMENT_REQUEST_RECEIVED: CalendarPlus,
  APPOINTMENT_CONFIRMED: CalendarCheck2,
  APPOINTMENT_CANCELLED: CalendarX2,
  APPOINTMENT_RESCHEDULED: CalendarRange,
  APPOINTMENT_REASSIGNED: UserPlus,
  APPOINTMENT_REMOVED: UserMinus,
  APPOINTMENT_REMINDER_24H: CalendarClock,
  APPOINTMENT_REMINDER_1H: AlarmClock,
  VIDEO_ROOM_OPENED: Video,
  CONSULTATION_SUMMARY_AVAILABLE: FileText,
  INVESTIGATIONS_REQUESTED: Stethoscope,
  PRESCRIPTION_READY: Pill,
  REFERRAL_AVAILABLE: Mail,
  INVESTIGATION_RESULTS_UPLOADED: Upload,
};

/**
 * Resolve the icon for any type value — known types map directly; unknown
 * values get the fallback so the list can never crash on a new enum member.
 */
export function iconForNotificationType(type: string): LucideIcon {
  return (
    (NOTIFICATION_ICONS as Record<string, LucideIcon>)[type] ??
    NOTIFICATION_ICON_FALLBACK
  );
}

/** Type-check helper for tests and special-case UI (e.g. video highlight). */
export function isKnownNotificationType(type: string): boolean {
  return (NOTIFICATION_TYPES as readonly string[]).includes(type);
}
