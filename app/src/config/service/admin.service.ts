import { GeneralReturnInt, PatientProfileInterface } from "@/lib/types";
import { options, requestHandler, urlGenerator } from "./config";

type GetAllPatientsParams = {
  page?: string;
  perPage?: string;
  q?: string;
};

export const getAllPatientsReq = (params: GetAllPatientsParams = {}) => {
  const query = new URLSearchParams(
    params as Record<string, string>,
  ).toString();
  const url = urlGenerator("admin", "patients", false, query);

  return requestHandler<
    GeneralReturnInt<{
      patients: PatientProfileInterface[];
      meta?: {
        page: number;
        perPage: number;
        total: number;
        lastPage: number;
      };
      pagination?: {
        page: number;
        perPage: number;
        total: number;
        totalPages: number;
      };
    }>
  >(url, options("GET", null, true));
};

export const getSinglePatientReq = (patientId: string) => {
  const url = urlGenerator("admin", `patients/${patientId}`, false);
  return requestHandler<GeneralReturnInt<PatientProfileInterface>>(
    url,
    options("GET", null, true),
  );
};

export const createDoctorReq = (data: {
  email: string;
  first_name: string;
  last_name: string;
  password: string;
  phone_number?: string;
}) => {
  const url = urlGenerator("admin", "doctors", false);
  return requestHandler<GeneralReturnInt<unknown>>(
    url,
    options("POST", data, true),
  );
};
