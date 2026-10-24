import { z } from "zod";

// Shared contract between the client and the /api route handlers.
// Keep this file free of browser- or server-only imports.

/** The child's language, which is also the lookup direction: "tagalog" = English word -> Filipino meaning, "english" = Filipino word -> English meaning. */
export const LanguageSchema = z.enum(["tagalog", "english"]);
export const DifficultySchema = z.enum(["easy", "medium", "hard"]);

/** Where an explanation came from. `offline` entries are provisional and get upgraded by the lookup queue. */
export const ExplanationSourceSchema = z.enum(["ai", "curated", "dictionary", "offline"]);

export const WordExplanationSchema = z.object({
  word: z.string().min(1).max(64),
  phonetic: z.string().max(64),
  /** A simple definition in the tapped word's own language (English for an English word, Filipino for a Filipino word). */
  english: z.string().min(1).max(400),
  /** The explanation in the child's language (Filipino for an English word, English for a Filipino word). */
  translation: z.string().min(1).max(400),
  emoji: z.string().max(16),
  difficulty: DifficultySchema,
  example: z.string().max(400).nullable(),
});

export const ExplainRequestSchema = z.object({
  word: z
    .string()
    .trim()
    .min(1)
    .max(64)
    .regex(/^[\p{L}\p{M}'’-]+$/u, "word must be letters, apostrophes or hyphens"),
  sentence: z.string().trim().max(600).default(""),
  language: LanguageSchema,
});

export const OcrRequestSchema = z.object({
  imageBase64: z.string().min(1).max(5_600_000), // ~4MB binary
  mime: z.enum(["image/jpeg", "image/png", "image/webp"]),
});

export const OcrResponseSchema = z.object({
  text: z.string(),
});

export const ApiErrorCodeSchema = z.enum(["invalid", "rate_limited", "forbidden", "upstream", "timeout"]);

export const ApiErrorBodySchema = z.object({
  error: ApiErrorCodeSchema,
  retryAfter: z.number().optional(),
});

export type Language = z.infer<typeof LanguageSchema>;
export type ExplanationSource = z.infer<typeof ExplanationSourceSchema>;
export type WordExplanation = z.infer<typeof WordExplanationSchema>;
export type ExplainRequest = z.infer<typeof ExplainRequestSchema>;
export type OcrRequest = z.infer<typeof OcrRequestSchema>;
export type OcrResponse = z.infer<typeof OcrResponseSchema>;
export type ApiErrorCode = z.infer<typeof ApiErrorCodeSchema>;

/** A word explanation as stored and shown by the app. */
export interface ResolvedExplanation extends WordExplanation {
  source: ExplanationSource;
  language: Language;
}
