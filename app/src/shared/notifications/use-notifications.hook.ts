/**
 * Single owner of notification server state: unread badge polling, the
 * paginated feed, and mark-read/mark-all/delete with optimistic cache
 * updates. Bell popover and full feed page share these caches so both stay
 * in sync without refetch storms.
 *
 * Contract reference: docs/in-app-notifications.spec.md.
 */
import { useCallback, useMemo, useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { useSelector } from "react-redux";
import { notificationsServiceForRole } from "@/config/service/notifications.service";
import type {
  NotificationCategory,
  NotificationFeed,
  NotificationItem,
  NotificationListParams,
  NotificationReadStatusFilter,
} from "./notification.types";
import type { GeneralReturnInt } from "@/lib/types";
import type { RootState } from "@/config/stores/store";

/** Spec §7: poll while foregrounded; cheap single-index count endpoint. */
export const UNREAD_POLL_MS = 45_000;

export const DEFAULT_PER_PAGE = 20;
/** Page size used by the bell popover's compact recent list. */
export const POPOVER_PER_PAGE = 6;

interface UseNotificationsOptions {
  /** Override page size (e.g. 6 for the bell popover). Default 20. */
  perPage?: number;
}

export interface NotificationFeedParams {
  page: number;
  status: NotificationReadStatusFilter;
  category?: NotificationCategory;
}

function useRoleTree(): "patients" | "doctors" | null {
  const role = useSelector((state: RootState) => state.auth.role);
  return role === "patient" ? "patients" : role === "doctor" ? "doctors" : null;
}

/** Apply an updater to every cached feed (any params) in one call. */
function updateAllCachedFeeds(
  queryClient: ReturnType<typeof useQueryClient>,
  updateItems: (items: NotificationItem[]) => NotificationItem[],
  updateUnread?: (count: number) => number,
): void {
  queryClient.setQueriesData<GeneralReturnInt<NotificationFeed>>(
    { queryKey: ["notifications-feed"] },
    (current) => {
      if (!current?.data) return current;
      const items = updateItems(current.data.items);
      const unread_count =
        updateUnread !== undefined
          ? Math.max(0, updateUnread(current.data.unread_count))
          : current.data.unread_count;
      return { ...current, data: { ...current.data, items, unread_count } };
    },
  );
}

export function useNotificationsController(
  options: UseNotificationsOptions = {},
) {
  const perPage = options.perPage ?? DEFAULT_PER_PAGE;
  const queryClient = useQueryClient();
  const tree = useRoleTree();
  const service = useMemo(
    () =>
      notificationsServiceForRole(
        tree === "patients"
          ? "patient"
          : tree === "doctors"
            ? "doctor"
            : undefined,
      ),
    [tree],
  );

  const [params, setParams] = useState<NotificationFeedParams>({
    page: 1,
    status: "all",
  });

  /* ── Badge: poll unread-count ─────────────────────────────────────── */
  const unreadQuery = useQuery({
    queryKey: ["notifications-unread", tree],
    queryFn: () => {
      if (!service)
        throw new Error("Notifications require patient/doctor role");
      return service.getUnreadCountReq();
    },
    enabled: Boolean(service),
    refetchInterval: UNREAD_POLL_MS,
    refetchIntervalInBackground: false, // pause when tab hidden
    staleTime: 15_000,
    retry: 1,
  });

  /* ── Feed ─────────────────────────────────────────────────────────── */
  const feedParams: NotificationListParams = useMemo(
    () => ({
      page: params.page,
      perPage,
      status: params.status,
      ...(params.category ? { category: params.category } : {}),
    }),
    [params.page, params.status, params.category, perPage],
  );

  const feedQuery = useQuery({
    queryKey: ["notifications-feed", tree, feedParams],
    queryFn: () => {
      if (!service)
        throw new Error("Notifications require patient/doctor role");
      return service.getFeedReq(feedParams);
    },
    enabled: Boolean(service),
    placeholderData: (previous) => previous, // smooth pagination
    staleTime: 30_000,
    retry: 1,
  });

  const invalidateAll = useCallback(() => {
    void queryClient.invalidateQueries({ queryKey: ["notifications-unread"] });
    void queryClient.invalidateQueries({ queryKey: ["notifications-feed"] });
  }, [queryClient]);

  /* ── Mutations (optimistic) ───────────────────────────────────────── */

  const markReadMutation = useMutation({
    mutationFn: async (id: string) => {
      if (!service) throw new Error("Notifications unavailable");
      return service.markReadReq(id);
    },
    onMutate: async (id: string) => {
      await queryClient.cancelQueries({ queryKey: ["notifications-feed"] });
      let wasUnread = false;
      updateAllCachedFeeds(queryClient, (items) =>
        items.map((item) => {
          if (item._id !== id || item.is_read) return item;
          wasUnread = true;
          return { ...item, is_read: true, read_at: new Date().toISOString() };
        }),
      );
      if (wasUnread) {
        // Marking read decrements the badge by exactly one.
        queryClient.setQueriesData<GeneralReturnInt<{ unread: number }>>(
          { queryKey: ["notifications-unread"] },
          (current) =>
            current?.data
              ? {
                  ...current,
                  data: { unread: Math.max(0, current.data.unread - 1) },
                }
              : current,
        );
      }
      return {
        previousFeeds: queryClient.getQueriesData({
          queryKey: ["notifications-feed"],
        }),
      };
    },
    onError: (_error, _id, context) => {
      // Roll back all touched feed caches.
      for (const [key, value] of context?.previousFeeds ?? []) {
        queryClient.setQueryData(key, value);
      }
      invalidateAll();
      toast.error("Couldn't mark that notification as read.");
    },
  });

  const markAllReadMutation = useMutation({
    mutationFn: async () => {
      if (!service) throw new Error("Notifications unavailable");
      return service.markAllReadReq();
    },
    onMutate: async () => {
      await queryClient.cancelQueries({ queryKey: ["notifications-feed"] });
      let previouslyUnread = 0;
      updateAllCachedFeeds(
        queryClient,
        (items) =>
          items.map((item) => {
            if (item.is_read) return item;
            previouslyUnread += 1;
            return {
              ...item,
              is_read: true,
              read_at: new Date().toISOString(),
            };
          }),
        // Only pages we can see may undercount; server invalidation corrects.
        (count) => Math.max(0, count - previouslyUnread),
      );
      queryClient.setQueriesData<GeneralReturnInt<{ unread: number }>>(
        { queryKey: ["notifications-unread"] },
        (current) =>
          current?.data ? { ...current, data: { unread: 0 } } : current,
      );
      return {
        previousFeeds: queryClient.getQueriesData({
          queryKey: ["notifications-feed"],
        }),
      };
    },
    onError: (_error, _vars, context) => {
      for (const [key, value] of context?.previousFeeds ?? []) {
        queryClient.setQueryData(key, value);
      }
      invalidateAll();
      toast.error("Couldn't mark everything as read.");
    },
    onSuccess: () => {
      // Server knows rows outside our cached pages; reconcile quietly.
      void queryClient.invalidateQueries({
        queryKey: ["notifications-unread"],
      });
    },
  });

  const deleteMutation = useMutation({
    mutationFn: async (id: string) => {
      if (!service) throw new Error("Notifications unavailable");
      try {
        return await service.deleteReq(id);
      } catch (error) {
        // Spec §7: another user's id → 404, treat as already gone.
        const status = (error as { httpStatus?: number }).httpStatus;
        if (status === 404) return { data: { deleted: true } };
        throw error;
      }
    },
    onMutate: async (id: string) => {
      await queryClient.cancelQueries({ queryKey: ["notifications-feed"] });
      let removedWasUnread = false;
      updateAllCachedFeeds(queryClient, (items) =>
        items.filter((item) => {
          if (item._id !== id) return true;
          removedWasUnread = !item.is_read;
          return false;
        }),
      );
      if (removedWasUnread) {
        // Deleting an unread row removes it but does not "read" it — the
        // server's unread_count includes deleted rows; adjust locally and
        // reconcile from the next poll.
        queryClient.setQueriesData<GeneralReturnInt<{ unread: number }>>(
          { queryKey: ["notifications-unread"] },
          (current) =>
            current?.data
              ? {
                  ...current,
                  data: { unread: Math.max(0, current.data.unread - 1) },
                }
              : current,
        );
      }
      return {
        previousFeeds: queryClient.getQueriesData({
          queryKey: ["notifications-feed"],
        }),
      };
    },
    onError: (_error, _id, context) => {
      for (const [key, value] of context?.previousFeeds ?? []) {
        queryClient.setQueryData(key, value);
      }
      invalidateAll();
      toast.error("Couldn't delete that notification.");
    },
    onSuccess: () => {
      // Quiet confirmation — the row already vanished optimistically.
      toast.success("Notification deleted");
    },
  });

  /* ── Public API ───────────────────────────────────────────────────── */

  const setPage = useCallback(
    (page: number) => setParams((current) => ({ ...current, page })),
    [],
  );
  const setStatus = useCallback(
    (status: NotificationReadStatusFilter) => setParams({ page: 1, status }), // filter change resets pagination
    [],
  );
  const setCategory = useCallback(
    (category?: NotificationCategory) =>
      setParams({ page: 1, status: "all", ...(category ? { category } : {}) }),
    [],
  );

  return {
    /** null while auth role is unknown/admin — callers render disabled states. */
    isNotificationUser: Boolean(service),
    unread: unreadQuery.data?.data.unread ?? 0,
    feed: feedQuery.data?.data ?? null,
    params,
    setPage,
    setStatus,
    setCategory,
    isLoadingFeed: feedQuery.isLoading,
    isFetchingFeed: feedQuery.isFetching,
    feedError: feedQuery.error,
    refetchFeed: () => void feedQuery.refetch(),
    markRead: (id: string) => markReadMutation.mutate(id),
    markAllRead: () => markAllReadMutation.mutate(),
    remove: (id: string) => deleteMutation.mutate(id),
  };
}
