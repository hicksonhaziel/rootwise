/**
 * lib/ai/schemas.ts
 *
 * Zod schemas for every structured AI response.
 * ALL model output is validated here before reaching the rest of the app.
 *
 * Rules (BUILD.md §5):
 *  - Every model response goes through Zod
 *  - Every citation is checked against a stored chunk before shown
 *  - belief_simulation only shown for conceptual_misconception / partially_correct
 */

import { z } from "zod";

// ---------------------------------------------------------------------------
// Diagnosis categories (blueprint §9.6)
// ---------------------------------------------------------------------------

export const DiagnosisCategorySchema = z.enum([
  "conceptual_misconception",
  "missing_prerequisite",
  "procedural_gap",
  "calculation_or_execution_error",
  "partially_correct",
  "insufficient_evidence",
  "appears_correct",
]);

export type DiagnosisCategory = z.infer<typeof DiagnosisCategorySchema>;

// ---------------------------------------------------------------------------
// Assessment
// ---------------------------------------------------------------------------

export const AssessmentSchema = z.enum(["correct", "partial", "incorrect", "insufficient"]);

// ---------------------------------------------------------------------------
// Citation (pre-validation — source_id not yet checked against DB)
// ---------------------------------------------------------------------------

export const RawCitationSchema = z.object({
  source_id: z.string().uuid("Citation source_id must be a valid UUID"),
  page: z.number().int().nullable().optional(),
  quote: z.string().min(5, "Quote too short to be meaningful"),
});

export type RawCitation = z.infer<typeof RawCitationSchema>;

// ---------------------------------------------------------------------------
// Belief simulation (§5.4 S2 — only for misconception/partially_correct)
// ---------------------------------------------------------------------------

export const BeliefSimulationSchema = z.object({
  implied_belief: z.string(),
  consequence: z.string(),
  why_it_breaks: z.string(),
});

export type BeliefSimulation = z.infer<typeof BeliefSimulationSchema>;

// ---------------------------------------------------------------------------
// Next step
// ---------------------------------------------------------------------------

export const NextStepSchema = z.object({
  kind: z.enum(["hint", "follow_up_question", "explanation"]),
  text: z.string(),
});

// ---------------------------------------------------------------------------
// Possible gap
// ---------------------------------------------------------------------------

export const PossibleGapSchema = z.object({
  category: DiagnosisCategorySchema,
  description: z.string(),
});

// ---------------------------------------------------------------------------
// Full diagnosis response (blueprint §9.5)
// ---------------------------------------------------------------------------

export const DiagnosisResponseSchema = z.object({
  assessment: AssessmentSchema,
  what_seems_correct: z.array(z.string()).default([]),
  possible_gap: PossibleGapSchema,
  explanation: z.string(),
  next_step: NextStepSchema,
  belief_simulation: BeliefSimulationSchema.nullable().optional(),
  prerequisite_topic_id: z.string().uuid().nullable().optional(),
  follow_up_question: z.string(),
  citations: z.array(RawCitationSchema).default([]),
  limitations: z.array(z.string()).optional(),
});

export type DiagnosisResponse = z.infer<typeof DiagnosisResponseSchema>;

// ---------------------------------------------------------------------------
// Topic outline response
// ---------------------------------------------------------------------------

export const TopicOutlineSchema = z.object({
  topics: z
    .array(
      z.object({
        title: z.string().min(2).max(120),
        description: z.string().max(500),
      })
    )
    .min(3)
    .max(10),
});

export type TopicOutline = z.infer<typeof TopicOutlineSchema>;

// ---------------------------------------------------------------------------
// Question generation response
// ---------------------------------------------------------------------------

export const QuestionResponseSchema = z.object({
  question: z.string().min(15),
  context_hint: z.string().optional(),
  citations: z.array(RawCitationSchema).default([]),
});

export type QuestionResponse = z.infer<typeof QuestionResponseSchema>;

// ---------------------------------------------------------------------------
// Fix Tunde response (§5.4 S5)
// ---------------------------------------------------------------------------

export const FixTundeResponseSchema = z.object({
  explanation_with_misconception: z.string(),
  planted_misconception: z.object({
    location_hint: z.string(),
    correct_version: z.string(),
  }),
});

export type FixTundeResponse = z.infer<typeof FixTundeResponseSchema>;
