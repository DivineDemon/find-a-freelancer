import { z } from "zod";

export const registerSchema = z.object({
  phone: z.string().optional().nullable().or(z.literal("")),
  email: z.string().email({ message: "Invalid email address" }),
  last_name: z.string().min(1, { message: "Last name is required" }),
  first_name: z.string().min(1, { message: "First name is required" }),
  password: z.string().min(8, { message: "Password must be at least 8 characters long" }),
  user_type: z.enum(["client_hunter", "freelancer"], {
    required_error: "User type is required",
  }),
  image_url: z.string().url({ message: "Must be a valid URL" }).optional().nullable().or(z.literal("")),
});

export const loginSchema = z.object({
  email: z.string().email({ message: "Invalid email address" }),
  password: z.string().min(1, { message: "Password is required" }),
});

export const profileSchema = z.object({
  first_name: z.string().min(1, "First name is required").max(50, "First name too long"),
  last_name: z.string().min(1, "Last name is required").max(50, "Last name too long"),
  profile_picture: z.string().url("Must be a valid URL").optional().nullable(),
  image_url: z.string().url("Must be a valid URL").optional().nullable(),
  email: z.string().email({ message: "Invalid email address" }).optional().nullable(),
  phone: z.string().optional().nullable().or(z.literal("")),
  is_active: z.boolean(),
});

export const passwordSchema = z
  .object({
    current_password: z.string().min(1, "Current password is required"),
    new_password: z.string().min(8, "Password must be at least 8 characters").max(100, "Password too long"),
    confirm_password: z.string().min(1, "Please confirm your password"),
  })
  .refine((data) => data.new_password === data.confirm_password, {
    message: "Passwords don't match",
    path: ["confirm_password"],
  });

export const paymentSchema = z.object({
  card_number: z.string().min(16, "Card number must be 16 digits").max(16, "Card number must be 16 digits"),
  expiry_month: z
    .string()
    .min(1, "Month is required")
    .regex(/^(0[1-9]|1[0-2])$/, "Invalid month"),
  expiry_year: z
    .string()
    .min(1, "Year is required")
    .regex(/^(2[0-9][0-9][0-9])$/, "Invalid year"),
  cvv: z.string().min(3, "CVV must be 3 digits").max(4, "CVV must be 3-4 digits"),
  cardholder_name: z.string().min(1, "Cardholder name is required"),
});
