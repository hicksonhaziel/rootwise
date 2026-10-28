/**
 * lib/privacy/cohort.ts
 *
 * Group aggregation with privacy threshold (blueprint §7.7, §12, FR-14)
 *
 * Rules:
 *  - Never show individual answers, names, or identifiers
 *  - Minimum 3 responses to show ANY aggregate (demo threshold)
 *  - Recommended production threshold: 5
 *  - Only consented contributions are counted
 *  - Withdrawn contributions must be excludable (filter by consented_at)
 */

export const PRIVACY_THRESHOLD_DEMO = 3;
export const PRIVACY_THRESHOLD_PRODUCTION = 5;

export interface MisconceptionAggregate {
  category: string;
  count: number;
  confident_wrong_count: number;
}

export interface CohortSummary {
  total_responses: number;
  meets_threshold: boolean;
  threshold_used: number;
  misconceptions: MisconceptionAggregate[];
  confident_wrong_total: number;
}

/**
 * Compute a privacy-safe aggregate from room answers.
 * Returns empty misconceptions array if below threshold.
 */
export function computeCohortSummary(
  answers: Array<{
    opted_in: boolean;
    confidence: string | null;
    misconception_cat: string | null;
  }>,
  threshold = PRIVACY_THRESHOLD_DEMO
): CohortSummary {
  const opted = answers.filter((a) => a.opted_in);
  const total = opted.length;
  const meets = total >= threshold;

  if (!meets) {
    return {
      total_responses: total,
      meets_threshold: false,
      threshold_used: threshold,
      misconceptions: [],
      confident_wrong_total: 0,
    };
  }

  // Aggregate misconception categories
  const catMap = new Map<string, { count: number; confident_wrong: number }>();

  for (const a of opted) {
    if (!a.misconception_cat) continue;

    const existing = catMap.get(a.misconception_cat) ?? { count: 0, confident_wrong: 0 };
    existing.count++;
    if (a.confidence === "sure") {
      existing.confident_wrong++;
    }
    catMap.set(a.misconception_cat, existing);
  }

  const misconceptions: MisconceptionAggregate[] = [...catMap.entries()]
    .map(([category, { count, confident_wrong: cw }]) => ({
      category,
      count,
      confident_wrong_count: cw ?? 0,
    }))
    .sort((a, b) => b.count - a.count);

  const confident_wrong_total = opted.filter((a) => a.confidence === "sure").length;

  return {
    total_responses: total,
    meets_threshold: true,
    threshold_used: threshold,
    misconceptions,
    confident_wrong_total,
  };
}
