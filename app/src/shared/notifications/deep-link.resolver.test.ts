/**
 * Tests for the notification deep-link resolver, icon map fallbacks, and
 * the allowlisted list-param serializer (spec §2: unknown params → 400).
 */
import { describe, expect, it } from "vitest";
import {
  resolveNotificationLink,
  type ResolvedLink,
} from "./deep-link.resolver";
import {
  iconForNotificationType,
  isKnownNotificationType,
  NOTIFICATION_ICON_FALLBACK,
} from "./notification-icon.map";
import { NOTIFICATION_TYPES } from "./notification.types";
import { buildListQuery } from "@/config/service/notifications.service";

describe("resolveNotificationLink", () => {
  const base = { type: "APPOINTMENT_BOOKED" };

  it("returns null when there is no deep_link", () => {
    expect(
      resolveNotificationLink({ ...base, deep_link: null }, "patient"),
    ).toBeNull();
    expect(
      resolveNotificationLink({ ...base, deep_link: undefined }, "doctor"),
    ).toBeNull();
  });

  it("maps appointments per role", () => {
    const item = { ...base, deep_link: "/appointments/6a8b" };
    expect(resolveNotificationLink(item, "patient")).toEqual({
      to: "/patient/dashboard/appointments/6a8b",
      fallback: false,
    });
    expect(resolveNotificationLink(item, "doctor")).toEqual({
      to: "/doctor/dashboard/appointments/6a8b",
      fallback: false,
    });
  });

  it("routes VIDEO_ROOM_OPENED through parseVideoDeepLink", () => {
    const item = {
      type: "VIDEO_ROOM_OPENED",
      deep_link: "/appointments/69d2f48d/video",
    };
    expect(resolveNotificationLink(item, "patient")).toEqual({
      to: "/patient/dashboard/appointments/69d2f48d/video",
      fallback: false,
    });
  });

  it("falls back safely when a video hint is malformed", () => {
    const item = {
      type: "VIDEO_ROOM_OPENED",
      deep_link: "/appointments//video",
    };
    const resolved: ResolvedLink | null = resolveNotificationLink(
      item,
      "patient",
    );
    expect(resolved?.fallback).toBe(true);
  });

  it("maps consultations with and without sub-sections", () => {
    expect(
      resolveNotificationLink(
        {
          type: "CONSULTATION_SUMMARY_AVAILABLE",
          deep_link: "/consultations/6a86f6f9",
        },
        "patient",
      ),
    ).toEqual({
      to: "/patient/dashboard/consultations/6a86f6f9",
      fallback: false,
    });
    expect(
      resolveNotificationLink(
        {
          type: "PRESCRIPTION_READY",
          deep_link: "/consultations/6a86f6f9/medications",
        },
        "doctor",
      ),
    ).toEqual({
      to: "/doctor/dashboard/consultations/6a86f6f9",
      fallback: false,
    });
  });

  it("maps referrals for patients; doctors have no referral detail route", () => {
    const item = { type: "REFERRAL_AVAILABLE", deep_link: "/referrals/abc123" };
    expect(resolveNotificationLink(item, "patient")).toEqual({
      to: "/patient/dashboard/referrals/abc123",
      fallback: false,
    });
    expect(resolveNotificationLink(item, "doctor")?.fallback).toBe(true);
  });

  it("never navigates blind on unknown hint shapes", () => {
    const weird = [
      "/unknown/thing/1",
      "/appointments/",
      "//etc/passwd",
      "https://evil.example.com/appointments/1",
    ];
    for (const deep_link of weird) {
      const resolved = resolveNotificationLink(
        { ...base, deep_link },
        "patient",
      );
      if (resolved !== null) {
        expect(resolved.fallback).toBe(true);
      }
    }
  });
});

describe("icon map", () => {
  it("resolves every known type without hitting the fallback", () => {
    for (const type of NOTIFICATION_TYPES) {
      expect(iconForNotificationType(type)).not.toBe(
        NOTIFICATION_ICON_FALLBACK,
      );
      expect(isKnownNotificationType(type)).toBe(true);
    }
  });

  it("degrades gracefully for future/unknown types", () => {
    expect(iconForNotificationType("SOMETHING_NEW_FROM_BACKEND")).toBe(
      NOTIFICATION_ICON_FALLBACK,
    );
    expect(isKnownNotificationType("SOMETHING_NEW_FROM_BACKEND")).toBe(false);
  });
});

describe("buildListQuery serializer", () => {
  it("emits only allowlisted keys", () => {
    const qs = buildListQuery({ page: 2, perPage: 20, status: "unread" });
    const entries = new URLSearchParams(qs);
    expect([...entries.keys()].sort()).toEqual(["page", "perPage", "status"]);
    expect(entries.get("page")).toBe("2");
    expect(entries.get("perPage")).toBe("20");
    expect(entries.get("status")).toBe("unread");
  });

  it("includes category/type only when provided", () => {
    const qs = new URLSearchParams(
      buildListQuery({
        page: 1,
        perPage: 10,
        status: "all",
        category: "VIDEO",
      }),
    );
    expect(qs.get("category")).toBe("VIDEO");
    expect(qs.get("type")).toBeNull();
  });

  it("rejects perPage outside 1–100 (server 400s instead of clamping)", () => {
    for (const bad of [0, -5, 101, 20.5]) {
      expect(() =>
        buildListQuery({ page: 1, perPage: bad, status: "all" }),
      ).toThrow(RangeError);
    }
  });

  it("clamps page to minimum 1", () => {
    const qs = new URLSearchParams(
      buildListQuery({ page: -3, perPage: 20, status: "all" }),
    );
    expect(qs.get("page")).toBe("1");
  });
});
