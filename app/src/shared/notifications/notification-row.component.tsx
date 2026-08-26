/**
 * A single notification row — shared by the bell popover (compact) and the
 * full feed page. Tap = mark read + navigate via resolved deep_link.
 */
import { formatDistanceToNow } from "date-fns";
import { useNavigate } from "react-router-dom";
import { Loader2, Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  iconForNotificationType,
  isKnownNotificationType,
} from "./notification-icon.map";
import { resolveNotificationLink } from "./deep-link.resolver";
import type { NotificationItem } from "./notification.types";
import type { NotifRole } from "./deep-link.resolver";
import { useSelector } from "react-redux";
import type { RootState } from "@/config/stores/store";

export interface NotificationRowProps {
  item: NotificationItem;
  /** Deleting hides the trash affordance (e.g. inside the compact popover). */
  onDelete?: (id: string) => void;
  /** True while a delete mutation for this id is in flight. */
  isDeleting?: boolean;
  onNavigate?: () => void; // e.g. close the popover first
  markRead: (id: string) => void;
}

/** Relative timestamp with absolute title tooltip. */
function RelativeTime({ iso }: { iso: string }) {
  const parsed = new Date(iso);
  if (Number.isNaN(parsed.getTime())) return null;
  return (
    <time
      dateTime={iso}
      title={parsed.toLocaleString()}
      className="shrink-0 text-[11px] text-muted-foreground"
    >
      {formatDistanceToNow(parsed, { addSuffix: true })}
    </time>
  );
}

export function NotificationRow({
  item,
  onDelete,
  isDeleting,
  onNavigate,
  markRead,
}: NotificationRowProps) {
  const navigate = useNavigate();
  const role = useSelector((state: RootState) => state.auth.role);
  const notifRole: NotifRole = role === "doctor" ? "doctor" : "patient";

  const Icon = iconForNotificationType(item.type);
  const known = isKnownNotificationType(item.type);
  const link = resolveNotificationLink(item, notifRole);
  // The doctor-is-waiting push gets a highlighted, join-affordance style
  // while unread (spec: patient should act on this promptly).
  const isUrgentVideoJoin = item.type === "VIDEO_ROOM_OPENED" && !item.is_read;

  const handleOpen = () => {
    if (!item.is_read) markRead(item._id);
    onNavigate?.();
    // Fallback links stay put — never navigate into a 404.
    if (link && !link.fallback && link.to) {
      void navigate(link.to);
    }
  };

  const handleDelete = (event: React.MouseEvent) => {
    event.stopPropagation();
    onDelete?.(item._id);
  };

  return (
    <div
      role="button"
      tabIndex={0}
      onClick={handleOpen}
      onKeyDown={(event) => {
        if (event.key === "Enter" || event.key === " ") {
          event.preventDefault();
          handleOpen();
        }
      }}
      className={`group relative flex w-full cursor-pointer gap-3 rounded-lg px-3 py-2.5 text-left transition-colors hover:bg-accent/50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring ${
        isUrgentVideoJoin
          ? "border border-primary/30 bg-primary/[0.07]"
          : item.is_read
            ? ""
            : "bg-primary/[0.04]"
      }`}
    >
      {/* Icon disc */}
      <span
        className={`mt-0.5 flex size-9 shrink-0 items-center justify-center rounded-full ${
          !item.is_read
            ? "bg-primary/10 text-primary"
            : "bg-muted text-muted-foreground"
        }`}
      >
        <Icon className="size-4" />
      </span>

      <span className="min-w-0 flex-1">
        <span className="flex items-start justify-between gap-2">
          {/* Pre-rendered copy — displayed verbatim (spec §3). */}
          <span
            className={`truncate text-sm ${
              item.is_read
                ? "font-medium text-foreground"
                : "font-semibold text-foreground"
            }`}
          >
            {item.title}
            {!known && (
              <span className="ml-1.5 rounded bg-muted px-1 py-px align-middle font-mono text-[9px] uppercase text-muted-foreground">
                new
              </span>
            )}
          </span>
          <RelativeTime iso={item.createdAt} />
        </span>
        <span className="mt-0.5 line-clamp-2 block text-xs leading-relaxed text-muted-foreground">
          {item.body}
        </span>
      </span>

      {/* Unread dot + delete affordance */}
      <span className="flex shrink-0 flex-col items-center gap-1">
        {!item.is_read && (
          <span
            className={`size-2 rounded-full bg-primary ${
              isUrgentVideoJoin ? "animate-pulse" : ""
            }`}
            aria-label="Unread"
          />
        )}
        {onDelete && (
          <Button
            variant="ghost"
            size="icon"
            aria-label="Delete notification"
            disabled={isDeleting}
            onClick={handleDelete}
            className="size-6 opacity-0 transition-opacity hover:text-destructive focus-visible:opacity-100 group-hover:opacity-100"
          >
            {isDeleting ? (
              <Loader2 className="size-3.5 animate-spin" />
            ) : (
              <Trash2 className="size-3.5" />
            )}
          </Button>
        )}
      </span>
    </div>
  );
}
