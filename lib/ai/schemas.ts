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
  source_filename: z.string().optional(),
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

// ---------------------------------------------------------------------------
// Topic Masterclass & Study Guide schema
// ---------------------------------------------------------------------------

export const StudyGuideSchema = z.object({
  core_concept: z.string().min(20),
  key_rules: z.array(z.string()).min(1),
  pitfalls: z.array(z.string()).min(1),
  worked_example: z.object({
    problem: z.string().min(10),
    solution_steps: z.array(z.string()).min(1),
    key_takeaway: z.string(),
  }),
  diagnostic_check: z.object({
    question: z.string().min(10),
    options: z
      .array(
        z.object({
          key: z.enum(["A", "B", "C", "D"]),
          text: z.string().min(1),
        })
      )
      .length(4),
    correct_option: z.enum(["A", "B", "C", "D"]),
    distractor_misconceptions: z.record(z.enum(["A", "B", "C", "D"]), z.string()),
    rationale: z.string(),
    belief_simulation: BeliefSimulationSchema.nullable().optional(),
    citations: z.array(RawCitationSchema).default([]),
  }),
});

export type StudyGuide = z.infer<typeof StudyGuideSchema>;

// ---------------------------------------------------------------------------
// Exam Multiple-Choice schema
// ---------------------------------------------------------------------------

export const ExamMultipleChoiceQuestionSchema = z.object({
  id: z.union([z.number(), z.string()]),
  topic_id: z.string(),
  topic_title: z.string(),
  question: z.string().min(10),
  options: z
    .array(
      z.object({
        key: z.enum(["A", "B", "C", "D"]),
        text: z.string().min(1),
      })
    )
    .length(4),
  correct_option: z.enum(["A", "B", "C", "D"]),
  rationale: z.string(),
  citations: z.array(RawCitationSchema).default([]),
});

export const ExamSetSchema = z.object({
  questions: z.array(ExamMultipleChoiceQuestionSchema).min(1).max(10),
});

export type ExamMultipleChoiceQuestion = z.infer<typeof ExamMultipleChoiceQuestionSchema>;
export type ExamSet = z.infer<typeof ExamSetSchema>;

