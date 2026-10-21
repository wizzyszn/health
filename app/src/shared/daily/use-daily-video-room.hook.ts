import DailyIframe from "@daily-co/daily-js";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { toast } from "sonner";
import {
  startDoctorVideoSessionReq,
  endDoctorVideoSessionReq,
} from "@/config/service/video-consultation.service";
import type {
  DailyConnectionStatus,
  DailyParticipantTile,
  DailyTelehealthRole,
  DailyVideoSession,
} from "./daily-video-room.types";
import {
  describeDailyCameraError,
  describeMediaAccessError,
  type MediaAccessErrorDetails,
  type MediaAccessPreferences,
} from "./media-access.util";
import { isSessionAlreadyClosed } from "@/shared/utils/video-session-errors.util";

interface DailyParticipantLike {
  session_id?: string;
  local?: boolean;
  user_name?: string;
  audio?: boolean;
  video?: boolean;
  tracks?: {
    audio?: { persistentTrack?: MediaStreamTrack | null };
    video?: { persistentTrack?: MediaStreamTrack | null };
  };
}

const buildMediaStream = (track?: MediaStreamTrack | null) => {
  if (!track) return null;
  return new MediaStream([track]);
};

/**
 * Media defaults per role.
 *
 * Both roles join with the microphone live. Patients used to join muted, which
 * meant a patient who never found the mic button published no audio at all —
 * and because the remote mute state was not rendered on the other side's
 * tiles, the only explanation left to the doctor was that the call was broken.
 * The camera stays opt-in for patients (joining a call to talk does not imply
 * wanting to be seen), but being audible should not require finding a button.
 */
export const DEFAULT_MEDIA_BY_ROLE: Record<
  DailyTelehealthRole,
  { startAudioOff: boolean; startVideoOff: boolean }
> = {
  doctor: { startAudioOff: false, startVideoOff: false },
  patient: { startAudioOff: false, startVideoOff: true },
};

/** Auto-rejoin budget after an unexpected disconnect or fatal meeting error. */
const REJOIN_MAX_ATTEMPTS = 3;
const REJOIN_BASE_DELAY_MS = 2000;

export function useDailyVideoRoom(
  session: DailyVideoSession,
  displayName: string,
  role: DailyTelehealthRole,
  appointmentId: string,
  /** Called when auto-rejoin exhausts — the session payload is likely stale. */
  onSessionStale?: () => void,
  /** Media the pre-call gate confirmed (falls back to the role defaults). */
  initialPreferences?: MediaAccessPreferences,
) {
  const [callObject] = useState(
    () => DailyIframe.getCallInstance() || DailyIframe.createCallObject(),
  );
  const [connectionStatus, setConnectionStatus] =
    useState<DailyConnectionStatus>("idle");
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [mediaError, setMediaError] = useState<MediaAccessErrorDetails | null>(
    null,
  );
  const [isCameraFlipping, setIsCameraFlipping] = useState(false);
  const [participants, setParticipants] = useState<DailyParticipantTile[]>([]);
  const [isCameraEnabled, setIsCameraEnabled] = useState(false);
  const [isMicrophoneEnabled, setIsMicrophoneEnabled] = useState(false);
  const [joinNonce, setJoinNonce] = useState(0);
  const [peerLeftNotice, setPeerLeftNotice] = useState<string | null>(null);

  /**
   * Keep the user's intended media state across auto-rejoins. Syncing this
   * from Daily's actual track state would silently mute someone who dropped
   * while their permission prompt was still pending.
   */
  const mediaPreferencesRef = useRef<MediaAccessPreferences>(
    initialPreferences ?? {
      audio: !DEFAULT_MEDIA_BY_ROLE[role].startAudioOff,
      video: !DEFAULT_MEDIA_BY_ROLE[role].startVideoOff,
    },
  );

  const joinMediaOptions = useCallback(() => {
    const preferences = mediaPreferencesRef.current;
    return {
      startAudioOff: !preferences.audio,
      startVideoOff: !preferences.video,
    };
  }, []);

  /** True between an unexpected drop/fatal error and a successful rejoin. */
  const autoRejoinArmedRef = useRef(false);
  const rejoinAttemptsRef = useRef(0);
  const rejoinTimerRef = useRef<number | null>(null);

  // Fire-once guards for the doctor lifecycle PATCHes: joined-meeting and
  // left-meeting can re-emit on StrictMode remounts and network flaps, and
  // the backend treats repeated calls as real state transitions.
  const sessionStartSentRef = useRef<string | null>(null);
  const sessionEndSentRef = useRef<string | null>(null);

  /** PATCH video/start — exactly once per appointment per mount. */
  const reportSessionStarted = useCallback((id: string) => {
    if (sessionStartSentRef.current === id) return;
    sessionStartSentRef.current = id;
    startDoctorVideoSessionReq(id).catch((error: unknown) => {
      sessionStartSentRef.current = null; // allow retry on next emit
      if (isSessionAlreadyClosed(error)) {
        // HTTP 409 — consultation COMPLETED/CANCELED; can't be reopened.
        toast.warning(
          "This consultation is already completed and can't be reopened.",
        );
      } else {
        console.error("Failed to start daily session on backend", error);
      }
    });
  }, []);

  /** PATCH video/end — exactly once per appointment per mount. */
  const reportSessionEnded = useCallback((id: string) => {
    if (sessionEndSentRef.current === id) return;
    sessionEndSentRef.current = id;
    endDoctorVideoSessionReq(id).catch((error: unknown) => {
      sessionEndSentRef.current = null;
      // Spec §5: markSessionEnded has no window check, so failures here are
      // genuinely unexpected. Log with context; never block leaving.
      console.error("Failed to end daily session on backend", error);
    });
  }, []);

  /**
   * Latest session payload for (re)joins. A ref so a parent refetch landing
   * a fresh token does NOT restart the listener effect below — restarting
   * would leave() and tear down the very call being recovered.
   */
  const latestSessionRef = useRef(session);
  useEffect(() => {
    latestSessionRef.current = session;
  }, [session]);

  /** Latest callback via ref so it never invalidates the listener effect. */
  const onSessionStaleRef = useRef(onSessionStale);
  useEffect(() => {
    onSessionStaleRef.current = onSessionStale;
  }, [onSessionStale]);

  const clearRejoinTimer = useCallback(() => {
    if (rejoinTimerRef.current !== null) {
      window.clearTimeout(rejoinTimerRef.current);
      rejoinTimerRef.current = null;
    }
  }, []);

  const syncParticipants = useCallback(() => {
    const nextParticipants = Object.values(
      callObject.participants(),
    ) as DailyParticipantLike[];

    const mappedParticipants = nextParticipants.map((participant) => ({
      id:
        participant.session_id ??
        `${participant.local ? "local" : "remote"}-${participant.user_name ?? "guest"}`,
      displayName:
        participant.user_name ?? (participant.local ? "You" : "Guest"),
      isLocal: Boolean(participant.local),
      isVideoEnabled: Boolean(participant.video),
      isAudioEnabled: Boolean(participant.audio),
      videoStream: buildMediaStream(
        participant.tracks?.video?.persistentTrack ?? null,
      ),
      audioStream: buildMediaStream(
        participant.tracks?.audio?.persistentTrack ?? null,
      ),
    }));

    mappedParticipants.sort(
      (left, right) => Number(right.isLocal) - Number(left.isLocal),
    );
    setParticipants(mappedParticipants);
    setIsCameraEnabled(callObject.localVideo());
    setIsMicrophoneEnabled(callObject.localAudio());
  }, [callObject]);

  /**
   * Bounded exponential-backoff rejoin using the freshest session payload.
   * Named function expression lets the join-failure path recurse into
   * itself without a self-referencing dependency.
   */
  const beginAutoRejoin = useCallback(
    function runAutoRejoin(): void {
      clearRejoinTimer();
      if (!autoRejoinArmedRef.current) return;

      if (rejoinAttemptsRef.current >= REJOIN_MAX_ATTEMPTS) {
        autoRejoinArmedRef.current = false;
        setPeerLeftNotice(null);
        setConnectionStatus("error");
        setErrorMessage(
          "Your connection dropped and rejoining failed. Check your internet, then tap Try again.",
        );
        onSessionStaleRef.current?.();
        return;
      }

      const activeSession = latestSessionRef.current;
      if (!activeSession.roomUrl || !activeSession.token) {
        autoRejoinArmedRef.current = false;
        setConnectionStatus("error");
        setErrorMessage(
          "Your connection dropped and no fresh session is available yet.",
        );
        onSessionStaleRef.current?.();
        return;
      }

      const delayMs = Math.min(
        REJOIN_BASE_DELAY_MS * 2 ** rejoinAttemptsRef.current,
        8000,
      );
      rejoinAttemptsRef.current += 1;
      setConnectionStatus("reconnecting");

      rejoinTimerRef.current = window.setTimeout(() => {
        void callObject
          .join({
            url: activeSession.roomUrl,
            token: activeSession.token,
            userName: displayName,
            ...joinMediaOptions(),
          })
          .then(() => syncParticipants())
          .catch(() => runAutoRejoin());
      }, delayMs);
    },
    [
      callObject,
      displayName,
      syncParticipants,
      clearRejoinTimer,
      joinMediaOptions,
    ],
  );

  const joinMeeting = useCallback(async () => {
    const activeSession = latestSessionRef.current;

    // Guard against joining with an incomplete payload — room URL and token
    // come only from the backend; never fabricate them.
    if (!activeSession.roomUrl || !activeSession.token) {
      setConnectionStatus("error");
      setErrorMessage("Video session details are unavailable. Please reload.");
      return;
    }

    setConnectionStatus("joining");
    setErrorMessage(null);
    setPeerLeftNotice(null);
    autoRejoinArmedRef.current = false;
    rejoinAttemptsRef.current = 0;

    try {
      await callObject.join({
        url: activeSession.roomUrl,
        token: activeSession.token,
        userName: displayName,
        ...joinMediaOptions(),
      });
      syncParticipants();
    } catch (error) {
      setConnectionStatus("error");
      setErrorMessage(
        error instanceof Error
          ? error.message
          : "Unable to join the video room.",
      );
    }
  }, [callObject, displayName, syncParticipants, joinMediaOptions]);

  useEffect(() => {
    const countRemotes = (): number =>
      (
        Object.values(callObject.participants()) as DailyParticipantLike[]
      ).filter((participant) => !participant.local).length;

    const handleJoined = () => {
      autoRejoinArmedRef.current = false;
      rejoinAttemptsRef.current = 0;
      setPeerLeftNotice(null);

      const remoteCount = countRemotes();
      setConnectionStatus(remoteCount > 0 ? "joined" : "waiting");
      syncParticipants();

      if (role === "doctor" && appointmentId) {
        reportSessionStarted(appointmentId);
      }
    };

    const handleParticipantChange = (event?: unknown) => {
      // Capture who left before the participants map updates.
      let leftName: string | undefined;
      if (
        typeof event === "object" &&
        event !== null &&
        "participant" in event
      ) {
        const info = event as { participant?: { user_name?: string } };
        leftName = info.participant?.user_name;
      }

      const remoteCount = countRemotes();
      if (remoteCount > 0) {
        setPeerLeftNotice(null);
      } else if (leftName) {
        setPeerLeftNotice(`${leftName} has left the call.`);
      }

      setConnectionStatus((currentStatus) => {
        if (currentStatus === "left" || currentStatus === "error") {
          return currentStatus;
        }
        return remoteCount > 0 ? "joined" : "waiting";
      });

      syncParticipants();
    };

    const handleNetworkConnection = (
      event: { type?: string; event?: string } | undefined,
    ) => {
      if (event?.event === "interrupted") {
        autoRejoinArmedRef.current = true;
        setConnectionStatus("reconnecting");
        beginAutoRejoin();
      } else if (event?.event === "restored") {
        clearRejoinTimer();
        autoRejoinArmedRef.current = false;
        rejoinAttemptsRef.current = 0;
        setConnectionStatus((current) =>
          current === "reconnecting"
            ? countRemotes() > 0
              ? "joined"
              : "waiting"
            : current,
        );
      }
    };

    const handleFatalError = (event: { errorMsg?: string }) => {
      // Fatal errors here are typically meeting/token-level. Treat like a
      // dropped meeting: bounded auto-rejoin first — latestSessionRef may
      // already hold a refreshed token from a parent refetch.
      autoRejoinArmedRef.current = true;
      setConnectionStatus("reconnecting");
      beginAutoRejoin();
      if (event?.errorMsg) {
        setErrorMessage(event.errorMsg);
      }
    };

    const handleCameraError = (
      event: Parameters<typeof describeDailyCameraError>[0],
    ) => {
      // Permission, device, or "in use" errors do NOT mean the call is
      // over. Keep the room connected (audio/video may still work) and
      // surface actionable recovery instead of a fatal connection state.
      setMediaError(
        describeDailyCameraError(event, mediaPreferencesRef.current),
      );
      syncParticipants();
    };

    const handleLeft = () => {
      clearRejoinTimer();
      setConnectionStatus("left");
      setParticipants([]);
      if (role === "doctor" && appointmentId) {
        reportSessionEnded(appointmentId);
      }
    };

    callObject.on("joined-meeting", handleJoined);
    callObject.on("participant-joined", handleParticipantChange);
    callObject.on("participant-updated", handleParticipantChange);
    callObject.on("participant-left", handleParticipantChange);
    callObject.on("network-connection", handleNetworkConnection);
    callObject.on("camera-error", handleCameraError);
    callObject.on("error", handleFatalError);
    callObject.on("left-meeting", handleLeft);

    void joinMeeting();

    return () => {
      callObject.off("joined-meeting", handleJoined);
      callObject.off("participant-joined", handleParticipantChange);
      callObject.off("participant-updated", handleParticipantChange);
      callObject.off("participant-left", handleParticipantChange);
      callObject.off("network-connection", handleNetworkConnection);
      callObject.off("camera-error", handleCameraError);
      callObject.off("error", handleFatalError);
      callObject.off("left-meeting", handleLeft);
      // Removed callObject.destroy() because React 18 strict mode remounts components
      // retaining the previous state. Destroying it here causes 'Use after destroy'
      // errors upon remount because the reused state reference is now broken.
      void callObject.leave().catch(() => undefined);
    };
  }, [
    callObject,
    joinMeeting,
    joinNonce,
    syncParticipants,
    role,
    appointmentId,
    reportSessionStarted,
    reportSessionEnded,
    beginAutoRejoin,
    clearRejoinTimer,
  ]);

  const toggleCamera = useCallback(async () => {
    const nextValue = !callObject.localVideo();
    mediaPreferencesRef.current = {
      ...mediaPreferencesRef.current,
      video: nextValue,
    };
    setMediaError(null);

    try {
      await callObject.setLocalVideo(nextValue);
    } catch (error) {
      setMediaError(
        describeMediaAccessError(error, { audio: false, video: true }),
      );
    } finally {
      syncParticipants();
    }
  }, [callObject, syncParticipants]);

  const toggleMicrophone = useCallback(async () => {
    const nextValue = !callObject.localAudio();
    mediaPreferencesRef.current = {
      ...mediaPreferencesRef.current,
      audio: nextValue,
    };
    setMediaError(null);

    try {
      await callObject.setLocalAudio(nextValue);
    } catch (error) {
      setMediaError(
        describeMediaAccessError(error, { audio: true, video: false }),
      );
    } finally {
      syncParticipants();
    }
  }, [callObject, syncParticipants]);

  /** Switch between front and rear cameras on phones/tablets. */
  const flipCamera = useCallback(async () => {
    if (isCameraFlipping || !callObject.localVideo()) return;

    setIsCameraFlipping(true);
    setMediaError(null);

    try {
      await callObject.cycleCamera({ preferDifferentFacingMode: true });
    } catch (error) {
      setMediaError(
        describeMediaAccessError(error, { audio: false, video: true }),
      );
    } finally {
      setIsCameraFlipping(false);
      syncParticipants();
    }
  }, [callObject, isCameraFlipping, syncParticipants]);

  const clearMediaError = useCallback(() => setMediaError(null), []);

  const leaveMeeting = useCallback(async () => {
    clearRejoinTimer();
    autoRejoinArmedRef.current = false;
    await callObject.leave();
    setConnectionStatus("left");
  }, [callObject, clearRejoinTimer]);

  /** Manual retry from error UI: reset budget and re-run the join sequence. */
  const retryJoin = useCallback(() => {
    clearRejoinTimer();
    autoRejoinArmedRef.current = false;
    rejoinAttemptsRef.current = 0;
    setErrorMessage(null);
    setMediaError(null);
    setParticipants([]);
    setJoinNonce((value) => value + 1);
  }, [clearRejoinTimer]);

  const localParticipant = useMemo(
    () => participants.find((participant) => participant.isLocal) ?? null,
    [participants],
  );

  const remoteParticipants = useMemo(
    () => participants.filter((participant) => !participant.isLocal),
    [participants],
  );

  return {
    callObject,
    connectionStatus,
    errorMessage,
    mediaError,
    peerLeftNotice,
    isCameraEnabled,
    isCameraFlipping,
    isMicrophoneEnabled,
    localParticipant,
    remoteParticipants,
    clearMediaError,
    flipCamera,
    leaveMeeting,
    retryJoin,
    toggleCamera,
    toggleMicrophone,
  };
}
