import * as z from "zod";

// Login schemas
export const adminLoginSchema = z.object({
  email: z.string().email({ message: "Please enter a valid email address" }),
  password: z
    .string()
    .min(5, { message: "Password must be at least 8 characters" }),
});

export const patientLoginSchema = z.object({
  email: z.string().email({ message: "Please enter a valid email address" }),
  password: z
    .string()
    .min(5, { message: "Password must be at least 8 characters" }),
  rememberMe: z.boolean().optional(),
});

export const doctorLoginSchema = z.object({
  email: z.string().email({ message: "Please enter a valid email address" }),
  password: z
    .string()
    .min(5, { message: "Password must be at least 5 characters" }),
  rememberMe: z.boolean().optional(),
});

// Registration schemas
export const adminRegisterSchema = z
  .object({
    firstName: z
      .string()
      .min(2, { message: "First name must be at least 2 characters" }),
    lastName: z
      .string()
      .min(2, { message: "Last name must be at least 2 characters" }),
    email: z.string().email({ message: "Please enter a valid email address" }),
    password: z
      .string()
      .min(5, { message: "Password must be at least 8 characters" })
      .regex(/[A-Z]/, {
        message: "Password must contain at least one uppercase letter",
      })
      .regex(/[a-z]/, {
        message: "Password must contain at least one lowercase letter",
      })
      .regex(/[0-9]/, { message: "Password must contain at least one number" }),
    confirmPassword: z.string(),
    acceptTerms: z.boolean().refine((val) => val === true, {
      message: "You must accept the terms and conditions",
    }),
  })
  .refine((data) => data.password === data.confirmPassword, {
    message: "Passwords do not match",
    path: ["confirmPassword"],
  });

export const patientRegisterSchema = z
  .object({
    first_name: z
      .string()
      .min(2, { message: "First name must be at least 2 characters" }),
    last_name: z
      .string()
      .min(2, { message: "Last name must be at least 2 characters" }),
    middle_name: z.string().optional(),
    email: z.string().email({ message: "Please enter a valid email address" }),
    password: z
      .string()
      .min(8, { message: "Password must be at least 8 characters" })
      .regex(/[A-Z]/, {
        message: "Password must contain at least one uppercase letter",
      })
      .regex(/[a-z]/, {
        message: "Password must contain at least one lowercase letter",
      })
      .regex(/[0-9]/, { message: "Password must contain at least one number" }),
    confirmPassword: z.string(),
  })
  .refine((data) => data.password === data.confirmPassword, {
    message: "Passwords do not match",
    path: ["confirmPassword"],
  });

export const doctorRegisterSchema = z
  .object({
    firstName: z
      .string()
      .min(2, { message: "First name must be at least 2 characters" }),
    lastName: z
      .string()
      .min(2, { message: "Last name must be at least 2 characters" }),
    email: z.string().email({ message: "Please enter a valid email address" }),
    specialty: z.string().min(2, { message: "Specialty is required" }),
    licenseNumber: z.string().min(4, { message: "License number is required" }),
    password: z
      .string()
      .min(8, { message: "Password must be at least 8 characters" })
      .regex(/[A-Z]/, {
        message: "Password must contain at least one uppercase letter",
      })
      .regex(/[a-z]/, {
        message: "Password must contain at least one lowercase letter",
      })
      .regex(/[0-9]/, { message: "Password must contain at least one number" }),
    confirmPassword: z.string(),
    acceptTerms: z.boolean().refine((val) => val === true, {
      message: "You must accept the terms and conditions",
    }),
  })
  .refine((data) => data.password === data.confirmPassword, {
    message: "Passwords do not match",
    path: ["confirmPassword"],
  });

// Consultation form schema
export const consultationFormSchema = z
  .object({
    type: z.enum(["CHAT", "AUDIO", "VIDEO", "MEETADOCTOR", "HOMESERVICE"], {
      message: "Please select a valid type",
    }),
    consoltation_for: z.enum(["SELF", "OTHERS"]),
    title: z
      .string()
      .min(3, { message: "Title must be at least 3 characters" })
      .max(100, { message: "Title must be less than 100 characters" }),
    details: z.string().min(10, {
      message: "Please provide more details (minimum 10 characters)",
    }),
    session_start_date: z.string().refine(
      (val) => {
        if (!val) return false;
        const date = new Date(val);
        return (
          !isNaN(date.getTime()) &&
          date >= new Date(new Date().setHours(0, 0, 0, 0))
        );
      },
      { message: "Please select a valid future date" },
    ),
    session_end_date: z.string().refine(
      (val) => {
        if (!val) return false;
        const date = new Date(val);
        return !isNaN(date.getTime());
      },
      { message: "Please select a valid date" },
    ),
    patient_last_name: z.string().min(2, { message: "Last name is required" }),
    patient_first_name: z
      .string()
      .min(2, { message: "First name is required" }),
    patient_middle_name: z.string().optional(),
    patient_age: z.number().refine(
      (age) => {
        return !isNaN(age) && age >= 0 && age < 130;
      },
      { message: "Please enter a valid age (0-130)" },
    ),
    patient_dob: z.string().refine(
      (val) => {
        if (!val) return false;
        const date = new Date(val);
        return !isNaN(date.getTime()) && date <= new Date();
      },
      { message: "Please select a valid birth date" },
    ),
    patient_address: z
      .string()
      .min(5, { message: "Please enter a valid address" }),
    patient_marital_status: z.string().optional(),
    patient_gender: z.string().min(1, { message: "Gender is required" }),
    patient_occupation: z.string().optional(),
    treatment_plan: z.string().optional(),
  })
  .refine(
    (data) => {
      const startDate = new Date(data.session_start_date);
      const endDate = new Date(data.session_end_date);
      return startDate <= endDate;
    },
    {
      message: "End date must be after or equal to start date",
      path: ["session_end_date"],
    },
  )
  .refine(
    (data) => {
      const startDate = new Date(data.session_start_date);
      const endDate = new Date(data.session_end_date);
      const differenceInMs = endDate.getTime() - startDate.getTime();
      const differenceInHours = differenceInMs / (1000 * 60 * 60);
      return differenceInHours <= 1 && differenceInHours !== 0;
    },
    {
      message: "Total Duration for a session must be within an Hour.",
      path: ["session_end_date"],
    },
  );

export const MEDICATION_FORMULARY_OPTIONS = [
  "TABLET",
  "SYRUP",
  "CAPSULE",
  "INJECTION",
] as const;

export const MEDICATION_DOSE_UNIT_OPTIONS = [
  "MILLIGRAM",
  "MICROGRAM",
  "PUFFS",
  "TAB",
  "CAB",
  "MLS",
  "LITRE",
] as const;

export const MEDICATION_INTERVAL_OPTIONS = [
  "DAILY",
  "WEEKLY",
  "MONTHLY",
  "AS_NEEDED",
] as const;

export const MEDICATION_DURATION_UNIT_OPTIONS = [
  "MINUTE",
  "HOUR",
  "DAY",
  "MONTH",
] as const;

export const medicationPrescriptionRowSchema = z.object({
  _id: z.string().optional(),
  formulary: z.enum(MEDICATION_FORMULARY_OPTIONS, {
    message: "Select formulary",
  }),
  medication: z.string().trim().min(1, "Enter medication name"),
  dose: z.coerce
    .number({ invalid_type_error: "Enter dose" })
    .positive("Enter a valid dose"),
  unit: z.enum(MEDICATION_DOSE_UNIT_OPTIONS, { message: "Select unit" }),
  interval: z.enum(MEDICATION_INTERVAL_OPTIONS, {
    message: "Select frequency",
  }),
  duration: z.coerce
    .number({ invalid_type_error: "Enter duration" })
    .positive("Enter a valid duration"),
  duration_unit: z.enum(MEDICATION_DURATION_UNIT_OPTIONS, {
    message: "Select duration unit",
  }),
  start_date: z.string().optional(),
  order_instruction: z.string().optional(),
});

export function isTouchedMedicationRow(row: {
  formulary?: string;
  medication?: string;
  dose?: unknown;
  unit?: string;
  interval?: string;
  duration?: unknown;
  duration_unit?: string;
  start_date?: string;
  order_instruction?: string;
}) {
  return Boolean(
    row.formulary ||
    row.medication?.trim() ||
    (row.dose !== undefined && row.dose !== "") ||
    row.unit ||
    row.interval ||
    (row.duration !== undefined && row.duration !== "") ||
    row.duration_unit ||
    row.start_date ||
    row.order_instruction,
  );
}

export const medicationPrescriptionModalSchema = z
  .object({
    pendingMedications: z.array(medicationPrescriptionRowSchema),
    newMedications: z.array(medicationPrescriptionRowSchema.partial()),
  })
  .superRefine((data, ctx) => {
    data.newMedications.forEach((row, index) => {
      if (!isTouchedMedicationRow(row)) return;

      const result = medicationPrescriptionRowSchema.safeParse(row);
      if (!result.success) {
        result.error.issues.forEach((issue) => {
          ctx.addIssue({
            ...issue,
            path: ["newMedications", index, ...(issue.path ?? [])],
          });
        });
      }
    });
  });

export const MedicationFormSchema = z.object({
  formulation: z.enum(MEDICATION_FORMULARY_OPTIONS, {
    message: "Please select a valid Formula",
  }),
  drug: z.string().min(4, "Enter at least four characters"),
  dose_value: z.number().min(1, "Enter at leat 1 dose"),
  dose_unit: z.enum(MEDICATION_DOSE_UNIT_OPTIONS, {
    message: "Please select a valid dose unit",
  }),
  dose: z.string().optional(),
  interval: z.enum(MEDICATION_INTERVAL_OPTIONS, {
    message: "Please select a valid interval",
  }),
  duration_value: z.number(),
  duration_unit: z.enum(MEDICATION_DURATION_UNIT_OPTIONS, {
    message: "Please select at least one valid duration unit",
  }),
  duration: z.string().optional(),
});

export const referralFormSchema = z.object({
  referred_doctor_name: z.string().optional(),
  specialist_name: z.string().trim().min(1, "Specialist name is required"),
  hospital: z.string().trim().min(1, "Hospital name is required"),
  referral_details: z.string().trim().min(1, "Referral details are required"),
});

export const referralRowSchema = referralFormSchema.extend({
  _id: z.string().optional(),
});

export function isTouchedReferralRow(
  row: Partial<z.infer<typeof referralFormSchema>>,
): boolean {
  return !!(
    row.referred_doctor_name?.trim() ||
    row.specialist_name?.trim() ||
    row.hospital?.trim() ||
    row.referral_details?.trim()
  );
}

export const referralModalSchema = z
  .object({
    pendingReferrals: z.array(referralRowSchema),
    newReferral: referralFormSchema.partial(),
  })
  .superRefine((data, ctx) => {
    if (!isTouchedReferralRow(data.newReferral)) return;

    const result = referralFormSchema.safeParse(data.newReferral);
    if (!result.success) {
      result.error.issues.forEach((issue) => {
        ctx.addIssue({
          ...issue,
          path: ["newReferral", ...(issue.path ?? [])],
        });
      });
    }
  });

// Form value types
export type AdminLoginFormValues = z.infer<typeof adminLoginSchema>;
export type PatientLoginFormValues = z.infer<typeof patientLoginSchema>;
export type DoctorLoginFormValues = z.infer<typeof doctorLoginSchema>;
export type AdminRegisterFormValues = z.infer<typeof adminRegisterSchema>;
export type PatientRegisterFormValues = z.infer<typeof patientRegisterSchema>;
export type DoctorRegisterFormValues = z.infer<typeof doctorRegisterSchema>;
export type ConsultationFormValues = z.infer<typeof consultationFormSchema>;
export type MedicationFormValues = z.infer<typeof MedicationFormSchema>;
export type MedicationPrescriptionRowValues = z.infer<
  typeof medicationPrescriptionRowSchema
>;
export type MedicationPrescriptionModalValues = z.infer<
  typeof medicationPrescriptionModalSchema
>;
export type ReferralFormValues = z.infer<typeof referralFormSchema>;
export type ReferralRowValues = z.infer<typeof referralRowSchema>;
export type ReferralModalValues = z.infer<typeof referralModalSchema>;
