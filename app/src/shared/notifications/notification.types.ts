/**
 * In-app notification domain types.
 * Contract reference: docs/in-app-notifications.spec.md (backend handoff).
 */

/** Feed tab categories (spec §4). */
export const NOTIFICATION_CATEGORIES = [
  "APPOINTMENT",
  "CONSULTATION",
  "CLINICAL",
  "VIDEO",
  "REMINDER",
] as const;
export type NotificationCategory = (typeof NOTIFICATION_CATEGORIES)[number];

/**
 * The 15 known notification types (spec §4). Values are stable server-side;
 * the `(string & {})` widening tolerates future additions at the type level
 * while keeping autocomplete for these known members. UI must treat unknown
 * values gracefully (icon-map fallback) — never assume exhaustive coverage.
 */
export const NOTIFICATION_TYPES = [
  "APPOINTMENT_BOOKED",
  "APPOINTMENT_REQUEST_RECEIVED",
  "APPOINTMENT_CONFIRMED",
  "APPOINTMENT_CANCELLED",
  "APPOINTMENT_RESCHEDULED",
  "APPOINTMENT_REASSIGNED",
  "APPOINTMENT_REMOVED",
  "APPOINTMENT_REMINDER_24H",
  "APPOINTMENT_REMINDER_1H",
  "VIDEO_ROOM_OPENED",
  "CONSULTATION_SUMMARY_AVAILABLE",
  "INVESTIGATIONS_REQUESTED",
  "PRESCRIPTION_READY",
  "REFERRAL_AVAILABLE",
  "INVESTIGATION_RESULTS_UPLOADED",
] as const;
export type NotificationType = (typeof NOTIFICATION_TYPES)[number];

export type NotificationReadStatusFilter = "read" | "unread" | "all";

export interface NotificationItem {
  _id: string;
  recipient_type: "patient" | "doctor";
  type: NotificationType | (string & {});
  category: NotificationCategory | (string & {});
  /** Pre-rendered by the backend — display verbatim (spec §3). */
  title: string;
  /** Pre-rendered; times already in the recipient's timezone — never reconvert. */
  body: string;
  /**
   * Raw ids/counts/UTC timestamps for custom rendering. NEVER surface these
   * as body text — clinical detail must stay behind the deep link (spec §4).
   */
  data?: Record<string, unknown> | null;
  appointment_id?: string | null;
  consultation_id?: string | null;
  actor_id?: string | null;
  actor_type?: "patient" | "doctor" | null;
  /** Route HINT, not a URL — resolve through deep-link.resolver before use. */
  deep_link?: string | null;
  is_read: boolean;
  read_at?: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface NotificationPagination {
  total: number;
  page: number;
  perPage: number;
  /** 1 when total is 0, never 0 (spec §3). */
  total_pages: number;
}

export interface NotificationFeed {
  items: NotificationItem[];
  pagination: NotificationPagination;
  /** Bundled with every feed response — no second call needed for the badge. */
  unread_count: number;
}

export interface UnreadCount {
  unread: number;
}

export interface MarkAllReadResult {
  modified: number;
}

export interface DeleteNotificationResult {
  deleted: boolean;
}

/**
 * The ONLY keys ever serialized into a list request. Unknown query params
 * are rejected with 400 API-wide (spec §2) — never spread arbitrary objects
 * into the query string.
 */
export interface NotificationListParams {
  page: number; // ≥ 1
  perPage: number; // integer, 1–100 inclusive; outside is rejected not clamped
  status: NotificationReadStatusFilter;
  category?: NotificationCategory;
  type?: NotificationType;
}
