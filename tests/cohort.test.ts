import { describe, it, expect } from "vitest";
import {
  computeCohortSummary,
  PRIVACY_THRESHOLD_DEMO,
  PRIVACY_THRESHOLD_PRODUCTION,
} from "../lib/privacy/cohort";

describe("lib/privacy/cohort — computeCohortSummary", () => {
  it("hides individual categories when opted-in responses are below threshold", () => {
    const answers = [
      {
        opted_in: true,
        confidence: "sure",
        misconception_cat: "conceptual_misconception",
      },
      {
        opted_in: true,
        confidence: "think_so",
        misconception_cat: "missing_prerequisite",
      },
    ];

    const result = computeCohortSummary(answers, PRIVACY_THRESHOLD_DEMO);
    expect(result.meets_threshold).toBe(false);
    expect(result.total_responses).toBe(2);
    expect(result.misconceptions).toEqual([]);
    expect(result.confident_wrong_total).toBe(0);
  });

  it("excludes non-opted-in responses from the count and aggregation", () => {
    const answers = [
      {
        opted_in: true,
        confidence: "sure",
        misconception_cat: "conceptual_misconception",
      },
      {
        opted_in: false, // did not consent
        confidence: "sure",
        misconception_cat: "conceptual_misconception",
      },
      {
        opted_in: true,
        confidence: "think_so",
        misconception_cat: "procedural_gap",
      },
    ];

    // Only 2 are opted-in, so threshold of 3 is not met
    const result = computeCohortSummary(answers, 3);
    expect(result.meets_threshold).toBe(false);
    expect(result.total_responses).toBe(2);
    expect(result.misconceptions).toHaveLength(0);
  });

  it("aggregates categories and confident-wrong counts once threshold is reached", () => {
    const answers = [
      {
        opted_in: true,
        confidence: "sure",
        misconception_cat: "conceptual_misconception",
      },
      {
        opted_in: true,
        confidence: "sure",
        misconception_cat: "conceptual_misconception",
      },
      {
        opted_in: true,
        confidence: "think_so",
        misconception_cat: "missing_prerequisite",
      },
      {
        opted_in: true,
        confidence: "guessing",
        misconception_cat: "conceptual_misconception",
      },
    ];

    const result = computeCohortSummary(answers, PRIVACY_THRESHOLD_DEMO);
    expect(result.meets_threshold).toBe(true);
    expect(result.total_responses).toBe(4);
    expect(result.misconceptions).toHaveLength(2);

    // Most common misconception first
    expect(result.misconceptions[0].category).toBe("conceptual_misconception");
    expect(result.misconceptions[0].count).toBe(3);
    expect(result.misconceptions[0].confident_wrong_count).toBe(2);

    // Second misconception
    expect(result.misconceptions[1].category).toBe("missing_prerequisite");
    expect(result.misconceptions[1].count).toBe(1);
    expect(result.misconceptions[1].confident_wrong_count).toBe(0);

    // Total confident wrong across the room
    expect(result.confident_wrong_total).toBe(2);
  });

  it("supports production threshold of 5", () => {
    const answers = Array.from({ length: 4 }, () => ({
      opted_in: true,
      confidence: "think_so",
      misconception_cat: "procedural_gap",
    }));

    const result = computeCohortSummary(answers, PRIVACY_THRESHOLD_PRODUCTION);
    expect(result.meets_threshold).toBe(false);

    const answersFive = [
      ...answers,
      {
        opted_in: true,
        confidence: "sure",
        misconception_cat: "procedural_gap",
      },
    ];

    const resultFive = computeCohortSummary(answersFive, PRIVACY_THRESHOLD_PRODUCTION);
    expect(resultFive.meets_threshold).toBe(true);
    expect(resultFive.total_responses).toBe(5);
  });
});
