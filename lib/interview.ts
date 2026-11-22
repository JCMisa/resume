// Shared (client + server) helpers for interview transcripts.
// Agent.tsx records final transcript lines as "[ROLE]: text", e.g. "[USER]: I led the migration".

/**
 * How long after creating a session the browser may start its (single) voice
 * call through /api/vapi/call/web. Covers mic permission + connecting.
 */
export const CALL_TICKET_TTL_SECONDS = 120;

/** Action error code: the transcript was saved, but AI grading failed (retryable). */
export const GRADING_FAILED = "GRADING_FAILED";

/** True when the transcript contains at least one non-empty answer from the candidate. */
export function hasCandidateAnswers(transcript: string | null | undefined) {
  return /^\[USER\]:\s*\S/m.test(transcript ?? "");
}

const clamp = (n: number, min: number, max: number) =>
  Math.min(max, Math.max(min, n));

/** Parse + sanitize Gemini's grade so a slightly-off response can't break the report. */
export function parseInterviewGrade(text: string | undefined) {
  if (!text) throw new Error("Empty evaluation returned from Gemini.");
  const raw = JSON.parse(text);

  const score = Math.round(Number(raw?.overallScore));
  if (!Number.isFinite(score)) {
    throw new Error("Gemini evaluation is missing an overall score.");
  }
  const strings = (value: unknown) =>
    Array.isArray(value)
      ? value.filter((s): s is string => typeof s === "string" && s.trim() !== "")
      : [];

  return {
    overallScore: clamp(score, 1, 100),
    feedback: typeof raw.feedback === "string" ? raw.feedback : "",
    strengths: strings(raw.strengths),
    weaknesses: strings(raw.weaknesses),
    suggestions: (Array.isArray(raw.suggestions) ? raw.suggestions : [])
      .filter(
        (s: Record<string, unknown> | null) =>
          !!s && typeof s.category === "string" && typeof s.tip === "string",
      )
      .map((s: Record<string, unknown>) => ({
        category: s.category as string,
        score: clamp(Math.round(Number(s.score)) || 0, 0, 100),
        tip: s.tip as string,
      })),
  };
}
