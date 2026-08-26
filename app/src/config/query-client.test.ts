import { describe, expect, it, vi } from "vitest";
import {
  createAppQueryClient,
  DEFAULT_QUERY_GC_TIME,
  DEFAULT_QUERY_STALE_TIME,
} from "./query-client";

describe("createAppQueryClient", () => {
  it("uses conservative defaults for ordinary server queries", () => {
    const client = createAppQueryClient();

    expect(client.getDefaultOptions().queries).toMatchObject({
      staleTime: DEFAULT_QUERY_STALE_TIME,
      gcTime: DEFAULT_QUERY_GC_TIME,
      retry: false,
      refetchOnWindowFocus: false,
      refetchOnReconnect: false,
    });
  });

  it("does not automatically retry a failed ordinary query", async () => {
    const client = createAppQueryClient();
    const queryFn = vi.fn().mockRejectedValue(new Error("server unavailable"));

    await expect(
      client.fetchQuery({ queryKey: ["ordinary-failure"], queryFn }),
    ).rejects.toThrow("server unavailable");

    expect(queryFn).toHaveBeenCalledTimes(1);
  });

  it("reuses fresh cached data for repeated requests", async () => {
    const client = createAppQueryClient();
    const queryFn = vi.fn().mockResolvedValue({ value: "cached" });

    await client.fetchQuery({ queryKey: ["ordinary-success"], queryFn });
    await client.fetchQuery({ queryKey: ["ordinary-success"], queryFn });

    expect(queryFn).toHaveBeenCalledTimes(1);
  });

  it("allows endpoint-specific retry and freshness overrides", async () => {
    const client = createAppQueryClient();
    const queryFn = vi
      .fn()
      .mockRejectedValueOnce(new Error("transient"))
      .mockResolvedValue({ value: "fresh" });

    await expect(
      client.fetchQuery({
        queryKey: ["explicit-override"],
        queryFn,
        retry: 1,
        retryDelay: 0,
        staleTime: 0,
      }),
    ).resolves.toEqual({ value: "fresh" });

    expect(queryFn).toHaveBeenCalledTimes(2);
  });
});
