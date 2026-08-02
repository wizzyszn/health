export type DailyTelehealthRole = "doctor" | "patient";

export interface DailyVideoSession {
  appointmentId: string;
  consultationId: string;
  role: DailyTelehealthRole;
  roomUrl: string;
  token: string;
  expiresAt?: string;
}

export type DailyConnectionStatus =
  | "idle"
  | "joining"
  | "joined"
  | "waiting"
  | "reconnecting"
  | "left"
  | "error";

export interface DailyParticipantTile {
  id: string;
  displayName: string;
  isLocal: boolean;
  isVideoEnabled: boolean;
  isAudioEnabled: boolean;
  videoStream: MediaStream | null;
}
