# Rootwise — Model Card

> **Hackathon**: OPEN//BUILD 2026 — OSCA Ile-Ife Hacktoberfest Challenge  
> **Primary Model**: `openai/gpt-oss-120b` (via Groq API)  
> **Licence**: Apache 2.0 (Permissive Open-Source)

---

## 1. Model Overview

Rootwise is built on top of open-weight foundation models. The primary inference engine uses `openai/gpt-oss-120b` accessed via OpenAI-compatible endpoints on Groq, avoiding proprietary closed models.

| Property | Primary Engine (`openai/gpt-oss-120b`) |
| :--- | :--- |
| **Provider** | Groq API |
| **License** | Apache 2.0 |
| **Response Format** | JSON Object (`type: json_object`) |
| **Empirical Latency (Benchmark)** | 12,005 ms mean, 9,617 ms median (15-case benchmark) |
| **Category Accuracy** | 67% (10/15 cases) on fine-grained reasoning categories |
| **Zod Schema Adherence** | 100% (15/15 cases) |
| **Citation Precision** | 100% (12/12 valid verified citations) |

---

## 2. Intended Use & Role in Rootwise

The AI model functions as a **Socratic diagnostic tutor**, NOT an authoritative grade assigner. Its duties are strictly delimited:

1. **Topic Syllabus Proposal**: Grouping uploaded PDF chunks into suggested study topics (labeled: *"Suggested topics, not your official syllabus"*).
2. **Diagnostic Question Generation**: Formulating conceptual questions testing understanding rather than surface memorization.
3. **Misconception Diagnosis**: Hypothesizing root gaps behind incorrect student answers without penalizing grammar, spelling, or colloquial Nigerian Pidgin.
4. **Belief Simulation**: Constructing counterexamples demonstrating the domino breakdown of a faulty conceptual assumption (*Implied Belief → Consequence → Why It Breaks*).
5. **Study Guide Synthesis**: Condensing uploaded slides and textbook chunks into comprehensive summaries with intuitive mental models, key formulas, and exam pitfalls.

### Critical Safety Invariant
> **The AI model never updates student mastery or topic status.**  
> Topic status transitions (*Demonstrated*, *Developing*, *Needs Work*, *Confident Error Knot*) are computed exclusively by the deterministic state machine in [`lib/progress/rules.ts`](../lib/progress/rules.ts).

---

## 3. Data Governance & Privacy Boundaries

### What data leaves the user's environment?
- Course topic title and description.
- Top-4 retrieved chunks from Postgres Full-Text Search.
- Student's written answer.
- Student's self-reported confidence level (*Sure / Think so / Guessing*).

### What data NEVER leaves the local application?
- Student email, account credentials, or user IDs.
- Raw course documents or full PDF files (all chunking and text extraction happens securely on the server).
- Classroom cohort identifiers.

---

## 4. Models Excluded

### Excluded: N-ATLaS (`NCAIR1/N-ATLaS`)
Nigeria's National Centre for AI and Robotics (NCAIR) released `N-ATLaS` (Llama-3 8B fine-tuned for Nigerian languages). N-ATLaS was excluded on licence and access grounds: gated weights, custom licence with attribution requirement and a 1,000 active-user cap. In our benchmark, `openai/gpt-oss-120b` successfully handled 2/2 Nigerian Pidgin and code-switched reasoning test cases (Cases 13 and 14, sample size $n=2$).

---

## 5. Model Limitations & Mitigations

1. **Over-Diagnosing Vague Answers**:
   - On ambiguous or colloquial responses (such as Case 07), the model tends to diagnose a deep conceptual misconception instead of flagging insufficient evidence. All diagnoses are displayed as hypotheses (*"You may be thinking..."*).
2. **Citation Hallucination Defense**:
   - Rootwise enforces a strict **Citation Validator** ([`lib/validation/citations.ts`](../lib/validation/citations.ts)). Quotes returned by the model must match exact substrings in stored database chunks under whitespace normalization and match page numbers where present. Unverified quotes are dropped before rendering.
3. **Prompt Injection Defense**:
   - System prompt treats all course material excerpts as untrusted reference context. Embedded adversarial commands (e.g. Case 12) are ignored.
