import DailyIframe from "@daily-co/daily-js";
import { useCallback, useEffect, useMemo, useState } from "react";
import {
  startDoctorVideoSessionReq,
  endDoctorVideoSessionReq,
} from "@/config/service/video-consultation.service";
import type {
  DailyConnectionStatus,
  DailyParticipantTile,
  DailyVideoSession,
} from "./daily-video-room.types";

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

export function useDailyVideoRoom(
  session: DailyVideoSession,
  displayName: string,
  role: "doctor" | "patient",
  appointmentId: string,
) {
  const [callObject] = useState(
    () => DailyIframe.getCallInstance() || DailyIframe.createCallObject(),
  );
  const [connectionStatus, setConnectionStatus] =
    useState<DailyConnectionStatus>("idle");
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [participants, setParticipants] = useState<DailyParticipantTile[]>([]);
  const [isCameraEnabled, setIsCameraEnabled] = useState(false);
  const [isMicrophoneEnabled, setIsMicrophoneEnabled] = useState(false);
  const [joinNonce, setJoinNonce] = useState(0);

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
    }));

    mappedParticipants.sort(
      (left, right) => Number(right.isLocal) - Number(left.isLocal),
    );
    setParticipants(mappedParticipants);
    setIsCameraEnabled(callObject.localVideo());
    setIsMicrophoneEnabled(callObject.localAudio());
  }, [callObject]);

  const joinMeeting = useCallback(async () => {
    setConnectionStatus("joining");
    setErrorMessage(null);

    try {
      await callObject.join({
        url: session.roomUrl,
        token: session.token,
        userName: displayName,
        startAudioOff: true,
        startVideoOff: true,
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
  }, [
    callObject,
    displayName,
    session.roomUrl,
    session.token,
    syncParticipants,
  ]);

  useEffect(() => {
    const handleJoined = () => {
      const everyone = Object.values(
        callObject.participants(),
      ) as DailyParticipantLike[];
      const remoteCount = everyone.filter(
        (participant) => !participant.local,
      ).length;

      setConnectionStatus(remoteCount > 0 ? "joined" : "waiting");
      syncParticipants();

      if (role === "doctor" && appointmentId) {
        startDoctorVideoSessionReq(appointmentId).catch((err) =>
          console.error("Failed to start daily session on backend", err),
        );
      }
    };

    const handleParticipantChange = () => {
      const everyone = Object.values(
        callObject.participants(),
      ) as DailyParticipantLike[];
      const remoteCount = everyone.filter(
        (participant) => !participant.local,
      ).length;

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
        setConnectionStatus("reconnecting");
      }
    };

    const handleCameraError = (event: { errorMsg?: { errorMsg: string } }) => {
      setConnectionStatus("error");
      setErrorMessage(
        event?.errorMsg?.errorMsg || "Unable to continue the video call.",
      );
    };

    const handleFatalError = (event: { errorMsg?: string }) => {
      setConnectionStatus("error");
      setErrorMessage(event?.errorMsg || "Unable to continue the video call.");
    };

    const handleLeft = () => {
      setConnectionStatus("left");
      setParticipants([]);
      if (role === "doctor" && appointmentId) {
        endDoctorVideoSessionReq(appointmentId).catch((err) =>
          console.error("Failed to end daily session on backend", err),
        );
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
  ]);

  const toggleCamera = useCallback(async () => {
    const nextValue = !callObject.localVideo();
    await callObject.setLocalVideo(nextValue);
    setIsCameraEnabled(nextValue);
    syncParticipants();
  }, [callObject, syncParticipants]);

  const toggleMicrophone = useCallback(async () => {
    const nextValue = !callObject.localAudio();
    await callObject.setLocalAudio(nextValue);
    setIsMicrophoneEnabled(nextValue);
    syncParticipants();
  }, [callObject, syncParticipants]);

  const leaveMeeting = useCallback(async () => {
    await callObject.leave();
    setConnectionStatus("left");
  }, [callObject]);

  const retryJoin = useCallback(() => {
    setErrorMessage(null);
    setParticipants([]);
    setJoinNonce((value) => value + 1);
  }, []);

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
    isCameraEnabled,
    isMicrophoneEnabled,
    localParticipant,
    remoteParticipants,
    leaveMeeting,
    retryJoin,
    toggleCamera,
    toggleMicrophone,
  };
}
