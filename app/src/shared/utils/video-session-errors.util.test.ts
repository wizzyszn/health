/**
 * Regression tests for the video-session error contract classifiers
 * (docs/video-call-integration.spec.md §6) and the VIDEO_ROOM_OPENED
 * deep-link parser (§4). Pure functions — no network, no React.
 */
import { describe, expect, it } from "vitest";
import { ApiError } from "@/lib/api-error";
import {
  isRoomNotOpenYet,
  isOutsideJoinWindow,
  isJoinWindowEnded,
  isSessionAlreadyClosed,
  isVideoAuthRejected,
  isVideoNotConfigured,
  shouldRetryTokenFetch,
  parseVideoDeepLink,
  VIDEO_ROOM_OPENED_TYPE,
} from "@/shared/utils/video-session-errors.util";

describe("isRoomNotOpenYet", () => {
  const backendMessage = "Doctor hasn't opened the session yet. Please wait.";

  it("matches the structured 400 from the patient token route", () => {
    const error = new ApiError({
      message: `${backendMessage}, status: 400`,
      httpStatus: 400,
      responseCode: "006",
      description: backendMessage,
    });
    expect(isRoomNotOpenYet(error)).toBe(true);
  });

  it("rejects when httpStatus is present but not 400", () => {
    const error = new ApiError({
      message: "This appointment does not belong to you, status: 403",
      httpStatus: 403,
      responseCode: "009",
      description: "This appointment does not belong to you",
    });
    expect(isRoomNotOpenYet(error)).toBe(false);
  });

  it("still matches legacy plain-Error messages without status", () => {
    expect(isRoomNotOpenYet(new Error(backendMessage))).toBe(true);
  });

  it("returns false for unrelated errors", () => {
    expect(isRoomNotOpenYet(new Error("Network failure"))).toBe(false);
    expect(isRoomNotOpenYet(undefined)).toBe(false);
  });
});

describe("isJoinWindowEnded", () => {
  it("matches the backend's ended-window copy (006)", () => {
    // Real payload from staging: "This appointment window has already ended."
    const error = new ApiError({
      message: "This appointment window has already ended., status: 400",
      httpStatus: 400,
      responseCode: "006",
      description: "This appointment window has already ended.",
    });
    expect(isJoinWindowEnded(error)).toBe(true);
  });

  it("does NOT match the too-early case", () => {
    const error = new ApiError({
      message: "Join opens at scheduled time, status: 400",
      httpStatus: 400,
      responseCode: "006",
    });
    expect(isJoinWindowEnded(error)).toBe(false);
  });

  it("does not fire for other response codes", () => {
    const error = new ApiError({
      message: "window has already ended, status: 403",
      httpStatus: 403,
      responseCode: "009",
    });
    expect(isJoinWindowEnded(error)).toBe(false);
  });
});

describe("isSessionAlreadyClosed", () => {
  it("branches on HTTP 409 even though response_code is garbage", () => {
    // Spec warning: 409's response_code falls through to a non-numeric
    // string; the HTTP status is the only reliable signal.
    const error = new ApiError({
      message: "Internal Server error, status: 409",
      httpStatus: 409,
      responseCode: "Internal Server error",
      description: "Consultation already completed",
    });
    expect(isSessionAlreadyClosed(error)).toBe(true);
  });

  it("does not fire for other statuses", () => {
    const error = new ApiError({
      message: "boom, status: 400",
      httpStatus: 400,
    });
    expect(isSessionAlreadyClosed(error)).toBe(false);
  });
});

describe("isOutsideJoinWindow", () => {
  it("detects response_code 006", () => {
    const error = new ApiError({
      message: "Join window closed, status: 400",
      httpStatus: 400,
      responseCode: "006",
    });
    expect(isOutsideJoinWindow(error)).toBe(true);
  });

  it("falls back to scheduled-time phrasing for legacy errors", () => {
    expect(
      isOutsideJoinWindow(
        new Error(
          "This appointment starts at Apr 10. Please join at the scheduled time.",
        ),
      ),
    ).toBe(true);
  });
});

describe("auth + config classifiers", () => {
  it("isVideoAuthRejected matches 011 (incl. deactivated doctor)", () => {
    expect(
      isVideoAuthRejected(
        new ApiError({ message: "x", httpStatus: 401, responseCode: "011" }),
      ),
    ).toBe(true);
    expect(
      isVideoAuthRejected(
        new ApiError({ message: "x", httpStatus: 401, responseCode: "009" }),
      ),
    ).toBe(false);
  });

  it("isVideoNotConfigured matches 016 (no Daily key on deployment)", () => {
    expect(
      isVideoNotConfigured(
        new ApiError({ message: "x", httpStatus: 503, responseCode: "016" }),
      ),
    ).toBe(true);
  });
});

describe("shouldRetryTokenFetch", () => {
  it("retries only the room-not-open case, never window/auth/403", () => {
    const roomClosed = new ApiError({
      message:
        "Doctor hasn't opened the session yet. Please wait., status: 400",
      httpStatus: 400,
      description: "Doctor hasn't opened the session yet. Please wait.",
    });
    const windowClosed = new ApiError({
      message: "outside window, status: 400",
      httpStatus: 400,
      responseCode: "006",
    });
    const forbidden = new ApiError({
      message: "not yours, status: 403",
      httpStatus: 403,
      responseCode: "009",
    });
    expect(shouldRetryTokenFetch(roomClosed)).toBe(true);
    expect(shouldRetryTokenFetch(windowClosed)).toBe(false);
    expect(shouldRetryTokenFetch(forbidden)).toBe(false);
  });
});

describe("parseVideoDeepLink", () => {
  it("extracts the appointment id from the spec's deep_link shape", () => {
    expect(
      parseVideoDeepLink("/appointments/69d2f48d1017a08a518f2f97/video"),
    ).toEqual({
      appointmentId: "69d2f48d1017a08a518f2f97",
    });
  });

  it("rejects malformed or foreign paths", () => {
    expect(parseVideoDeepLink("/appointments//video")).toBeNull();
    expect(parseVideoDeepLink("/appointments/abc/video/")).toBeNull();
    expect(
      parseVideoDeepLink("/patient/dashboard/appointments/abc/video"),
    ).toBeNull();
    expect(parseVideoDeepLink("")).toBeNull();
  });

  it("exposes the notification type constant", () => {
    expect(VIDEO_ROOM_OPENED_TYPE).toBe("VIDEO_ROOM_OPENED");
  });
});
