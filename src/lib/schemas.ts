import { z } from "zod";

/**
 * Shared schemas for API request validation.
 * Aligned with Backend/src/models.py requirements.
 * Handles empty strings by converting them to undefined for optional fields.
 */

const emptyToUndefined = z.literal("").transform(() => undefined);

const genderEnum = z.enum(["male", "female", "other", "Not Specified"]).optional().or(emptyToUndefined);
const maritalStatusEnum = z.enum([
  "single", "married", "divorced", "widowed", "separated", "Not Specified"
]).optional().or(emptyToUndefined);
const occupationEnum = z.enum([
  "student", "business", "employed", "homemaker", "retired", "unemployed", "Not Specified"
]).optional().or(emptyToUndefined);
const languageEnum = z.enum(["en", "hi", "ta", "te", "kn", "bn", "mr", "gu", "ml", "pa", "ko"]).default("en");
const languageOptionalEnum = z.enum(["en", "hi", "ta", "te", "kn", "bn", "mr", "gu", "ml", "pa", "ko"]).optional().or(emptyToUndefined);

// --- USER & AUTH ---

export const RegisterSchema = z.object({
  email: z.string().email("Invalid celestial address (email)"),
  password: z
    .string()
    .min(10, "Password must be at least 10 cycles (characters)")
    .regex(/[A-Z]/, "Password must contain at least one uppercase letter")
    .regex(/[a-z]/, "Password must contain at least one lowercase letter")
    .regex(/[0-9]/, "Password must contain at least one number")
    .regex(/[^A-Za-z0-9]/, "Password must contain at least one special character"),
  firstName: z.string().min(2, "First name must be at least 2 characters").max(50).optional().or(emptyToUndefined),
  lastName: z.string().max(50).optional().or(emptyToUndefined),
  // Legacy single-field name. No longer sent by the forms (split into
  // firstName/lastName), kept optional so older clients/payloads still validate.
  name: z.string().min(2, "Name is required").max(100).optional().or(emptyToUndefined),
  dob: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, "Invalid date format (YYYY-MM-DD)").optional().or(emptyToUndefined),
  tob: z.string().regex(/^\d{2}:\d{2}$/, "Invalid time format (HH:MM)").optional().or(emptyToUndefined),
  pob: z.string().min(2).max(200).optional().or(emptyToUndefined),
  birthPlaceName: z.string().min(2).max(200).optional().or(emptyToUndefined),
  birthLatitude: z.number().nullable().optional(),
  birthLongitude: z.number().nullable().optional(),
  birthTimezoneName: z.string().max(100).optional().or(emptyToUndefined),
  phoneNumber: z.string().max(20).optional().or(emptyToUndefined),
  gender: genderEnum,
  maritalStatus: maritalStatusEnum,
  occupation: occupationEnum,
  language: languageEnum,
  preferences: z.object({
    horoscope: z.boolean().optional().default(true),
    notifications: z.boolean().optional().default(false),
  }).optional().default({ horoscope: true, notifications: false }),
});

export const LoginSchema = z.object({
  email: z.string().email(),
  password: z.string(),
});

export const ForgotPasswordSchema = z.object({
  email: z.string().email("Invalid email address"),
});

export const ResetPasswordSchema = z.object({
  token: z.string().min(1, "Reset token is required").max(512),
  password: z
    .string()
    .min(10, "Password must be at least 10 cycles (characters)")
    .regex(/[A-Z]/, "Password must contain at least one uppercase letter")
    .regex(/[a-z]/, "Password must contain at least one lowercase letter")
    .regex(/[0-9]/, "Password must contain at least one number")
    .regex(/[^A-Za-z0-9]/, "Password must contain at least one special character"),
});

// --- PASSWORD RESET OTP (new flow) ---

export const PasswordResetStartSchema = z.object({
  email: z.string().email("Invalid email address"),
});

export const PasswordResetVerifySchema = z.object({
  email: z.string().email("Invalid email address"),
  otp: z.string().regex(/^\d{6}$/, "Verification code must be exactly 6 digits"),
});

export const PasswordResetCompleteSchema = z.object({
  resetToken: z.string().min(1, "Reset token is required"),
  password: z
    .string()
    .min(10, "Password must be at least 10 characters")
    .regex(/[A-Z]/, "Password must contain at least one uppercase letter")
    .regex(/[a-z]/, "Password must contain at least one lowercase letter")
    .regex(/[0-9]/, "Password must contain at least one number")
    .regex(/[^A-Za-z0-9]/, "Password must contain at least one special character"),
});

export const ProfileUpdateSchema = z.object({
  firstName: z.string().min(2, "First name must be at least 2 characters").max(50).optional().or(emptyToUndefined),
  lastName: z.string().max(50).optional().or(emptyToUndefined),
  // Legacy single-field name — kept optional for backward compat (forms now send firstName/lastName).
  name: z.string().min(2, "Name is required").max(100).optional(),
  dob: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, "Invalid date format (YYYY-MM-DD)").optional().or(emptyToUndefined),
  tob: z.string().regex(/^\d{2}:\d{2}$/, "Invalid time format (HH:MM)").optional().or(emptyToUndefined),
  pob: z.string().min(2).max(200).optional().or(emptyToUndefined),
  birthPlaceName: z.string().min(2).max(200).optional().or(emptyToUndefined),
  birthLatitude: z.number().nullable().optional(),
  birthLongitude: z.number().nullable().optional(),
  birthTimezoneName: z.string().max(100).optional().or(emptyToUndefined),
  birthTimezoneOffsetAtBirth: z.number().nullable().optional(),
  birthTimeFold: z.number().int().min(0).max(1).nullable().optional(),
  phoneNumber: z.string().max(20).optional().or(emptyToUndefined),
  gender: genderEnum,
  maritalStatus: maritalStatusEnum,
  occupation: occupationEnum,
  language: languageOptionalEnum,
  discoverable: z.boolean().optional(),
  preferences: z.object({
    horoscope: z.boolean().optional(),
    notifications: z.boolean().optional(),
  }).optional(),
  password: z.string().min(10, "Password must be at least 10 cycles (characters)").optional(),
});

// --- CHAT ---

export const CreateChatSchema = z.object({
  title: z.string().max(100).optional().or(emptyToUndefined),
  language: languageOptionalEnum,
});

export const ChatPageContextSourceEnum = z.enum([
  "career",
  "kundli",
  "horoscope",
  "transit",
  "match",
  "profile",
]);
export type ChatPageContextSource = z.infer<typeof ChatPageContextSourceEnum>;

export const ChatPageContextSchema = z.object({
  source: ChatPageContextSourceEnum,
}).strict();

export const SendMessageSchema = z.object({
  text: z.string().min(1, "Message cannot be empty").max(3000, "Message exceeds celestial capacity"),
  language: languageOptionalEnum,
  context: ChatPageContextSchema.optional(),
  avatarId: z.string().min(1).max(64).optional(),
});

export const RegenerateMessageSchema = z.object({
  language: languageOptionalEnum,
  avatarId: z.string().min(1).max(64).optional(),
});

export const RateMessageSchema = z.object({
  messageId: z.string().uuid("Invalid message reference"),
  thumb: z.union([z.literal(1), z.literal(-1)]).nullable().optional(),
  feedbackTags: z.array(z.string()).max(10).optional(),
  feedbackComment: z.string().max(500).optional().or(emptyToUndefined),
});

export const ReportMessageSchema = z.object({
  reason: z.enum(["inaccurate", "harmful", "offensive", "other"]),
  details: z.string().max(1000).optional().or(emptyToUndefined),
});

// --- HOROSCOPE ---

export const DailyHoroscopeSchema = z.object({
  sign: z.string().min(3).max(20).optional().or(emptyToUndefined),
});

// --- ANALYSIS ---

export const AnalyzeFullSchema = z.object({
  chart_context: z.string().optional().or(emptyToUndefined),
  force_refresh: z.boolean().optional().default(false),
  language: languageOptionalEnum,
});

export const ChartRequestSchema = z.object({
    name: z.string().min(2).max(100),
    dob: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, "Invalid date format (YYYY-MM-DD)"),
    tob: z.string().regex(/^\d{2}:\d{2}$/, "Invalid time format (HH:MM)"),
    place: z.string().min(2).max(200),
  });

// --- MATCHING ---

export const PersonDetailSchema = z.object({
  name: z.string().min(2, "Name is required").max(100),
  dob: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, "Invalid date"),
  tob: z.string().regex(/^\d{2}:\d{2}$/, "Invalid time"),
  place: z.string().min(2, "Place is required").max(200),
  gender: z.enum(["male", "female", "other", "Not Specified"]).optional().default("Not Specified"),
  birthPlaceName: z.string().min(2).max(200).optional().or(emptyToUndefined),
  birthLatitude: z.number({ error: "Please provide exact birth coordinates and timezone offset." }),
  birthLongitude: z.number({ error: "Please provide exact birth coordinates and timezone offset." }),
  birthTimezoneName: z.string().max(100).optional().or(emptyToUndefined),
  birthTimezoneOffsetAtBirth: z.number({ error: "Please provide exact birth coordinates and timezone offset." }),
  birthTimeFold: z.number().int().min(0).max(1).nullable().optional(),
});

export const MatchRequestSchema = z.object({
  person1: PersonDetailSchema,
  person2: PersonDetailSchema,
});

// --- GUIDED CONSULTATION ---

export const ConsultRequestSchema = z.object({
  birth_date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, "Invalid date"),
  birth_time: z.string().regex(/^\d{2}:\d{2}$/, "Invalid time"),
  birth_place: z.string().min(2).max(200),
  name: z.string().max(100).default("Friend"),
  language: z.string().max(20).default("en"),
  primary_category: z.string().max(50),
  secondary_category: z.string().max(50),
  final_question: z.string().max(500),
  response_tone: z.enum(["warm", "emotional", "realistic", "short", "detailed"]).default("warm"),
  optional_note: z.string().max(120).optional(),
  birthLatitude: z.number({ error: "Please provide exact birth coordinates and timezone offset." }),
  birthLongitude: z.number({ error: "Please provide exact birth coordinates and timezone offset." }),
  birthTimezoneName: z.string().max(100).optional().or(emptyToUndefined),
  birthTimezoneOffsetAtBirth: z.number({ error: "Please provide exact birth coordinates and timezone offset." }),
  birthTimeFold: z.number().int().min(0).max(1).nullable().optional(),
});

// --- PHONE & EMAIL OTP ---

export const PhoneStartSchema = z.object({
  phoneNumber: z.string().regex(/^\+[1-9]\d{6,14}$/, "Invalid phone number format. Must be E.164 (e.g. +919876543210)"),
});

export const PhoneVerifySchema = z.object({
  phoneNumber: z.string().regex(/^\+[1-9]\d{6,14}$/, "Invalid phone number format. Must be E.164 (e.g. +919876543210)"),
  code: z.string().regex(/^\d{6}$/, "Verification code must be exactly 6 digits"),
});

export const EmailOtpStartSchema = z.object({
  email: z.string().email("Invalid email address"),
});

export const EmailOtpVerifySchema = z.object({
  email: z.string().email("Invalid email address"),
  code: z.string().regex(/^\d{6}$/, "Verification code must be exactly 6 digits"),
});

// --- VOICE (TTS) ---

export const VoiceTtsSchema = z.object({
  text: z.string().min(1, "Nothing to speak").max(5000, "Text exceeds speech capacity"),
  // BCP-47 locale ("hi-IN") or short code ("hi"); backend normalises and falls
  // back to en-IN for anything it doesn't recognise.
  lang: z.string().min(2).max(10),
  // Optional allowlisted voice name; backend ignores unknown values and uses the
  // curated default for the locale. Normally omitted.
  voice: z.string().min(1).max(64).nullable().optional(),
});
