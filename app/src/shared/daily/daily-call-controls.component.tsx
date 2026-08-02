import { Button } from "@/components/ui/button";
import { Mic, MicOff, PhoneOff, Video, VideoOff } from "lucide-react";

interface DailyCallControlsProps {
  isCameraEnabled: boolean;
  isMicrophoneEnabled: boolean;
  isBusy?: boolean;
  onLeave: () => void;
  onToggleCamera: () => void;
  onToggleMicrophone: () => void;
}

export function DailyCallControls({
  isCameraEnabled,
  isMicrophoneEnabled,
  isBusy,
  onLeave,
  onToggleCamera,
  onToggleMicrophone,
}: DailyCallControlsProps) {
  return (
    <div className="flex flex-wrap items-center gap-3">
      <Button
        type="button"
        variant="outline"
        className="rounded-full"
        onClick={onToggleMicrophone}
        disabled={isBusy}
      >
        {isMicrophoneEnabled ? (
          <Mic className="mr-2 h-4 w-4" />
        ) : (
          <MicOff className="mr-2 h-4 w-4" />
        )}
        {isMicrophoneEnabled ? "Mute" : "Unmute"}
      </Button>
      <Button
        type="button"
        variant="outline"
        className="rounded-full"
        onClick={onToggleCamera}
        disabled={isBusy}
      >
        {isCameraEnabled ? (
          <Video className="mr-2 h-4 w-4" />
        ) : (
          <VideoOff className="mr-2 h-4 w-4" />
        )}
        {isCameraEnabled ? "Stop Camera" : "Start Camera"}
      </Button>
      <Button
        type="button"
        variant="destructive"
        className="rounded-full"
        onClick={onLeave}
        disabled={isBusy}
      >
        <PhoneOff className="mr-2 h-4 w-4" />
        Leave Call
      </Button>
    </div>
  );
}
