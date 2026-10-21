import { useCallback, useMemo, useState, useRef, useEffect } from "react";
import { createPortal } from "react-dom";
import {
  Mic,
  MicOff,
  Video,
  VideoOff,
  X,
  Maximize2,
  Minimize2,
  Loader2,
  VideoOff as VideoOffIcon,
  GripHorizontal,
  SwitchCamera,
  Volume2,
} from "lucide-react";
import { Rnd } from "react-rnd";
import { DailyProvider } from "@daily-co/daily-react";
import { toast } from "sonner";
import {
  useDailyVideoRoom,
  DEFAULT_MEDIA_BY_ROLE,
} from "../daily/use-daily-video-room.hook";
import {
  useCallDuration,
  useCountdownToEnd,
} from "../daily/use-call-timers.hook";
import { useWebRtcSupport } from "../daily/use-webrtc-support.hook";
import type {
  DailyParticipantTile,
  DailyVideoSession,
} from "../daily/daily-video-room.types";
import { MediaAccessGate } from "../daily/media-access-gate.component";
import {
  detectInAppBrowser,
  detectMobilePlatform,
  getMediaPermissionHelpLines,
  type MediaAccessErrorDetails,
  type MediaAccessPreferences,
} from "../daily/media-access.util";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";

const MOBILE_BREAKPOINT = 640;
const PIP_CHROME_HEIGHT = 29;

function getPipLayout() {
  if (typeof window === "undefined") {
    return { x: 100, y: 100, width: 480, height: 299, isMobile: false };
  }

  const viewportWidth = window.innerWidth;
  const viewportHeight = window.innerHeight;
  const isMobile = viewportWidth < MOBILE_BREAKPOINT;
  const margin = isMobile ? 12 : 20;
  const availableWidth = viewportWidth - margin * 2;
  const width = isMobile
    ? Math.min(availableWidth, 360)
    : Math.min(480, availableWidth);
  const height = Math.round((width / 16) * 9) + PIP_CHROME_HEIGHT;

  return {
    x: Math.max(margin, viewportWidth - width - margin),
    y: Math.max(margin, viewportHeight - height - margin),
    width,
    height,
    isMobile,
  };
}

function usePipLayout() {
  const [layout, setLayout] = useState(getPipLayout);

  useEffect(() => {
    const handleResize = () => setLayout(getPipLayout());

    window.addEventListener("resize", handleResize);
    window.addEventListener("orientationchange", handleResize);

    return () => {
      window.removeEventListener("resize", handleResize);
      window.removeEventListener("orientationchange", handleResize);
    };
  }, []);

  return layout;
}

function getResizeHandles(isMobile: boolean) {
  return {
    top: !isMobile,
    right: !isMobile,
    bottom: !isMobile,
    left: !isMobile,
    topRight: !isMobile,
    bottomRight: !isMobile,
    bottomLeft: !isMobile,
    topLeft: !isMobile,
  };
}

export interface VideoCallProps {
  session?: DailyVideoSession | null;
  displayName: string;
  role: "doctor" | "patient";
  appointmentId: string;
  scheduledEndAtUtc?: string | null;
  onLeave: () => void;
  isLoading?: boolean;
  isError?: boolean;
  onRetry?: () => void;
  isUnavailable?: boolean;
  errorMessage?: string | null;
  /** Refetch the session (fresh token) when auto-rejoin exhausts. */
  onSessionStale?: () => void;
}

function ParticipantVideo({
  participant,
  className,
}: {
  participant: DailyParticipantTile;
  className?: string;
}) {
  const videoRef = useRef<HTMLVideoElement | null>(null);

  useEffect(() => {
    if (!videoRef.current) return;
    videoRef.current.srcObject = participant.videoStream;

    // Mobile browsers can defer autoplay even for silent video. Start it
    // explicitly; failures are harmless and leave the play overlay intact.
    void videoRef.current.play().catch(() => undefined);
  }, [participant.videoStream]);

  if (!participant.videoStream && !participant.isVideoEnabled) {
    return (
      <div
        className={`flex flex-col items-center justify-center bg-gradient-to-br from-blue-50 via-indigo-50 to-blue-100 overflow-hidden ${className}`}
      >
        <div className="size-20 rounded-full bg-primary/10 flex items-center justify-center flex-shrink-0 shadow-inner">
          <span className="text-xl font-medium text-primary">
            {participant.displayName.charAt(0)}
          </span>
        </div>
      </div>
    );
  }

  return (
    <video
      ref={videoRef}
      autoPlay
      playsInline
      // Remote audio is played by RemoteAudioLayer. Keeping every video
      // element muted avoids double playback and lets mobile autoplay work.
      muted
      className={`object-cover bg-black ${className}`}
    />
  );
}

/**
 * Remote audio sink layer. In call-object mode daily-js does NOT play remote
 * audio itself — each remote participant's audio track must be attached to
 * an <audio> element. Mounted once at the top level (outside the PIP /
 * expanded layout branches) so audio survives minimize/expand transitions.
 */
function RemoteAudioLayer({
  participants,
}: {
  participants: DailyParticipantTile[];
}) {
  const audioElementsRef = useRef(new Map<string, HTMLAudioElement>());
  const [needsAudioUnlock, setNeedsAudioUnlock] = useState(false);

  const registerAudioElement = useCallback(
    (participantId: string, element: HTMLAudioElement | null) => {
      if (element) {
        audioElementsRef.current.set(participantId, element);
      } else {
        audioElementsRef.current.delete(participantId);
      }
    },
    [],
  );

  const markPlaybackBlocked = useCallback(() => {
    setNeedsAudioUnlock(true);
  }, []);

  /**
   * Mobile Chrome/Safari can block the remote audio element when the track
   * arrives outside a user gesture. A direct tap on the fallback prompt
   * re-runs play() for every sink and unlocks audio.
   */
  const playAllAudio = useCallback(async () => {
    const elements = Array.from(audioElementsRef.current.values());
    if (elements.length === 0) {
      setNeedsAudioUnlock(false);
      return;
    }

    const results = await Promise.all(
      elements.map(async (element) => {
        try {
          await element.play();
          return true;
        } catch {
          return false;
        }
      }),
    );

    setNeedsAudioUnlock(results.some((played) => !played));
  }, []);

  useEffect(() => {
    void playAllAudio();
  }, [participants, playAllAudio]);

  return (
    <>
      {participants.map((participant) => (
        <RemoteAudioSink
          key={participant.id}
          participant={participant}
          registerAudioElement={registerAudioElement}
          onPlaybackBlocked={markPlaybackBlocked}
        />
      ))}
      {needsAudioUnlock && (
        <button
          type="button"
          onClick={() => void playAllAudio()}
          className="fixed bottom-24 left-1/2 z-[130] flex -translate-x-1/2 items-center gap-2 rounded-full bg-primary px-4 py-2.5 text-xs font-semibold text-primary-foreground shadow-xl transition-transform hover:scale-105"
        >
          <Volume2 className="size-4" aria-hidden="true" />
          Tap to enable sound
        </button>
      )}
    </>
  );
}

function RemoteAudioSink({
  participant,
  registerAudioElement,
  onPlaybackBlocked,
}: {
  participant: DailyParticipantTile;
  registerAudioElement: (
    participantId: string,
    element: HTMLAudioElement | null,
  ) => void;
  onPlaybackBlocked: () => void;
}) {
  const audioRef = useRef<HTMLAudioElement | null>(null);

  useEffect(() => {
    if (!audioRef.current) return;
    audioRef.current.srcObject = participant.audioStream;

    void audioRef.current.play().catch(() => {
      onPlaybackBlocked();
    });
  }, [participant.audioStream, onPlaybackBlocked]);

  // Local audio is never attached — playing it back would echo.
  if (participant.isLocal || !participant.audioStream) return null;

  return (
    <audio
      ref={(element) => {
        audioRef.current = element;
        registerAudioElement(participant.id, element);
      }}
      autoPlay
      playsInline
      preload="auto"
    />
  );
}

/**
 * Marks a remote tile whose microphone is off. Without this the far side sees
 * a live-looking tile and hears nothing, which is indistinguishable from a
 * call that failed to connect — the exact misreading this exists to prevent.
 * Never shown for the local participant, whose own state is reported by the
 * muted hint instead.
 */
function ParticipantMuteBadge({
  visible,
  compact = false,
}: {
  visible: boolean;
  compact?: boolean;
}) {
  if (!visible) return null;

  return (
    <span
      title="Microphone muted"
      className="flex shrink-0 items-center gap-1 rounded-full bg-red-500/90 px-1.5 py-0.5 text-[10px] font-medium text-white"
    >
      <MicOff className="size-3" aria-hidden="true" />
      {!compact && <span>Muted</span>}
    </span>
  );
}

/**
 * Actionable media error dialog for problems that occur after joining:
 * permission revoked, camera busy, or device unplugged. The call itself stays
 * connected, so this must not look like a fatal connection failure.
 */
function MediaErrorDialog({
  error,
  onClose,
}: {
  error: MediaAccessErrorDetails | null;
  onClose: () => void;
}) {
  if (!error) return null;

  const helpLines = getMediaPermissionHelpLines({
    code: error.code,
    mobilePlatform: detectMobilePlatform(),
    inAppBrowser: detectInAppBrowser(),
  });

  return (
    <Dialog
      open
      onOpenChange={(open) => {
        if (!open) onClose();
      }}
    >
      <DialogContent
        overlayClassName="z-[120]"
        className="z-[120] max-h-[90dvh] max-w-md overflow-y-auto rounded-2xl p-5 text-left sm:p-6"
      >
        <DialogHeader className="space-y-2 text-left">
          <DialogTitle>{error.title}</DialogTitle>
          <DialogDescription className="text-xs leading-relaxed sm:text-sm">
            {error.message}
          </DialogDescription>
        </DialogHeader>
        {helpLines.length > 0 && (
          <ul className="mt-3 list-disc space-y-1.5 pl-5 text-[11px] leading-relaxed text-muted-foreground">
            {helpLines.map((line) => (
              <li key={line}>{line}</li>
            ))}
          </ul>
        )}
        <p className="mt-3 text-[11px] leading-relaxed text-muted-foreground">
          If you're already in the call, it stays connected while you fix the
          setting. Then tap the microphone or camera button again.
        </p>
        <Button type="button" className="mt-4 w-full" onClick={onClose}>
          Got it
        </Button>
      </DialogContent>
    </Dialog>
  );
}

interface LeaveConfirmDialogProps {
  open: boolean;
  /** True when the local user initiated leave (vs. being disconnected). */
  onConfirm: () => void;
  onCancel: () => void;
}

/**
 * Confirmation before leaving an active consultation call — an accidental
 * tap on the red button should not drop a doctor out of a patient visit.
 */
function LeaveConfirmDialog({
  open,
  onConfirm,
  onCancel,
}: LeaveConfirmDialogProps) {
  return (
    <Dialog
      open={open}
      onOpenChange={(next) => (!next ? onCancel() : undefined)}
    >
      {/* Above the expanded call surface (z-100), otherwise the confirmation
          opens behind the full-screen call and Leave Call looks dead. */}
      <DialogContent
        overlayClassName="z-[120]"
        className="z-[120] max-w-sm rounded-xl p-5 sm:p-6"
      >
        <DialogHeader className="space-y-1.5 text-left">
          <DialogTitle>Leave this call?</DialogTitle>
          <DialogDescription>
            You'll stay connected to the consultation space, but you won't be in
            the video room with the other participant.
          </DialogDescription>
        </DialogHeader>
        <DialogFooter className="mt-4 flex-row justify-end gap-2">
          <Button variant="outline" onClick={onCancel}>
            Stay in call
          </Button>
          <Button variant="destructive" onClick={onConfirm}>
            Leave call
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

interface MediaMutedChipProps {
  isMicrophoneEnabled: boolean;
  isCameraEnabled: boolean;
}

/**
 * Compact self-state indicators — sits beside the time-left reader in both the
 * expanded header and the PIP top bar. Spells out "Muted" rather than relying
 * on the icon alone: in the PIP the bottom control bar is hidden until hover,
 * so this is the only thing telling a muted user why they are not being heard.
 */
function MediaMutedChip({
  isMicrophoneEnabled,
  isCameraEnabled,
}: MediaMutedChipProps) {
  const allGood = isMicrophoneEnabled && isCameraEnabled;
  if (allGood) return null;

  return (
    <span className="flex items-center gap-1 rounded-md bg-black/30 px-1.5 py-0.5">
      {!isMicrophoneEnabled && (
        <>
          <MicOff
            className="size-3 text-red-300"
            aria-label="Microphone muted"
          />
          <span className="text-[10px] font-medium text-red-200">Muted</span>
        </>
      )}
      {!isCameraEnabled && (
        <VideoOff className="size-3 text-red-300" aria-label="Camera off" />
      )}
    </span>
  );
}

/** Status banner text for non-fatal in-call states. */
function statusBanner(
  connectionStatus: string,
  peerLeftNotice: string | null,
): string | null {
  if (peerLeftNotice) return peerLeftNotice;
  switch (connectionStatus) {
    case "joining":
      return "Connecting to the consultation room…";
    case "waiting":
      return "Waiting for the other participant to join…";
    case "reconnecting":
      return "Connection interrupted — trying to reconnect…";
    default:
      return null;
  }
}

function VideoCallInner({
  isExpanded,
  setIsExpanded,
  onLeave,
  dailyState,
  scheduledEnd,
}: {
  isExpanded: boolean;
  setIsExpanded: (val: boolean) => void;
  onLeave: () => void;
  dailyState: ReturnType<typeof useDailyVideoRoom>;
  scheduledEnd?: string | null;
}) {
  const {
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
    toggleCamera,
    toggleMicrophone,
  } = dailyState;

  const mainParticipant =
    remoteParticipants.length > 0 ? remoteParticipants[0] : localParticipant;

  const isJoined =
    connectionStatus === "joined" || connectionStatus === "waiting";
  const lastToastMessageRef = useRef<string | null>(null);

  // Call clock + scheduled-end countdown (spec §5). startedAtMs is set when
  // the local user actually joins; null before that keeps both at zero.
  const [joinedAtMs] = useState<number | null>(() =>
    isJoined ? Date.now() : null,
  );
  const [isLeaveConfirmOpen, setIsLeaveConfirmOpen] = useState(false);
  const requestLeave = () => setIsLeaveConfirmOpen(true);
  const cancelLeave = () => setIsLeaveConfirmOpen(false);
  const elapsedDisplay = useCallDuration(joinedAtMs);
  const countdown = useCountdownToEnd(scheduledEnd ?? null);
  const bannerText = statusBanner(connectionStatus, peerLeftNotice);

  useEffect(() => {
    if (connectionStatus !== "error" || !errorMessage) return;
    if (lastToastMessageRef.current === errorMessage) return;

    lastToastMessageRef.current = errorMessage;
    toast.error(errorMessage);
  }, [connectionStatus, errorMessage]);

  const handleLeave = async () => {
    onLeave();
  };

  if (isExpanded) {
    return (
      <DailyProvider callObject={callObject}>
        {/* Remote audio sinks live OUTSIDE both layout branches so sound
            survives PIP <-> expanded transitions. */}
        <RemoteAudioLayer participants={remoteParticipants} />
        <LeaveConfirmDialog
          open={isLeaveConfirmOpen}
          onConfirm={() => {
            setIsLeaveConfirmOpen(false);
            void handleLeave();
          }}
          onCancel={cancelLeave}
        />
        <MediaErrorDialog error={mediaError} onClose={clearMediaError} />
        <div className="fixed inset-0 z-[100] flex h-[100dvh] flex-col bg-white">
          {/* Header */}
          <header className="min-h-14 sm:h-16 bg-primary flex items-center justify-between gap-3 px-4 py-3 sm:px-6 shrink-0 z-50 shadow-sm relative">
            <div className="flex min-w-0 flex-col gap-0.5">
              <span className="flex min-w-0 items-center gap-3">
                <span
                  className={`size-2 rounded-full shadow-lg ${bannerText ? "bg-yellow-400" : "bg-green-400 animate-pulse"}`}
                />
                <span className="truncate text-xs sm:text-sm text-primary-foreground font-medium font-mono">
                  {isJoined ? elapsedDisplay : connectionStatus}
                </span>
                {scheduledEnd && countdown.display && (
                  <span
                    className={`rounded-md px-1.5 py-0.5 font-mono text-[10px] ${
                      countdown.isWarning
                        ? "bg-red-500/90 text-white"
                        : "bg-white/15 text-primary-foreground"
                    }`}
                  >
                    {countdown.isExpired
                      ? "time up"
                      : `${countdown.display} left`}
                  </span>
                )}
                <MediaMutedChip
                  isMicrophoneEnabled={isMicrophoneEnabled}
                  isCameraEnabled={isCameraEnabled}
                />
              </span>
              {bannerText && (
                <span className="truncate text-[10px] sm:text-xs text-primary-foreground/80">
                  {bannerText}
                </span>
              )}
            </div>
            <button
              onClick={() => setIsExpanded(false)}
              className="p-2 hover:bg-white/10 rounded-full transition-colors"
              aria-label="Minimize to PIP"
            >
              <Minimize2 className="size-5 text-primary-foreground" />
            </button>
          </header>

          {/* Main Video Area */}
          <div className="flex-1 bg-gradient-to-br from-blue-50 via-indigo-50 to-blue-100 flex items-center justify-center relative overflow-hidden">
            {/* Self-state prompt. A muted user hears everyone else perfectly,
                so the call feels fine from their side — nothing else on screen
                tells them the other participant cannot hear them. */}
            {isJoined && !isMicrophoneEnabled && (
              <div className="pointer-events-none absolute left-1/2 top-3 z-20 -translate-x-1/2 rounded-full bg-red-500/95 px-3 py-1.5 text-[11px] font-medium text-white shadow-lg sm:text-xs">
                You're muted — tap the mic to speak
              </div>
            )}
            {mainParticipant ? (
              <ParticipantVideo
                participant={mainParticipant}
                className="size-full absolute inset-0"
              />
            ) : (
              <div className="flex flex-col items-center gap-4 z-10">
                <Loader2 className="h-8 w-8 text-primary animate-spin" />
                <div className="text-primary bg-white/50 backdrop-blur-sm px-6 py-3 rounded-full border border-white/20 shadow-xl font-medium">
                  Connecting...
                </div>
              </div>
            )}

            {mainParticipant && (
              <div className="absolute bottom-4 left-1/2 z-20 w-[calc(100%-2rem)] max-w-xs -translate-x-1/2 sm:bottom-6">
                <div className="flex items-center justify-center gap-2 text-white bg-gray-900/60 backdrop-blur-md px-4 py-2 sm:px-6 rounded-full border border-white/10 shadow-xl text-center">
                  <span className="block truncate text-xs sm:text-sm font-medium">
                    {mainParticipant.displayName}
                  </span>
                  <ParticipantMuteBadge
                    visible={
                      !mainParticipant.isLocal &&
                      !mainParticipant.isAudioEnabled
                    }
                  />
                </div>
              </div>
            )}

            {/* Picture in Picture of Local */}
            {mainParticipant !== localParticipant && localParticipant && (
              <div className="absolute bottom-4 sm:bottom-6 right-4 sm:right-6 w-24 sm:w-32 md:w-48 aspect-video rounded-xl overflow-hidden border-2 border-white/20 shadow-2xl z-30">
                <ParticipantVideo
                  participant={localParticipant}
                  className="size-full"
                />
                <div className="absolute bottom-1 left-2 bg-black/50 px-2 py-0.5 rounded text-[10px] text-white">
                  You
                </div>
              </div>
            )}
          </div>

          {/* Bottom Controls */}
          <div className="min-h-20 sm:h-24 bg-white border-t border-gray-200 flex items-center justify-center shrink-0 px-3 pt-3 pb-[calc(0.75rem+env(safe-area-inset-bottom))] sm:pb-3">
            <div className="flex w-full max-w-md items-center justify-center gap-2 sm:gap-4">
              <button
                type="button"
                onClick={() => void toggleMicrophone()}
                aria-label={
                  isMicrophoneEnabled ? "Mute microphone" : "Unmute microphone"
                }
                title={
                  isMicrophoneEnabled ? "Mute microphone" : "Unmute microphone"
                }
                className={`flex size-11 sm:size-14 items-center justify-center rounded-full transition-colors shadow-sm ${
                  !isMicrophoneEnabled
                    ? "bg-red-500 hover:bg-red-600 text-white"
                    : "bg-gray-100 hover:bg-gray-200 text-gray-800 border border-gray-200"
                }`}
              >
                {!isMicrophoneEnabled ? (
                  <MicOff className="size-5 sm:size-6" />
                ) : (
                  <Mic className="size-5 sm:size-6" />
                )}
              </button>

              <button
                type="button"
                onClick={() => void toggleCamera()}
                aria-label={
                  isCameraEnabled ? "Turn camera off" : "Turn camera on"
                }
                title={isCameraEnabled ? "Turn camera off" : "Turn camera on"}
                className={`flex size-11 sm:size-14 items-center justify-center rounded-full transition-colors shadow-sm ${
                  !isCameraEnabled
                    ? "bg-red-500 hover:bg-red-600 text-white"
                    : "bg-gray-100 hover:bg-gray-200 text-gray-800 border border-gray-200"
                }`}
              >
                {!isCameraEnabled ? (
                  <VideoOff className="size-5 sm:size-6" />
                ) : (
                  <Video className="size-5 sm:size-6" />
                )}
              </button>

              <button
                type="button"
                onClick={() => void flipCamera()}
                disabled={!isCameraEnabled || isCameraFlipping}
                aria-label="Switch camera"
                title="Switch front/back camera"
                className="flex size-11 sm:size-14 items-center justify-center rounded-full border border-gray-200 bg-gray-100 text-gray-800 shadow-sm transition-colors hover:bg-gray-200 disabled:cursor-not-allowed disabled:opacity-40"
              >
                {isCameraFlipping ? (
                  <Loader2 className="size-5 animate-spin sm:size-6" />
                ) : (
                  <SwitchCamera className="size-5 sm:size-6" />
                )}
              </button>
              <div className="w-px h-6 sm:h-8 bg-gray-200 mx-1 sm:mx-2" />
              <button
                type="button"
                onClick={requestLeave}
                className="min-h-11 px-4 py-2 sm:px-6 sm:py-4 rounded-full bg-red-500 hover:bg-red-600 text-white font-medium transition-colors shadow-sm text-sm sm:text-base whitespace-nowrap"
              >
                Leave Call
              </button>
            </div>
          </div>
        </div>
      </DailyProvider>
    );
  }

  // Content for PIP Window
  return (
    <DailyProvider callObject={callObject}>
      <RemoteAudioLayer participants={remoteParticipants} />
      <LeaveConfirmDialog
        open={isLeaveConfirmOpen}
        onConfirm={() => {
          setIsLeaveConfirmOpen(false);
          void handleLeave();
        }}
        onCancel={cancelLeave}
      />
      <MediaErrorDialog error={mediaError} onClose={clearMediaError} />
      <div className="size-full bg-gradient-to-br from-blue-50 via-indigo-50 to-blue-100 flex items-center justify-center relative ">
        {mainParticipant ? (
          <ParticipantVideo
            participant={mainParticipant}
            className="size-full absolute inset-0"
          />
        ) : (
          <div className="flex flex-col items-center gap-2 z-10">
            <Loader2 className="h-6 w-6 text-primary animate-spin" />
            <span className="text-[10px] font-medium text-primary bg-white/50 px-2 py-0.5 rounded-full shadow-sm">
              Connecting...
            </span>
          </div>
        )}
        {mainParticipant && (
          <div className="absolute bottom-2 left-2 z-20 flex items-center gap-1 text-white bg-gray-900/50 backdrop-blur-sm px-2 py-1 rounded-md pointer-events-none">
            <span className="text-[10px] font-medium">
              {mainParticipant.displayName}
            </span>
            {/* Icon-only here: the PIP is too narrow for the word, and its
                bottom control bar is hidden until hover. */}
            <ParticipantMuteBadge
              compact
              visible={
                !mainParticipant.isLocal && !mainParticipant.isAudioEnabled
              }
            />
          </div>
        )}
      </div>

      <div className="absolute inset-0 z-40 bg-black/20 sm:bg-transparent flex items-end justify-center pb-3 opacity-100 sm:opacity-0 sm:hover:opacity-100 sm:hover:bg-black/30 transition-all duration-200">
        <div className="flex items-center gap-1.5 bg-white/95 backdrop-blur-sm px-3 py-2 rounded-full shadow-lg sm:translate-y-2 sm:hover:translate-y-0 transition-transform">
          <button
            type="button"
            onClick={(e) => {
              e.stopPropagation();
              void toggleMicrophone();
            }}
            aria-label={
              isMicrophoneEnabled ? "Mute microphone" : "Unmute microphone"
            }
            title={
              isMicrophoneEnabled ? "Mute microphone" : "Unmute microphone"
            }
            className={`p-1.5 rounded-full transition-colors ${
              !isMicrophoneEnabled
                ? "bg-red-500 text-white"
                : "bg-gray-100 hover:bg-gray-200 text-gray-800"
            }`}
          >
            {!isMicrophoneEnabled ? (
              <MicOff className="size-3.5" />
            ) : (
              <Mic className="size-3.5" />
            )}
          </button>

          <button
            type="button"
            onClick={(e) => {
              e.stopPropagation();
              void toggleCamera();
            }}
            aria-label={isCameraEnabled ? "Turn camera off" : "Turn camera on"}
            title={isCameraEnabled ? "Turn camera off" : "Turn camera on"}
            className={`p-1.5 rounded-full transition-colors ${
              !isCameraEnabled
                ? "bg-red-500 text-white"
                : "bg-gray-100 hover:bg-gray-200 text-gray-800"
            }`}
          >
            {!isCameraEnabled ? (
              <VideoOff className="size-3.5" />
            ) : (
              <Video className="size-3.5" />
            )}
          </button>

          <button
            type="button"
            onClick={(e) => {
              e.stopPropagation();
              void flipCamera();
            }}
            disabled={!isCameraEnabled || isCameraFlipping}
            aria-label="Switch camera"
            title="Switch front/back camera"
            className="p-1.5 rounded-full bg-gray-100 text-gray-800 transition-colors hover:bg-gray-200 disabled:cursor-not-allowed disabled:opacity-40"
          >
            {isCameraFlipping ? (
              <Loader2 className="size-3.5 animate-spin" />
            ) : (
              <SwitchCamera className="size-3.5" />
            )}
          </button>

          <button
            type="button"
            onClick={(e) => {
              e.stopPropagation();
              setIsExpanded(true);
            }}
            aria-label="Expand call"
            title="Expand call"
            className="p-1.5 rounded-full bg-gray-100 hover:bg-gray-200 text-gray-800 transition-colors"
          >
            <Maximize2 className="size-3.5" />
          </button>

          <button
            type="button"
            onClick={(e) => {
              e.stopPropagation();
              requestLeave();
            }}
            aria-label="Leave call"
            title="Leave call"
            className="p-1.5 rounded-full bg-red-500 hover:bg-red-600 text-white transition-colors"
          >
            <X className="size-3.5" />
          </button>
        </div>
      </div>

      <div className="absolute top-0 left-0 right-0 bg-gradient-to-b from-black/40 to-transparent p-3 pt-2 flex items-center justify-between pointer-events-none z-20">
        <div className="flex min-w-0 items-center gap-2">
          {isJoined && !bannerText && (
            <div className="size-2 shrink-0 bg-green-400 rounded-full shadow-lg animate-pulse" />
          )}
          <span className="truncate text-[10px] text-white font-medium drop-shadow-md mt-0.5">
            {bannerText ?? (isJoined ? "call active" : connectionStatus)}
          </span>
        </div>
        {/* Right side: time-left reader + mic/cam mute indicators (user ask:
            indicators sit beside the time-left reader). */}
        <div className="flex shrink-0 items-center gap-1.5">
          {scheduledEnd && countdown.display && (
            <span
              className={`rounded-md px-1.5 py-0.5 font-mono text-[10px] backdrop-blur-sm ${
                countdown.isExpired
                  ? "bg-red-500/90 text-white"
                  : countdown.isWarning
                    ? "bg-red-500/80 text-white"
                    : "bg-black/40 text-white"
              }`}
            >
              {countdown.isExpired ? "time up" : `${countdown.display} left`}
            </span>
          )}
          <MediaMutedChip
            isMicrophoneEnabled={isMicrophoneEnabled}
            isCameraEnabled={isCameraEnabled}
          />
        </div>
      </div>
    </DailyProvider>
  );
}

function ConnectedVideoCall({
  session,
  displayName,
  role,
  appointmentId,
  scheduledEndAtUtc,
  onLeave,
  onSessionStale,
  initialPreferences,
}: {
  session: DailyVideoSession;
  displayName: string;
  role: "doctor" | "patient";
  appointmentId: string;
  scheduledEndAtUtc?: string | null;
  onLeave: () => void;
  /** Called when auto-rejoin exhausts — parent should refetch a fresh token. */
  onSessionStale?: () => void;
  initialPreferences: MediaAccessPreferences;
}) {
  // A phone has no room for an expanded charting view next to a tiny PIP;
  // start the call full-screen so the media controls are always reachable.
  const [isExpanded, setIsExpanded] = useState(
    () =>
      typeof window !== "undefined" && window.innerWidth < MOBILE_BREAKPOINT,
  );
  const pipLayout = usePipLayout();
  const dailyState = useDailyVideoRoom(
    session,
    displayName,
    role,
    appointmentId,
    onSessionStale,
    initialPreferences,
  );

  const handleLeave = async () => {
    // Daily's leave() can reject on a flaky mobile connection. The user asked
    // to leave, so always hand control back to the parent even if the room
    // teardown fails — otherwise the call stays on screen and the button
    // looks unresponsive.
    try {
      await dailyState.leaveMeeting();
    } catch {
      // Ignore: the parent unmounts the call either way.
    } finally {
      onLeave();
    }
  };

  if (isExpanded) {
    return (
      <VideoCallInner
        isExpanded={true}
        setIsExpanded={setIsExpanded}
        onLeave={handleLeave}
        dailyState={dailyState}
        scheduledEnd={scheduledEndAtUtc}
      />
    );
  }

  const pipContent = (
    <Rnd
      key={`${pipLayout.x}-${pipLayout.y}-${pipLayout.width}-${pipLayout.height}`}
      default={pipLayout}
      minWidth={pipLayout.isMobile ? 220 : 240}
      minHeight={pipLayout.isMobile ? 153 : 164}
      maxWidth={pipLayout.isMobile ? pipLayout.width : 800}
      maxHeight={pipLayout.isMobile ? pipLayout.height : 479}
      lockAspectRatio={16 / 9}
      lockAspectRatioExtraHeight={PIP_CHROME_HEIGHT}
      dragHandleClassName="drag-handle"
      bounds="window"
      enableResizing={getResizeHandles(pipLayout.isMobile)}
      style={{
        position: "fixed",
        zIndex: 50,
      }}
    >
      <div className="size-full relative rounded-2xl sm:rounded-[24px] overflow-hidden shadow-[0_25px_50px_-12px_rgba(0,0,0,0.5)] drop-shadow-2xl border border-gray-200 bg-white flex flex-col">
        <div className="drag-handle w-full flex items-center justify-center p-1.5 cursor-move bg-primary text-primary-foreground shadow-sm active:cursor-grabbing transition-colors z-50 shrink-0 touch-none">
          <GripHorizontal className="size-4" />
        </div>

        <div className="flex-1 w-full overflow-hidden bg-white relative">
          <VideoCallInner
            isExpanded={false}
            setIsExpanded={setIsExpanded}
            onLeave={handleLeave}
            dailyState={dailyState}
            scheduledEnd={scheduledEndAtUtc}
          />
        </div>
      </div>
    </Rnd>
  );

  return createPortal(pipContent, document.body);
}

function ActiveVideoCall({
  session,
  displayName,
  role,
  appointmentId,
  scheduledEndAtUtc,
  onLeave,
  onSessionStale,
}: {
  session: DailyVideoSession;
  displayName: string;
  role: "doctor" | "patient";
  appointmentId: string;
  scheduledEndAtUtc?: string | null;
  onLeave: () => void;
  /** Called when auto-rejoin exhausts — parent should refetch a fresh token. */
  onSessionStale?: () => void;
}) {
  const [preferences, setPreferences] = useState<MediaAccessPreferences | null>(
    null,
  );
  const defaultPreferences = useMemo<MediaAccessPreferences>(() => {
    const defaults = DEFAULT_MEDIA_BY_ROLE[role];
    return {
      audio: !defaults.startAudioOff,
      video: !defaults.startVideoOff,
    };
  }, [role]);

  if (!preferences) {
    return (
      <MediaAccessGate
        defaultPreferences={defaultPreferences}
        onReady={setPreferences}
        onCancel={onLeave}
      />
    );
  }

  return (
    <ConnectedVideoCall
      session={session}
      displayName={displayName}
      role={role}
      appointmentId={appointmentId}
      scheduledEndAtUtc={scheduledEndAtUtc}
      onSessionStale={onSessionStale}
      onLeave={onLeave}
      initialPreferences={preferences}
    />
  );
}

export function VideoCall({
  session,
  displayName,
  role,
  appointmentId,
  scheduledEndAtUtc,
  onLeave,
  isLoading,
  isError,
  onRetry,
  isUnavailable,
  errorMessage,
  onSessionStale,
}: VideoCallProps) {
  const pipLayout = usePipLayout();
  const webrtcSupport = useWebRtcSupport();
  const visibleErrorMessage =
    errorMessage || "Unable to load the video session.";
  const lastToastMessageRef = useRef<string | null>(null);
  const endCountdown = useCountdownToEnd(scheduledEndAtUtc);
  const hasAutoEndedRef = useRef(false);

  // The booked window is the hard stop for BOTH roles. This used to live only
  // on the doctor's consultation page, so a patient who joined from their
  // appointment stayed in the room after time was up.
  useEffect(() => {
    if (!scheduledEndAtUtc || !endCountdown.isExpired) return;
    if (hasAutoEndedRef.current) return;
    hasAutoEndedRef.current = true;
    toast.info("The scheduled consultation time is up. The call has ended.");
    onLeave();
  }, [scheduledEndAtUtc, endCountdown.isExpired, onLeave]);

  useEffect(() => {
    if (!isError || isLoading || isUnavailable) return;
    if (lastToastMessageRef.current === visibleErrorMessage) return;

    lastToastMessageRef.current = visibleErrorMessage;
    toast.error(visibleErrorMessage);
  }, [isError, isLoading, isUnavailable, visibleErrorMessage]);

  if (!webrtcSupport.supported) {
    return (
      <div className="flex h-full min-h-[240px] flex-col items-center justify-center gap-3 bg-gray-50 p-6 text-center">
        <VideoOffIcon className="h-8 w-8 text-gray-400" />
        <p className="max-w-[36ch] text-sm text-gray-600">
          {webrtcSupport.reason}
        </p>
        <Button size="sm" variant="outline" onClick={onLeave}>
          Close
        </Button>
      </div>
    );
  }

  if (session && !isUnavailable && !isError && !isLoading) {
    return (
      <ActiveVideoCall
        session={session}
        displayName={displayName}
        role={role}
        appointmentId={appointmentId}
        scheduledEndAtUtc={scheduledEndAtUtc}
        onSessionStale={onSessionStale}
        onLeave={onLeave}
      />
    );
  }

  const pipContent = (
    <Rnd
      key={`${pipLayout.x}-${pipLayout.y}-${pipLayout.width}-${pipLayout.height}`}
      default={pipLayout}
      minWidth={pipLayout.isMobile ? 220 : 240}
      minHeight={pipLayout.isMobile ? 153 : 164}
      maxWidth={pipLayout.isMobile ? pipLayout.width : 800}
      maxHeight={pipLayout.isMobile ? pipLayout.height : 479}
      lockAspectRatio={16 / 9}
      lockAspectRatioExtraHeight={PIP_CHROME_HEIGHT}
      dragHandleClassName="drag-handle"
      bounds="window"
      enableResizing={getResizeHandles(pipLayout.isMobile)}
      style={{
        position: "fixed",
        zIndex: 50,
      }}
    >
      <div className="size-full relative rounded-2xl sm:rounded-[24px] overflow-hidden shadow-[0_25px_50px_-12px_rgba(0,0,0,0.5)] drop-shadow-2xl border border-gray-200 bg-white flex flex-col">
        <div className="drag-handle w-full flex items-center justify-center p-1.5 cursor-move bg-primary text-primary-foreground shadow-sm active:cursor-grabbing transition-colors z-50 shrink-0 touch-none">
          <GripHorizontal className="size-4" />
        </div>

        <div className="flex-1 w-full overflow-hidden bg-white relative">
          {isUnavailable ? (
            <div className="size-full flex flex-col items-center justify-center px-4 text-center bg-gray-50">
              <VideoOffIcon className="h-6 w-6 text-gray-400" />
              {/* Room-not-open is a normal waiting state, not a failure —
                  surface the backend's patient-facing copy verbatim and let
                  the patient re-check manually (spec §4). */}
              <p className="mt-2 max-w-[26ch] text-xs text-gray-500">
                {errorMessage ||
                  "The consultation hasn't started yet. Please wait for the doctor to begin."}
              </p>
              <div className="mt-2 flex flex-wrap items-center justify-center gap-2">
                {onRetry && (
                  <Button
                    size="sm"
                    className="h-7 text-[10px]"
                    onClick={onRetry}
                  >
                    Try again
                  </Button>
                )}
                <Button
                  size="sm"
                  variant="outline"
                  className="h-7 text-[10px]"
                  onClick={onLeave}
                >
                  Close
                </Button>
              </div>
            </div>
          ) : isLoading ? (
            <div className="size-full flex flex-col items-center justify-center bg-gray-50">
              <Loader2 className="h-6 w-6 animate-spin text-gray-400" />
              <p className="mt-2 text-xs text-gray-500">Preparing room...</p>
            </div>
          ) : isError || !session ? (
            <div className="size-full flex flex-col items-center justify-center px-4 text-center bg-gray-50">
              <p className="text-xs font-semibold text-gray-700">
                {visibleErrorMessage}
              </p>
              <div className="mt-2 flex flex-wrap gap-2 justify-center">
                {onRetry && (
                  <Button
                    size="sm"
                    className="h-7 text-[10px]"
                    onClick={onRetry}
                  >
                    Retry
                  </Button>
                )}
                <Button
                  size="sm"
                  variant="outline"
                  className="h-7 text-[10px]"
                  onClick={onLeave}
                >
                  Close
                </Button>
              </div>
            </div>
          ) : null}
        </div>
      </div>
    </Rnd>
  );

  return createPortal(pipContent, document.body);
}
