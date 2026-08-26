import type { GeneralReturnInt } from "@/lib/types";
import { options, requestHandler, urlGenerator } from "./config";
import type { DailyVideoSession } from "@/shared/daily/daily-video-room.types";

/**
 * Single shared cache key for the doctor's video session per appointment.
 * The join flow touches this endpoint from two screens (appointment detail
 * to resolve consultationId, then consultation space to render the call);
 * sharing the key guarantees ONE network call — spec: "call this once".
 */
export const DOCTOR_VIDEO_SESSION_QUERY_KEY = "doctor-video-session";

/** Imperative cache-aware fetch used by the join mutation. */
export const fetchDoctorVideoSession = (
  queryClient: import("@tanstack/react-query").QueryClient,
  appointmentId: string,
): Promise<GeneralReturnInt<DailyVideoSession>> =>
  queryClient.fetchQuery({
    queryKey: [DOCTOR_VIDEO_SESSION_QUERY_KEY, appointmentId],
    queryFn: () => getDoctorVideoSessionReq(appointmentId),
    staleTime: 60_000,
  });

export const getDoctorVideoSessionReq = (appointmentId: string) => {
  const url = urlGenerator(
    "doctors",
    `me/appointments/${appointmentId}/video-token`,
    false,
  );

  return requestHandler<GeneralReturnInt<DailyVideoSession>>(
    url,
    options("GET", null, true),
  );
};

export const getPatientVideoSessionReq = (appointmentId: string) => {
  const url = urlGenerator(
    "patients",
    `me/appointments/${appointmentId}/video-token`,
    false,
  );

  return requestHandler<GeneralReturnInt<DailyVideoSession>>(
    url,
    options("GET", null, true),
  );
};

export const startDoctorVideoSessionReq = (appointmentId: string) => {
  const url = urlGenerator(
    "doctors",
    `me/appointments/${appointmentId}/video/start`,
    false,
  );

  return requestHandler<GeneralReturnInt<{ message: string }>>(
    url,
    options("PATCH", {}, true),
  );
};

export const endDoctorVideoSessionReq = (appointmentId: string) => {
  const url = urlGenerator(
    "doctors",
    `me/appointments/${appointmentId}/video/end`,
    false,
  );

  return requestHandler<GeneralReturnInt<{ message: string }>>(
    url,
    options("PATCH", {}, true),
  );
};
