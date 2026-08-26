import type { GeneralReturnInt } from "@/lib/types";
import { options, requestHandler, urlGenerator } from "./config";
import type {
  DeleteNotificationResult,
  MarkAllReadResult,
  NotificationFeed,
  NotificationItem,
  NotificationListParams,
  UnreadCount,
} from "@/shared/notifications/notification.types";

type RoleTree = "patients" | "doctors";

const PER_PAGE_MIN = 1;
const PER_PAGE_MAX = 100;

/**
 * Serialize ONLY the allowlisted list params (spec §2: unknown query params
 * are rejected with 400 API-wide — never spread arbitrary objects).
 * Output shape: "page=1&perPage=20&status=all" (no leading '?').
 */
export function buildListQuery(params: NotificationListParams): string {
  if (
    !Number.isInteger(params.perPage) ||
    params.perPage < PER_PAGE_MIN ||
    params.perPage > PER_PAGE_MAX
  ) {
    throw new RangeError(
      `perPage must be an integer between ${PER_PAGE_MIN} and ${PER_PAGE_MAX}`,
    );
  }
  const qs = new URLSearchParams({
    page: String(Math.max(1, Math.floor(params.page))),
    perPage: String(params.perPage),
    status: params.status,
  });
  if (params.category) qs.set("category", params.category);
  if (params.type) qs.set("type", params.type);
  return qs.toString();
}

/**
 * All ten notification endpoints (spec §2), parameterized by role tree.
 * The patient and doctor sets are identical apart from the URL prefix.
 */
export function createNotificationsService(roleTree: RoleTree) {
  const base = "me/notifications";

  /** Feed + pagination + bundled unread_count (one request for the whole page). */
  const getFeedReq = (
    params: NotificationListParams,
  ): Promise<GeneralReturnInt<NotificationFeed>> =>
    requestHandler<GeneralReturnInt<NotificationFeed>>(
      urlGenerator(roleTree, base, false, buildListQuery(params)),
      options("GET", null, true),
    );

  /** Single indexed count — cheap enough to poll (spec §7). */
  const getUnreadCountReq = (): Promise<GeneralReturnInt<UnreadCount>> =>
    requestHandler<GeneralReturnInt<UnreadCount>>(
      urlGenerator(roleTree, `${base}/unread-count`, false),
      options("GET", null, true),
    );

  const markReadReq = (
    id: string,
  ): Promise<GeneralReturnInt<NotificationItem>> =>
    requestHandler<GeneralReturnInt<NotificationItem>>(
      urlGenerator(roleTree, `${base}/${id}/read`, false),
      options("PATCH", {}, true),
    );

  const markAllReadReq = (): Promise<GeneralReturnInt<MarkAllReadResult>> =>
    requestHandler<GeneralReturnInt<MarkAllReadResult>>(
      urlGenerator(roleTree, `${base}/read-all`, false),
      options("PATCH", {}, true),
    );

  /**
   * Deleting another user's notification returns 404 (spec §7) — callers
   * should treat that as already-gone and remove the row anyway.
   */
  const deleteReq = (
    id: string,
  ): Promise<GeneralReturnInt<DeleteNotificationResult>> =>
    requestHandler<GeneralReturnInt<DeleteNotificationResult>>(
      urlGenerator(roleTree, `${base}/${id}`, false),
      options("DELETE", {}, true),
    );

  return {
    getFeedReq,
    getUnreadCountReq,
    markReadReq,
    markAllReadReq,
    deleteReq,
  };
}

export const patientNotificationsService =
  createNotificationsService("patients");
export const doctorNotificationsService = createNotificationsService("doctors");

/** Pick the right service from the Redux auth role. */
export function notificationsServiceForRole(
  role: "patient" | "doctor" | "admin" | undefined,
): ReturnType<typeof createNotificationsService> | null {
  if (role === "patient") return patientNotificationsService;
  if (role === "doctor") return doctorNotificationsService;
  return null;
}
