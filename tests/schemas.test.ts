import { describe, it, expect } from "vitest";
import {
  StudyGuideSchema,
  ExamSetSchema,
  ExamMultipleChoiceQuestionSchema,
} from "../lib/ai/schemas";

describe("lib/ai/schemas", () => {
  describe("StudyGuideSchema", () => {
    it("validates a complete topic masterclass study guide", () => {
      const validGuide = {
        core_concept:
          "Limits describe what happens to a function as its input approaches a target value, independent of f(c).",
        key_rules: [
          "lim_{x->c} f(x) exists iff left and right limits are identical.",
          "0/0 is an indeterminate form requiring simplification.",
        ],
        pitfalls: [
          "Confusing the value f(c) with the limit lim f(x).",
          "Assuming limits do not exist when there is a removable hole.",
        ],
        worked_example: {
          problem: "Find lim_{x->2} (x^2 - 4)/(x - 2).",
          solution_steps: [
            "Direct substitution gives 0/0 indeterminate form.",
            "Factor the numerator as (x-2)(x+2).",
            "Cancel common factor (x-2) for x != 2.",
            "Evaluate remaining expression (2 + 2) = 4.",
          ],
          key_takeaway: "Simplifying removable discontinuities reveals true limit.",
        },
        diagnostic_check: {
          question: "If f(3) is undefined, does lim_{x->3} f(x) necessarily fail to exist?",
          options: [
            { key: "A", text: "Yes, limits require the function to be defined at that point." },
            { key: "B", text: "No, limits depend only on neighborhood behavior approaching 3." },
            { key: "C", text: "Yes, undefined points always mean infinite asymptotes." },
            { key: "D", text: "Only if left limit is negative." },
          ],
          correct_option: "B",
          distractor_misconceptions: {
            A: "Equates function point existence with limit existence.",
            B: "Correct conceptual intuition.",
            C: "Assumes undefined implies asymptote.",
            D: "Irrelevant condition.",
          },
          rationale: "Limits describe approaching behavior, so f(3) being undefined does not prevent existence.",
          belief_simulation: {
            implied_belief: "A function must exist at a point for its limit to exist.",
            consequence: "You would conclude (x^2 - 9)/(x - 3) has no limit at 3.",
            why_it_breaks: "Approaching from both sides gives 6 consistently.",
          },
          citations: [
            {
              source_id: "00000000-0000-0000-0000-000000000001",
              page: 12,
              quote: "Limits examine behavior strictly near c, not at c itself.",
            },
          ],
        },
      };

      const parsed = StudyGuideSchema.parse(validGuide);
      expect(parsed.core_concept).toContain("Limits describe");
      expect(parsed.diagnostic_check.options).toHaveLength(4);
      expect(parsed.diagnostic_check.correct_option).toBe("B");
    });

    it("rejects study guides with fewer than 4 options in diagnostic check", () => {
      const invalidGuide = {
        core_concept: "Valid core concept explanation for this topic...",
        key_rules: ["Rule 1"],
        pitfalls: ["Pitfall 1"],
        worked_example: {
          problem: "Sample problem...",
          solution_steps: ["Step 1"],
          key_takeaway: "Takeaway...",
        },
        diagnostic_check: {
          question: "Sample question?",
          options: [
            { key: "A", text: "Option A" },
            { key: "B", text: "Option B" },
          ], // Only 2 options
          correct_option: "A",
          distractor_misconceptions: { A: "...", B: "..." },
          rationale: "Reason...",
          citations: [],
        },
      };

      expect(() => StudyGuideSchema.parse(invalidGuide)).toThrow();
    });
  });

  describe("ExamSetSchema", () => {
    it("validates multiple-choice exam sets with options and citations", () => {
      const validSet = {
        questions: [
          {
            id: 1,
            topic_id: "00000000-0000-0000-0000-000000000001",
            topic_title: "Limits and Continuity",
            question: "Which statement accurately describes an indeterminate form 0/0?",
            options: [
              { key: "A", text: "It indicates more algebraic work is required to determine the limit." },
              { key: "B", text: "It proves the limit is always 0." },
              { key: "C", text: "It proves the limit is always undefined or infinity." },
              { key: "D", text: "It means the function has a jump discontinuity." },
            ],
            correct_option: "A",
            rationale: "Indeterminate 0/0 provides no definitive value until simplified.",
            citations: [
              {
                source_id: "00000000-0000-0000-0000-000000000002",
                page: 5,
                quote: "0/0 is indeterminate; further manipulation is required.",
              },
            ],
          },
        ],
      };

      const parsed = ExamSetSchema.parse(validSet);
      expect(parsed.questions).toHaveLength(1);
      expect(parsed.questions[0].correct_option).toBe("A");
    });
  });
});
