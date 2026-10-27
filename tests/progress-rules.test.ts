/**
 * tests/progress-rules.test.ts
 *
 * BUILD.md step 2.8 — Tests for every topic progress transition.
 * Covers blueprint §9.7 + confident error rule.
 */

import { describe, it, expect } from "vitest";
import { computeProgress, type Attempt } from "../lib/progress/rules";

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function attempt(overrides: Partial<Attempt> = {}): Attempt {
  return {
    id: "test-" + Math.random(),
    attempt_type: "initial",
    assessment: "correct",
    confidence: "think_so",
    diagnosis_category: "appears_correct",
    created_at: new Date().toISOString(),
    ...overrides,
  };
}

// ---------------------------------------------------------------------------
// Tests
// ---------------------------------------------------------------------------

describe("computeProgress — not_assessed", () => {
  it("returns not_assessed for empty attempts array", () => {
    const result = computeProgress([]);
    expect(result.status).toBe("not_assessed");
    expect(result.confident_error).toBe(false);
    expect(result.recheck_due_at).toBeNull();
  });
});

describe("computeProgress — needs_work", () => {
  it("returns needs_work when latest attempt is incorrect", () => {
    const result = computeProgress([attempt({ assessment: "incorrect" })]);
    expect(result.status).toBe("needs_work");
  });

  it("returns needs_work when latest attempt is insufficient", () => {
    const result = computeProgress([attempt({ assessment: "insufficient" })]);
    expect(result.status).toBe("needs_work");
  });

  it("returns needs_work with confident_error=true for wrong+sure", () => {
    const result = computeProgress([
      attempt({ assessment: "incorrect", confidence: "sure" }),
    ]);
    expect(result.status).toBe("needs_work");
    expect(result.confident_error).toBe(true);
    expect(result.recheck_due_at).not.toBeNull();
  });

  it("sets recheck_due_at 1 day after the confident error attempt", () => {
    const errorDate = new Date("2026-10-27T10:00:00Z");
    const result = computeProgress([
      attempt({
        assessment: "incorrect",
        confidence: "sure",
        created_at: errorDate.toISOString(),
      }),
    ]);
    const due = new Date(result.recheck_due_at!);
    expect(due.getDate()).toBe(28); // +1 day
  });
});

describe("computeProgress — developing", () => {
  it("returns developing after one correct attempt without follow-up", () => {
    const result = computeProgress([attempt({ assessment: "correct" })]);
    expect(result.status).toBe("developing");
  });

  it("returns developing after partial attempt", () => {
    const result = computeProgress([attempt({ assessment: "partial" })]);
    expect(result.status).toBe("developing");
  });
});

describe("computeProgress — demonstrated", () => {
  it("returns demonstrated after 2 correct attempts including a follow-up", () => {
    const result = computeProgress([
      attempt({ assessment: "correct", attempt_type: "initial" }),
      attempt({ assessment: "correct", attempt_type: "follow_up" }),
    ]);
    expect(result.status).toBe("demonstrated");
    expect(result.confident_error).toBe(false);
  });

  it("allows demonstrated when a prior confident error was cleared by subsequent correct attempts", () => {
    const result = computeProgress([
      attempt({ assessment: "incorrect", confidence: "sure", attempt_type: "initial" }),
      attempt({ assessment: "correct", attempt_type: "initial" }),
      attempt({ assessment: "correct", attempt_type: "follow_up" }),
    ]);
    expect(result.status).toBe("demonstrated");
    expect(result.confident_error).toBe(false);
  });

  it("blocks demonstrated when confident error is AFTER correct attempts", () => {
    const result = computeProgress([
      attempt({ assessment: "correct", attempt_type: "initial" }),
      attempt({ assessment: "correct", attempt_type: "follow_up" }),
      attempt({ assessment: "incorrect", confidence: "sure", attempt_type: "initial" }),
    ]);
    // Confident error at end — not cleared
    expect(result.status).toBe("needs_work");
    expect(result.confident_error).toBe(true);
  });

  it("requires a follow-up correct attempt — two initials are not enough", () => {
    const result = computeProgress([
      attempt({ assessment: "correct", attempt_type: "initial" }),
      attempt({ assessment: "correct", attempt_type: "initial" }),
    ]);
    // No follow_up → not demonstrated
    expect(result.status).not.toBe("demonstrated");
  });
});

describe("computeProgress — clearing confident errors", () => {
  it("clears confident error when a correct attempt follows it", () => {
    const result = computeProgress([
      attempt({ assessment: "incorrect", confidence: "sure" }),
      attempt({ assessment: "correct" }),
    ]);
    expect(result.confident_error).toBe(false);
  });
});
