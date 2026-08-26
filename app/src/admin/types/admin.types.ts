import { GeneralReturnInt, PatientProfileInterface } from "@/lib/types";

export interface AdminPatient extends PatientProfileInterface {
  full_name: string;
}

export type AdminPatientsResponse = GeneralReturnInt<{
  items: AdminPatient[];
  pagination: {
    page: number;
    perPage: number;
    total: number;
    totalPages: number;
  };
}>;

export interface AdminDoctorCreatePayload {
  email: string;
  first_name: string;
  last_name: string;
  phone_number: string;
  specialty: string;
  license_number: string;
  verification_code: string;
}
