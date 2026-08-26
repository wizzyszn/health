import { QueryClient } from "@tanstack/react-query";

export const DEFAULT_QUERY_STALE_TIME = 5 * 60 * 1000;
export const DEFAULT_QUERY_GC_TIME = 30 * 60 * 1000;

export function createAppQueryClient() {
  return new QueryClient({
    defaultOptions: {
      queries: {
        staleTime: DEFAULT_QUERY_STALE_TIME,
        gcTime: DEFAULT_QUERY_GC_TIME,
        retry: false,
        refetchOnWindowFocus: false,
        refetchOnReconnect: false,
      },
    },
  });
}

export const queryClient = createAppQueryClient();
