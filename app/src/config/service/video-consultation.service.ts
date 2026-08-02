import type { GeneralReturnInt } from "@/lib/types";
import { options, requestHandler, urlGenerator } from "./config";
import type { DailyVideoSession } from "@/shared/daily/daily-video-room.types";

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
