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
    horoscope_enabled: z.boolean().optional().default(true),
    notifications_enabled: z.boolean().optional().default(false),
  }).optional().default({ horoscope_enabled: true, notifications_enabled: false }),
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

export const ProfileUpdateSchema = z.object({
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
  mode: z.enum(["quick", "normal", "deep"]).optional().default("normal"),
  context: ChatPageContextSchema.optional(),
  avatarId: z.string().min(1).max(64).optional(),
});

export const RegenerateMessageSchema = z.object({
  language: languageOptionalEnum,
  mode: z.enum(["quick", "normal", "deep"]).optional().default("normal"),
});

export const RateMessageSchema = z.object({
  messageId: z.string().uuid("Invalid message reference"),
  rating: z.number().int().min(1).max(5),
  feedbackTags: z.array(z.string()).optional().default([]),
  feedbackComment: z.string().max(500).optional().or(emptyToUndefined),
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
  final_question: z.string().max(200),
  response_tone: z.enum(["warm", "emotional", "realistic", "short", "detailed"]).default("warm"),
  optional_note: z.string().max(120).optional(),
});
