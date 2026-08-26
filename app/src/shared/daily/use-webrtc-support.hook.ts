import { useState } from "react";

export type WebRtcSupport =
  | { supported: true }
  | { supported: false; reason: string };

/**
 * Gate for mounting daily-js: requires a secure context (getUserMedia is
 * unavailable on insecure origins) and RTCPeerConnection support. Returns
 * null during the first render pass on the server / before effects.
 */
export function useWebRtcSupport(): WebRtcSupport {
  const [support] = useState<WebRtcSupport>(() => {
    if (typeof window === "undefined") {
      return { supported: false, reason: "This environment cannot run calls." };
    }
    if (!window.isSecureContext) {
      return {
        supported: false,
        reason:
          "Video calls need a secure connection. Please open this page over HTTPS.",
      };
    }
    if (
      typeof window.RTCPeerConnection !== "function" ||
      !navigator.mediaDevices?.getUserMedia
    ) {
      return {
        supported: false,
        reason:
          "This browser doesn't support video calling. Please update your browser or try Chrome, Edge, or Safari.",
      };
    }
    return { supported: true };
  });
  return support;
}
