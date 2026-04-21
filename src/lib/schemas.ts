import { z } from "zod";

/**
 * Shared schemas for API request validation.
 * Aligned with Backend/src/models.py requirements.
 * Handles empty strings by converting them to undefined for optional fields.
 */

const emptyToUndefined = z.literal("").transform(() => undefined);
const optionalString = z.string().optional().or(emptyToUndefined);

// --- USER & AUTH ---

export const RegisterSchema = z.object({
  email: z.string().email("Invalid celestial address (email)"),
  password: z.string().min(8, "Password must be at least 8 cycles (characters)"),
  name: optionalString,
  dob: optionalString,
  tob: optionalString,
  pob: optionalString,
  phoneNumber: optionalString,
});

export const LoginSchema = z.object({
  email: z.string().email(),
  password: z.string(),
});

export const ProfileUpdateSchema = z.object({
  name: z.string().min(2).max(100).optional().or(emptyToUndefined),
  dob: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, "Invalid date format (YYYY-MM-DD)").optional().or(emptyToUndefined),
  tob: z.string().regex(/^\d{2}:\d{2}$/, "Invalid time format (HH:MM)").optional().or(emptyToUndefined),
  pob: z.string().min(2).max(200).optional().or(emptyToUndefined),
  phoneNumber: z.string().max(20).optional().or(emptyToUndefined),
});

// --- CHAT ---

export const CreateChatSchema = z.object({
  title: z.string().max(100).optional().or(emptyToUndefined),
});

export const SendMessageSchema = z.object({
  text: z.string().min(1, "Message cannot be empty").max(2000, "Message exceeds celestial capacity"),
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
  gender: z.enum(["male", "female"]).optional().default("male"),
});

export const MatchRequestSchema = z.object({
  person1: PersonDetailSchema,
  person2: PersonDetailSchema,
});
