/**
 * Live notification bell: unread badge (polled), recent-feed popover,
 * mark-all-read, and tap-through via deep links. Replaces the decorative
 * static bell in DashHeader for both roles.
 */
import { useRef, useState } from "react";
import { useNavigate } from "react-router-dom";
import { VscBell } from "react-icons/vsc";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { Button } from "@/components/ui/button";
import {
  useNotificationsController,
  POPOVER_PER_PAGE,
} from "./use-notifications.hook";
import { NotificationRow } from "./notification-row.component";

const RECENT_COUNT = 6;

export function NotificationBell() {
  const navigate = useNavigate();
  const [open, setOpen] = useState(false);
  const previousUnreadRef = useRef<number | null>(null);

  const {
    isNotificationUser,
    unread,
    feed,
    isLoadingFeed,
    feedError,
    refetchFeed,
    markRead,
    markAllRead,
  } = useNotificationsController({ perPage: POPOVER_PER_PAGE });

  const previousUnread = previousUnreadRef.current;
  previousUnreadRef.current = unread;
  // Pulse the bell once when the count grows while closed.
  const justIncreased =
    previousUnread !== null && unread > previousUnread && !open;

  // Admin/unknown roles: keep the old inert bell rather than a broken one.
  if (!isNotificationUser) {
    return (
      <div className="order-2 flex items-center md:order-1">
        <button
          className="group relative flex size-9 cursor-pointer items-center justify-center rounded-full bg-gray-100 transition-colors duration-200 hover:bg-gray-200"
          aria-label="Notifications"
          type="button"
        >
          <VscBell size={18} color="#555" />
        </button>
      </div>
    );
  }

  const items = feed?.items.slice(0, RECENT_COUNT) ?? [];

  return (
    <div className="order-2 flex items-center md:order-1">
      <Popover open={open} onOpenChange={setOpen}>
        <PopoverTrigger asChild>
          <button
            className={`group relative flex size-9 cursor-pointer items-center justify-center rounded-full bg-gray-100 transition-colors duration-200 hover:bg-gray-200 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 ${
              justIncreased ? "animate-pulse" : ""
            }`}
            aria-label={
              unread > 0 ? `Notifications, ${unread} unread` : "Notifications"
            }
            type="button"
          >
            <VscBell size={18} color="#555" />
            {unread > 0 && (
              <span className="absolute -right-0.5 -top-0.5 flex h-4 min-w-4 items-center justify-center rounded-full border border-white bg-red-500 px-1 text-[10px] font-semibold leading-none text-white">
                {unread > 9 ? "9+" : unread}
              </span>
            )}
          </button>
        </PopoverTrigger>

        <PopoverContent
          align="end"
          sideOffset={8}
          className="w-[min(24rem,calc(100vw-1.5rem))] rounded-xl p-2 shadow-lg"
        >
          {/* Header */}
          <div className="flex items-center justify-between px-2 pb-2 pt-1">
            <p className="text-sm font-semibold">Notifications</p>
            <Button
              variant="ghost"
              size="sm"
              className="h-7 gap-1 px-2 text-xs"
              disabled={unread === 0}
              onClick={() => markAllRead()}
            >
              Mark all read
            </Button>
          </div>

          <div className="max-h-[min(26rem,60vh)] overflow-y-auto">
            {isLoadingFeed ? (
              <div className="flex flex-col gap-2 p-3">
                {[...Array<undefined>(4)].map((_, index) => (
                  <div key={index} className="flex animate-pulse gap-3">
                    <div className="size-9 shrink-0 rounded-full bg-muted" />
                    <div className="flex-1 space-y-1.5 py-1">
                      <div className="h-3 w-3/5 rounded bg-muted" />
                      <div className="h-2.5 w-full rounded bg-muted" />
                    </div>
                  </div>
                ))}
              </div>
            ) : feedError ? (
              <div className="flex flex-col items-center gap-2 p-6 text-center">
                <p className="text-xs text-muted-foreground">
                  Couldn't load notifications.
                </p>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => void refetchFeed()}
                >
                  Try again
                </Button>
              </div>
            ) : items.length === 0 ? (
              <div className="px-4 py-10 text-center">
                <VscBell
                  size={22}
                  className="mx-auto mb-2 text-muted-foreground/50"
                />
                <p className="text-sm font-medium">You're all caught up</p>
                <p className="mt-1 text-xs text-muted-foreground">
                  New activity will show up here.
                </p>
              </div>
            ) : (
              <div className="flex flex-col">
                {items.map((item) => (
                  <NotificationRow
                    key={item._id}
                    item={item}
                    markRead={markRead}
                    onNavigate={() => setOpen(false)}
                  />
                ))}
              </div>
            )}
          </div>

          {/* Footer */}
          {items.length > 0 && (
            <div className="border-t pt-1.5 mt-1">
              <Button
                variant="ghost"
                size="sm"
                className="w-full text-xs text-primary hover:text-primary"
                onClick={() => {
                  setOpen(false);
                  navigate(feedPathForCurrentRole());
                }}
              >
                View all notifications
              </Button>
            </div>
          )}
        </PopoverContent>
      </Popover>
    </div>
  );
}

/** Feed page path per role — mirrors how DashLayout serves both roles. */
function feedPathForCurrentRole(): string {
  const path = typeof window === "undefined" ? "" : window.location.pathname;
  return path.startsWith("/doctor")
    ? "/doctor/dashboard/notifications"
    : "/patient/dashboard/notifications";
}
