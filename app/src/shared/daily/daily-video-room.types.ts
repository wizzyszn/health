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
  /** Video-only MediaStream for the tile renderer. */
  videoStream: MediaStream | null;
  /**
   * Audio-only MediaStream. Call-object mode does NOT play remote audio
   * itself — the app must attach this stream to an <audio> element per
   * remote participant (never for local, which would echo).
   */
  audioStream: MediaStream | null;
}
