import { describe, expect, it } from "vitest";

import {
  describeDailyCameraError,
  describeMediaAccessError,
  detectInAppBrowser,
  detectMobilePlatform,
  getMediaPermissionHelpLines,
  getRequestedMedia,
} from "./media-access.util";

const both = { audio: true, video: true };

describe("media access helpers", () => {
  it("lists requested media", () => {
    expect(getRequestedMedia(both)).toEqual(["audio", "video"]);
    expect(getRequestedMedia({ audio: true, video: false })).toEqual(["audio"]);
    expect(getRequestedMedia({ audio: false, video: false })).toEqual([]);
  });

  it("explains blocked permissions", () => {
    const details = describeMediaAccessError(
      new DOMException("Permission denied", "NotAllowedError"),
      both,
    );

    expect(details.code).toBe("permission-denied");
    expect(details.title).toBe("Camera and microphone blocked");
    expect(details.media).toEqual(["audio", "video"]);
  });

  it("explains a camera that is already in use", () => {
    const details = describeMediaAccessError(
      new DOMException("Could not start video source", "NotReadableError"),
      { audio: false, video: true },
    );

    expect(details.code).toBe("in-use");
    expect(details.title).toBe("Camera unavailable");
    expect(details.message).toContain("another app");
  });

  it("explains Daily permission errors with the blocked media", () => {
    const details = describeDailyCameraError(
      {
        error: {
          type: "permissions",
          msg: "Camera blocked",
          blockedMedia: ["video"],
        },
      },
      both,
    );

    expect(details.code).toBe("permission-denied");
    expect(details.title).toBe("Camera blocked");
  });

  it("detects in-app browsers", () => {
    expect(
      detectInAppBrowser(
        "Mozilla/5.0 (Linux; Android 14) AppleWebKit/537.36 Instagram 320.0",
      ),
    ).toBe("Instagram");
    expect(
      detectInAppBrowser(
        "Mozilla/5.0 (iPhone) AppleWebKit/605.1.15 WhatsApp/2.24",
      ),
    ).toBe("WhatsApp");
    expect(
      detectInAppBrowser(
        "Mozilla/5.0 (Linux; Android 14; Pixel 8) AppleWebKit/537.36 Chrome/126.0 Mobile Safari/537.36",
      ),
    ).toBeNull();
  });

  it("detects mobile platforms", () => {
    expect(
      detectMobilePlatform("Mozilla/5.0 (iPhone; CPU iPhone OS 17_0)"),
    ).toBe("ios");
    expect(
      detectMobilePlatform(
        "Mozilla/5.0 (Linux; Android 14; Pixel 8) AppleWebKit/537.36",
      ),
    ).toBe("android");
    expect(
      detectMobilePlatform("Mozilla/5.0 (Macintosh; Intel Mac OS X)"),
    ).toBe("desktop");
  });

  it("gives in-app browser and platform-specific permission help", () => {
    const lines = getMediaPermissionHelpLines({
      code: "permission-denied",
      mobilePlatform: "android",
      inAppBrowser: "Instagram",
    });

    expect(lines[0]).toContain("Instagram");
    expect(lines.join(" ")).toContain("Open this page in Chrome or Safari");
    expect(lines.join(" ")).toContain("Permissions");
  });
});
