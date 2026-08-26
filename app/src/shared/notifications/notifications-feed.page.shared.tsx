/**
 * Full notification feed: category tabs, unread toggle, pagination,
 * mark-all-read and per-row delete. Shared by patient and doctor dashboards
 * (route decides which mounts it; role comes from the auth store).
 *
 * Contract reference: docs/in-app-notifications.spec.md §2 (params) §8.
 */
import { useState } from "react";
import { BellRing } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Pagination } from "@/shared/components/pagination.component.shared";
import type { NotificationCategory } from "./notification.types";
import { useNotificationsController } from "./use-notifications.hook";
import { NotificationRow } from "./notification-row.component";

const TAB_LABELS: Record<NotificationCategory | "ALL", string> = {
  ALL: "All",
  APPOINTMENT: "Appointments",
  CONSULTATION: "Consultations",
  CLINICAL: "Clinical",
  VIDEO: "Video",
  REMINDER: "Reminders",
};

export function NotificationsFeedPage() {
  const [deletingIds, setDeletingIds] = useState<Set<string>>(new Set());

  const {
    isNotificationUser,
    unread,
    feed,
    params,
    setPage,
    setStatus,
    setCategory,
    isLoadingFeed,
    isFetchingFeed,
    feedError,
    refetchFeed,
    markRead,
    markAllRead,
    remove,
  } = useNotificationsController();

  const activeTab: NotificationCategory | "ALL" = params.category ?? "ALL";
  const unreadOnly = params.status === "unread";

  const handleDelete = (id: string) => {
    setDeletingIds((current) => new Set(current).add(id));
    remove(id);
    // Clear the in-flight flag on next tick after the cache updates.
    window.setTimeout(() => {
      setDeletingIds((current) => {
        const next = new Set(current);
        next.delete(id);
        return next;
      });
    }, 1500);
  };

  const items = feed?.items ?? [];
  const totalPages = feed?.pagination.total_pages ?? 1;
  const isEmptyFeed = !isLoadingFeed && !feedError && items.length === 0;
  const isFilteredEmpty = isEmptyFeed && (unreadOnly || activeTab !== "ALL");

  if (!isNotificationUser) {
    return (
      <div className="p-6">
        <h1 className="text-2xl font-semibold">Notifications</h1>
        <p className="mt-2 text-sm text-muted-foreground">
          Notifications are available for patient and doctor accounts.
        </p>
      </div>
    );
  }

  return (
    <div className="mx-auto w-full max-w-3xl">
      {/* Header */}
      <div className="mb-4 flex flex-wrap items-center justify-between gap-3 md:mb-6">
        <div>
          <h1 className="text-xl font-semibold tracking-tight sm:text-2xl">
            Notifications
          </h1>
          <p className="mt-0.5 text-xs text-muted-foreground sm:text-sm">
            {unread > 0 ? `${unread} unread` : "You're all caught up"}
          </p>
        </div>
        <Button
          variant="outline"
          size="sm"
          disabled={unread === 0}
          onClick={() => markAllRead()}
        >
          Mark all read
        </Button>
      </div>

      {/* Filters */}
      <div className="mb-4 flex flex-wrap items-center justify-between gap-3 rounded-xl border border-border bg-card p-3">
        <div className="flex flex-wrap gap-1.5">
          {(Object.keys(TAB_LABELS) as (NotificationCategory | "ALL")[]).map(
            (tab) => (
              <button
                key={tab}
                type="button"
                onClick={() => setCategory(tab === "ALL" ? undefined : tab)}
                className={`rounded-full px-3 py-1.5 text-xs font-medium transition-colors ${
                  activeTab === tab
                    ? "bg-primary text-primary-foreground"
                    : "bg-muted text-muted-foreground hover:bg-accent"
                }`}
              >
                {TAB_LABELS[tab]}
              </button>
            ),
          )}
        </div>
        <button
          type="button"
          role="switch"
          aria-checked={unreadOnly}
          onClick={() => setStatus(unreadOnly ? "all" : "unread")}
          className={`flex items-center gap-1.5 rounded-full border px-3 py-1.5 text-xs font-medium transition-colors ${
            unreadOnly
              ? "border-primary bg-primary/10 text-primary"
              : "border-border bg-background text-muted-foreground hover:bg-accent"
          }`}
        >
          <span
            className={`size-1.5 rounded-full ${
              unreadOnly ? "bg-primary" : "bg-muted-foreground/40"
            }`}
          />
          Unread only
        </button>
      </div>

      {/* List */}
      {isLoadingFeed ? (
        <div className="flex flex-col gap-2">
          {[...Array<undefined>(6)].map((_, index) => (
            <div
              key={index}
              className="flex animate-pulse gap-3 rounded-lg border border-border/60 p-3"
            >
              <div className="size-9 shrink-0 rounded-full bg-muted" />
              <div className="flex-1 space-y-2 py-1">
                <div className="h-3.5 w-2/5 rounded bg-muted" />
                <div className="h-3 w-full rounded bg-muted" />
              </div>
            </div>
          ))}
        </div>
      ) : feedError ? (
        <div className="flex flex-col items-center gap-3 rounded-xl border border-border bg-card p-10 text-center">
          <BellRing className="size-7 text-muted-foreground/50" />
          <p className="text-sm text-muted-foreground">
            Couldn't load your notifications right now.
          </p>
          <Button
            variant="outline"
            size="sm"
            onClick={() => void refetchFeed()}
          >
            Try again
          </Button>
        </div>
      ) : isEmptyFeed ? (
        <div className="flex flex-col items-center gap-2 rounded-xl border border-border bg-card p-12 text-center">
          <BellRing className="size-8 text-muted-foreground/40" />
          <p className="text-sm font-semibold">
            {isFilteredEmpty
              ? "Nothing here with these filters"
              : "No notifications yet"}
          </p>
          <p className="max-w-[38ch] text-xs leading-relaxed text-muted-foreground">
            {isFilteredEmpty
              ? "Try a different category or turn off the unread-only filter."
              : "Activity about your appointments, consultations and results will appear here."}
          </p>
        </div>
      ) : (
        <>
          <div
            className={`flex flex-col transition-opacity ${
              isFetchingFeed ? "opacity-60" : "opacity-100"
            }`}
          >
            {items.map((item) => (
              <NotificationRow
                key={item._id}
                item={item}
                markRead={markRead}
                onDelete={handleDelete}
                isDeleting={deletingIds.has(item._id)}
              />
            ))}
          </div>

          {totalPages > 1 && (
            <div className="mt-5 flex justify-center">
              <Pagination
                currentPage={feed?.pagination.page ?? params.page}
                totalPages={totalPages}
                onPageChange={(page: number) => setPage(page)}
              />
            </div>
          )}

          {/* Retention note — feed auto-expires at 180 days (spec §7). */}
          <p className="mt-4 text-center text-[11px] text-muted-foreground/70">
            Recent notifications only — entries are kept for up to 180 days.
          </p>
        </>
      )}
    </div>
  );
}

export default NotificationsFeedPage;
