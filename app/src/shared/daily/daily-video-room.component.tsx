import { DailyProvider } from "@daily-co/daily-react";
import { useEffect, useRef, useState } from "react";
import { AlertCircle, Loader2, ShieldCheck, Video } from "lucide-react";
import { Button } from "@/components/ui/button";
import { DailyCallControls } from "./daily-call-controls.component";
import { useDailyVideoRoom } from "./use-daily-video-room.hook";
import type {
  DailyParticipantTile,
  DailyVideoSession,
} from "./daily-video-room.types";

interface DailyVideoRoomProps {
  session: DailyVideoSession;
  displayName: string;
  role: "doctor" | "patient";
  appointmentId: string;
  scheduledEndAtUtc?: string | null;
  onLeave: () => void;
}

function useCallTimer(isJoined: boolean) {
  const [seconds, setSeconds] = useState(0);

  useEffect(() => {
    if (!isJoined) return;
    const interval = setInterval(() => setSeconds((s) => s + 1), 1000);
    return () => clearInterval(interval);
  }, [isJoined]);

  const display = [
    String(Math.floor(seconds / 3600)).padStart(2, "0"),
    String(Math.floor((seconds % 3600) / 60)).padStart(2, "0"),
    String(seconds % 60).padStart(2, "0"),
  ].join(":");

  return display;
}

function useCountdown(endTimeUtc?: string | null) {
  const [remaining, setRemaining] = useState(0);

  useEffect(() => {
    if (!endTimeUtc) return;
    const endTime = new Date(endTimeUtc);

    const tick = () => {
      const diff = Math.max(
        0,
        Math.floor((endTime.getTime() - Date.now()) / 1000),
      );
      setRemaining(diff);
    };
    tick();
    const interval = setInterval(tick, 1000);
    return () => clearInterval(interval);
  }, [endTimeUtc]);

  const display = [
    String(Math.floor(remaining / 60)).padStart(2, "0"),
    String(remaining % 60).padStart(2, "0"),
  ].join(":");

  const isWarning = remaining <= 300; // under 5 minutes
  const isExpired = remaining === 0;

  return { display, isWarning, isExpired };
}

function ParticipantTile({
  participant,
}: {
  participant: DailyParticipantTile;
}) {
  const videoRef = useRef<HTMLVideoElement | null>(null);

  useEffect(() => {
    if (!videoRef.current) return;
    videoRef.current.srcObject = participant.videoStream;
  }, [participant.videoStream]);

  return (
    <div className="relative overflow-hidden rounded-[20px] border border-border bg-[#101828] min-h-[240px]">
      {participant.videoStream && participant.isVideoEnabled ? (
        <video
          ref={videoRef}
          autoPlay
          playsInline
          muted={participant.isLocal}
          className="h-full min-h-[240px] w-full object-cover"
        />
      ) : (
        <div className="flex h-full min-h-[240px] w-full items-center justify-center bg-gradient-to-br from-[#16213E] via-[#101828] to-[#1D2939] text-white">
          <div className="text-center">
            <div className="mx-auto mb-3 flex h-14 w-14 items-center justify-center rounded-full bg-white/10">
              <Video className="h-6 w-6" />
            </div>
            <p className="text-sm font-semibold">{participant.displayName}</p>
            <p className="mt-1 text-xs text-white/70">
              {participant.isVideoEnabled
                ? "Connecting video..."
                : "Camera is off"}
            </p>
          </div>
        </div>
      )}

      <div className="absolute inset-x-0 bottom-0 flex items-center justify-between bg-gradient-to-t from-black/70 to-transparent px-4 py-3 text-xs text-white">
        <span className="font-medium">
          {participant.displayName}
          {participant.isLocal ? " (You)" : ""}
        </span>
        <span className="text-white/75">
          {participant.isAudioEnabled ? "Mic on" : "Mic muted"}
        </span>
      </div>
    </div>
  );
}

export function DailyVideoRoom({
  session,
  displayName,
  role,
  appointmentId,
  scheduledEndAtUtc,
  onLeave,
}: DailyVideoRoomProps) {
  const {
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
  } = useDailyVideoRoom(session, displayName, role, appointmentId);

  const isJoined =
    connectionStatus === "joined" || connectionStatus === "waiting";
  const elapsedDisplay = useCallTimer(isJoined);
  const {
    display: countdownDisplay,
    isWarning,
    isExpired,
  } = useCountdown(scheduledEndAtUtc);

  const statusMessage =
    connectionStatus === "joining"
      ? "Preparing your secure Daily room..."
      : connectionStatus === "waiting"
        ? "Connected. Waiting for the other participant to join."
        : connectionStatus === "reconnecting"
          ? "Connection interrupted. Daily is reconnecting..."
          : connectionStatus === "error"
            ? errorMessage || "The video session could not be started."
            : connectionStatus === "left"
              ? "You left the call."
              : "Secure Carelexa session is active.";

  const handleLeave = async () => {
    await leaveMeeting();
    onLeave();
  };

  return (
    <DailyProvider callObject={callObject}>
      <div className="relative overflow-hidden rounded-[24px] border border-border bg-card shadow-sm">
        <div className="flex flex-col gap-4 border-b border-border bg-[#F8FAFC] px-5 py-4 lg:flex-row lg:items-center lg:justify-between">
          <div>
            <div className="flex items-center gap-2 text-sm font-semibold text-foreground">
              <ShieldCheck className="h-4 w-4 text-[#0F9D58]" />
              Carelexa consultation
              {isJoined && (
                <div className="ml-4 flex items-center gap-3">
                  <span className="flex items-center gap-1.5 rounded-md bg-gray-100 px-2 py-0.5 font-mono text-xs text-gray-700">
                    <span className="h-1.5 w-1.5 rounded-full bg-blue-500" />
                    {elapsedDisplay}
                  </span>
                  {scheduledEndAtUtc && (
                    <span
                      className={`flex items-center gap-1.5 rounded-md px-2 py-0.5 font-mono text-xs ${
                        isWarning
                          ? "bg-red-100 text-red-700"
                          : "bg-gray-100 text-gray-700"
                      }`}
                    >
                      {isWarning && <span>⚠</span>}
                      {countdownDisplay} remaining
                    </span>
                  )}
                </div>
              )}
            </div>
            <p className="mt-1 text-sm text-muted-foreground">
              {statusMessage}
            </p>
          </div>
          <DailyCallControls
            isCameraEnabled={isCameraEnabled}
            isMicrophoneEnabled={isMicrophoneEnabled}
            isBusy={connectionStatus === "joining"}
            onLeave={handleLeave}
            onToggleCamera={() => void toggleCamera()}
            onToggleMicrophone={() => void toggleMicrophone()}
          />
        </div>

        <div className="grid gap-4 p-5 lg:grid-cols-2">
          {remoteParticipants.length > 0 ? (
            remoteParticipants.map((participant) => (
              <ParticipantTile key={participant.id} participant={participant} />
            ))
          ) : (
            <div className="flex min-h-[240px] items-center justify-center rounded-[20px] border border-dashed border-border bg-[#F8FAFC] p-6 text-center text-sm text-muted-foreground">
              {connectionStatus === "joining" ? (
                <span className="inline-flex items-center gap-2">
                  <Loader2 className="h-4 w-4 animate-spin" />
                  Connecting you to the consultation room...
                </span>
              ) : (
                <span>The other participant has not joined yet.</span>
              )}
            </div>
          )}

          {localParticipant ? (
            <ParticipantTile participant={localParticipant} />
          ) : (
            <div className="flex min-h-[240px] items-center justify-center rounded-[20px] border border-dashed border-border bg-[#F8FAFC] p-6 text-sm text-muted-foreground">
              <span className="inline-flex items-center gap-2">
                <Loader2 className="h-4 w-4 animate-spin" />
                Waiting for your local video feed...
              </span>
            </div>
          )}
        </div>

        {connectionStatus === "error" && (
          <div className="border-t border-border bg-[#FFF4ED] px-5 py-4 text-sm text-[#9A3412]">
            <div className="flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
              <div className="flex items-start gap-2">
                <AlertCircle className="mt-0.5 h-4 w-4 shrink-0" />
                <span>
                  {errorMessage ||
                    "This Daily session could not be established."}
                </span>
              </div>
              <div className="flex gap-3">
                <Button variant="outline" onClick={retryJoin}>
                  Retry Join
                </Button>
                <Button variant="ghost" onClick={onLeave}>
                  Close Panel
                </Button>
              </div>
            </div>
          </div>
        )}

        {isJoined && scheduledEndAtUtc && isExpired && (
          <div className="absolute inset-0 z-50 flex items-center justify-center bg-black/80">
            <div className="rounded-xl bg-white p-6 text-center">
              <p className="text-lg font-semibold text-gray-900">
                Your appointment time has ended
              </p>
              <Button
                variant="destructive"
                className="mt-4"
                onClick={handleLeave}
              >
                End Consultation
              </Button>
            </div>
          </div>
        )}
      </div>
    </DailyProvider>
  );
}
