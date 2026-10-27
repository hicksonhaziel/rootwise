/**
 * lib/progress/rules.ts
 *
 * Topic progress state machine (blueprint §9.7 + BUILD.md §2.8)
 *
 * THE ONLY PLACE that sets topic status. The model never sets status.
 *
 * States:
 *   not_assessed   — no attempts
 *   needs_work     — latest attempt has unresolved significant error
 *   developing     — some correct reasoning, follow-up evidence incomplete
 *   demonstrated   — 2+ distinct correct attempts incl. a follow-up; no open confident error
 *
 * Confident error rule:
 *   wrong + sure → confident_error = true, recheck_due_at = +1 day
 *   Blocks "demonstrated" status until cleared by a correct re-check attempt
 */

// Types
// ---------------------------------------------------------------------------

export type TopicStatus = "not_assessed" | "needs_work" | "developing" | "demonstrated";

export interface Attempt {
  id: string;
  attempt_type: "initial" | "follow_up" | "exam_practice";
  assessment: "correct" | "partial" | "incorrect" | "insufficient";
  confidence: "sure" | "think_so" | "guessing";
  diagnosis_category:
    | "conceptual_misconception"
    | "missing_prerequisite"
    | "procedural_gap"
    | "calculation_or_execution_error"
    | "partially_correct"
    | "insufficient_evidence"
    | "appears_correct"
    | null;
  created_at: string;
}

export interface ProgressUpdate {
  status: TopicStatus;
  status_reason: string;
  confident_error: boolean;
  recheck_due_at: string | null;
}

// ---------------------------------------------------------------------------
// Core rules function
// ---------------------------------------------------------------------------

/**
 * Compute the new topic progress state from ALL attempts for a topic + user.
 * Attempts must be ordered oldest → newest.
 */
export function computeProgress(attempts: Attempt[]): ProgressUpdate {
  if (!attempts.length) {
    return {
      status: "not_assessed",
      status_reason: "No attempts recorded yet.",
      confident_error: false,
      recheck_due_at: null,
    };
  }

  // Detect any open confident error (wrong + sure, not yet cleared)
  const hasOpenConfidentError = hasUnresolvedConfidentError(attempts);

  const latest = attempts[attempts.length - 1];
  const followUpAttempts = attempts.filter((a) => a.attempt_type === "follow_up");
  const correctAttempts = attempts.filter(
    (a) => a.assessment === "correct" || a.assessment === "partial"
  );
  const definitivelyCorrect = attempts.filter((a) => a.assessment === "correct");

  // --- demonstrated ---
  // 2+ distinct correct attempts including at least one follow-up, no open confident error
  if (
    !hasOpenConfidentError &&
    definitivelyCorrect.length >= 2 &&
    followUpAttempts.some((a) => a.assessment === "correct")
  ) {
    return {
      status: "demonstrated",
      status_reason:
        "Answered correctly on two or more distinct attempts including a follow-up.",
      confident_error: false,
      recheck_due_at: null,
    };
  }

  // --- needs_work ---
  if (
    latest.assessment === "incorrect" ||
    latest.assessment === "insufficient" ||
    hasOpenConfidentError
  ) {
    const reason = hasOpenConfidentError
      ? "A confident error is pending re-check before this topic can be marked as Demonstrated."
      : latest.assessment === "insufficient"
      ? "Latest answer was too brief to diagnose. Try again with more detail."
      : "Latest attempt shows an unresolved gap.";

    return {
      status: "needs_work",
      status_reason: reason,
      confident_error: hasOpenConfidentError,
      recheck_due_at: hasOpenConfidentError ? getRecheckDueAt(attempts) : null,
    };
  }

  // --- developing ---
  if (correctAttempts.length >= 1) {
    return {
      status: "developing",
      status_reason:
        "Some correct reasoning shown, but a follow-up correct attempt is needed to confirm.",
      confident_error: false,
      recheck_due_at: null,
    };
  }

  // Default fallback
  return {
    status: "needs_work",
    status_reason: "Needs more evidence to determine progress.",
    confident_error: false,
    recheck_due_at: null,
  };
}

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

/**
 * A confident error is "open" when:
 * - There exists a wrong + sure attempt
 * - AND no subsequent correct attempt on a re-check or follow-up exists after it
 */
function hasUnresolvedConfidentError(attempts: Attempt[]): boolean {
  let lastConfidentErrorIdx = -1;

  for (let i = 0; i < attempts.length; i++) {
    const a = attempts[i];
    if (a.assessment === "incorrect" && a.confidence === "sure") {
      lastConfidentErrorIdx = i;
    }
  }

  if (lastConfidentErrorIdx === -1) return false;

  // Check if any correct attempt appears AFTER the confident error
  const attemptsAfter = attempts.slice(lastConfidentErrorIdx + 1);
  const cleared = attemptsAfter.some((a) => a.assessment === "correct");
  return !cleared;
}

function getRecheckDueAt(attempts: Attempt[]): string | null {
  // Find the most recent confident error and schedule +1 day
  for (let i = attempts.length - 1; i >= 0; i--) {
    const a = attempts[i];
    if (a.assessment === "incorrect" && a.confidence === "sure") {
      const due = new Date(a.created_at);
      due.setDate(due.getDate() + 1);
      return due.toISOString();
    }
  }
  return null;
}

// ---------------------------------------------------------------------------
// Check if a new attempt is a confident error
// ---------------------------------------------------------------------------

export function isConfidentError(attempt: {
  assessment: string;
  confidence: string;
}): boolean {
  return attempt.assessment === "incorrect" && attempt.confidence === "sure";
}
