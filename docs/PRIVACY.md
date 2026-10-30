# Rootwise — Privacy & Anonymity Architecture

> **Hackathon**: OPEN//BUILD 2026 — OSCA Ile-Ife Hacktoberfest Challenge  
> **Privacy Guarantee**: $k$-anonymity threshold ($k \ge 3$ demo, $k \ge 5$ production)  
> **Compliance**: Student Data Protection, Zero PII in Cohort Aggregates

---

## 1. Principles of Classroom Privacy

In university lecture halls and study groups, fear of looking foolish or getting an answer wrong in front of peers causes students to stay silent or disengage. Rootwise is engineered from the ground up to eliminate this social risk:

1. **No Names or Identifiers in Aggregates**: Neither student names, usernames, avatars, nor raw answers are ever broadcast or displayed on the classroom host/projector view.
2. **Explicit Opt-In**: Every participant joining a live diagnostic room (`/room/[code]`) must explicitly choose whether to include their answer in the anonymous cohort aggregate before submission.
3. **Threshold Suppression ($k$-Anonymity)**: If fewer than 3 participants have answered, the host screen suppresses all category breakdowns and displays:
   > *"Waiting for at least 3 participants before displaying aggregate trends to protect student privacy."*

---

## 2. Technical Implementation ([`lib/privacy/cohort.ts`](../lib/privacy/cohort.ts))

The aggregation engine enforces privacy at the calculation boundary:

```ts
export const PRIVACY_THRESHOLD_DEMO = 3;
export const PRIVACY_THRESHOLD_PRODUCTION = 5;

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
    // Suppress all category breakdowns below threshold
    return {
      total_responses: total,
      meets_threshold: false,
      threshold_used: threshold,
      misconceptions: [],
      confident_wrong_total: 0,
      unclassified_count: 0,
    };
  }

  // Aggregate exclusively by conceptual category and confident error count
  ...
}
```

---

## 3. Threat Model & Mitigations

| Vulnerability | Threat | Rootwise Mitigation |
| :--- | :--- | :--- |
| **Outlier Identification** | If only 1 student answers and gets it wrong, peers or the professor could identify them. | All category outputs remain hidden until $\ge 3$ students submit ($k$-anonymity threshold). |
| **Text Signature Analysis** | Unique handwriting, phrases, or slang in an essay answer could reveal identity. | The live room displays **only** high-level category counts (e.g. `conceptual_misconception: 4`), never free-form student text. |
| **Realtime Channel Snooping** | Malicious clients listening to Supabase Realtime websockets. | Row-Level Security (RLS) policies prevent anonymous clients from querying raw student rows. Realtime payloads broadcast aggregate count signals. |

---

## 4. Production Recommendations

- **Production Threshold**: Upgrade $k = 5$ for university classes $> 30$ students.
- **k-Anonymity Protection**: Aggregated trends remain strictly suppressed until the configured $k$-threshold is satisfied.
