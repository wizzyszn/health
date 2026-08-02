import { z } from "zod";

// ─── Step 1: Personal Details ───────────────────────────────────────────────
export const personalDetailsSchema = z.object({
  firstName: z.string().min(2, "First name must be at least 2 characters"),
  lastName: z.string().min(2, "Last name must be at least 2 characters"),
  dobDay: z.string().min(1, "Please select a day"),
  dobMonth: z.string().min(1, "Please select a month"),
  dobYear: z.string().min(1, "Please select a year"),
  gender: z.string().min(1, "Please select your gender"),
  maritalStatus: z.string().min(1, "Please select marital status"),
  occupation: z.string().min(1, "Please enter your occupation"),
  complaint: z
    .string()
    .min(5, "Please describe your complaint (at least 5 characters)"),
  complaintBrief: z.string().optional().default(""),
  medicalConditions: z.array(z.string()).optional().default([]),
  allergies: z.array(z.string()).optional().default([]),
});

// ─── Step 2: Find a Doctor ──────────────────────────────────────────────────
export const findDoctorSchema = z.object({
  doctorId: z.string().min(1, "Please select a doctor"),
  doctorName: z.string().min(1, "Doctor name is required"),
  doctorSpecialty: z.string().min(1, "Doctor specialty is required"),
  originalDoctorId: z.string().optional().default(""),
  originalDoctorName: z.string().optional().default(""),
  originalDoctorSpecialty: z.string().optional().default(""),
});

// ─── Step 3: Choose Time Slot ───────────────────────────────────────────────
export const timeSlotSchema = z.object({
  consultationType: z.string().min(1, "Please select consultation type"),
  selectedDate: z.string().min(1, "Please select a date"),
  timeSlot: z.string().min(1, "Please select a time slot"),
  originalSelectedDate: z.string().optional(),
  originalTimeSlot: z.string().optional(),
  suggestedDoctorId: z.string().optional(),
  suggestedDoctorName: z.string().optional(),
  suggestedDoctorSpecialty: z.string().optional(),
  suggestedTimeSlot: z.string().optional(),
  suggestedDate: z.string().optional(),
  isQueueing: z.boolean().optional(),
});

// ─── Step 4: Choose Payment ─────────────────────────────────────────────────
// export const paymentSchema = z.object({
//   paymentMethod: z.string().min(1, "Please select a payment method"),
// });

// ─── Combined Booking Schema ────────────────────────────────────────────────
export const bookingSchema = personalDetailsSchema
  .merge(findDoctorSchema)
  .merge(timeSlotSchema);
// .merge(paymentSchema);

export type BookingFormData = z.infer<typeof bookingSchema>;

// Per-step field keys for partial validation
export const STEP_FIELDS: Record<number, (keyof BookingFormData)[]> = {
  0: [
    "firstName",
    "lastName",
    "dobDay",
    "dobMonth",
    "dobYear",
    "gender",
    "maritalStatus",
    "occupation",
    "complaint",
    "complaintBrief",
    "medicalConditions",
    "allergies",
  ],
  1: ["consultationType", "selectedDate", "timeSlot"],
  2: ["doctorId", "doctorName", "doctorSpecialty"],
  // 3: ["paymentMethod"],
  // Step 4 is confirmation — no new fields to validate
};
