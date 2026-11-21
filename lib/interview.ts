// Shared (client + server) helpers for interview transcripts.
// Agent.tsx records final transcript lines as "[ROLE]: text", e.g. "[USER]: I led the migration".

/** Action error code: the transcript was saved, but AI grading failed (retryable). */
export const GRADING_FAILED = "GRADING_FAILED";

/** True when the transcript contains at least one non-empty answer from the candidate. */
export function hasCandidateAnswers(transcript: string | null | undefined) {
  return /^\[USER\]:\s*\S/m.test(transcript ?? "");
}
