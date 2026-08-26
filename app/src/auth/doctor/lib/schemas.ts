import { z } from "zod";

export const loginSchema = z.object({
  email: z.string().email({ message: "Please enter a valid email address" }),
  password: z
    .string()
    .min(5, { message: "Password must be at least 5 characters" }),
});

export const emailSchema = z.object({
  email: z.string().email({ message: "Please enter a valid email address" }),
});

export const otpSchema = z.object({
  otp: z
    .string()
    .length(6, { message: "Your OTP must be exactly 6 characters." }),
});

export const bioSchema = z.object({
  first_name: z
    .string()
    .min(2, { message: "First name must be at least 2 characters" })
    .max(20, { message: "First name must be less than 20 characters." }),
  last_name: z
    .string()
    .min(2, { message: "Last name must be at least 2 characters" })
    .max(20, { message: "Last name must be less than 20 characters." }),
  country_code: z.string().min(1, { message: "Please select a country code" }),
  phone_no: z
    .string()
    .min(7, { message: "Please enter a valid phone number" })
    .max(15, { message: "Phone number is too long" })
    .regex(/^\d+$/, { message: "Phone number must contain only digits" }),
  specialty: z.string().min(2, { message: "Specialty is required" }),
  license_number: z.string().min(4, { message: "License number is required" }),
});

export const passwordSchema = z
  .object({
    password: z
      .string()
      .min(8, { message: "Password must be at least 8 characters." }),
    confirmPassword: z.string(),
  })
  .refine((data) => data.password === data.confirmPassword, {
    message: "Passwords don't match",
    path: ["confirmPassword"],
  });

export const forgotPasswordSchema = z
  .object({
    password: z
      .string()
      .min(8, { message: "Password must be at least 8 characters." }),
    confirmPassword: z.string(),
  })
  .refine((data) => data.password === data.confirmPassword, {
    message: "Passwords don't match",
    path: ["confirmPassword"],
  });

export const profileSchema = z.object({
  _id: z.string().optional(),
  doctor_no: z.string().optional(),
  first_name: z.string().min(2, "First name must be at least 2 characters"),
  last_name: z.string().min(2, "Last name must be at least 2 characters"),
  email: z.string().optional(),
  phone_number: z
    .string()
    .min(7, "Enter a valid phone number")
    .optional()
    .or(z.literal("")),
  profile_picture_url: z.string().optional(),
});
