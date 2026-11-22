// Every Gemini model the app uses, in one place. Safe to import from client
// and server (the voice interviewer config is built in the browser).
// Check https://ai.google.dev/gemini-api/docs/deprecations before changing.

export const AI_MODELS = {
  /**
   * Resume parsing + ATS analysis (Free and Pro, highest volume).
   * Flash-Lite: stable, cheap ($0.25 in / $1.50 out per 1M tokens), good at
   * structured extraction.
   */
  resumeAnalysis: "gemini-3.1-flash-lite",

  /** Resume vs job description match (same cost profile as an analysis). */
  jobMatch: "gemini-3.1-flash-lite",

  /**
   * Grading a finished mock interview (Pro only, once per interview).
   * Planned upgrade: "gemini-3.8-flash" (stronger feedback, ~1 cent per grade).
   * On 2026-11-21 it returned 503 "high demand" twice for our API key, so it's
   * not the primary until it's verified to respond. Flip this line to upgrade;
   * the fallback below keeps reports safe either way.
   */
  interviewGrading: "gemini-3.1-flash-lite",
  /**
   * Second grading attempt, used if the first fails (503, timeout, bad JSON).
   * Keep this on a model verified to work.
   */
  interviewGradingFallback: "gemini-3.1-flash-lite",

  /**
   * The live voice interviewer, run by Vapi. Latency matters most in a voice
   * call, so use Flash-Lite. (Replaces gemini-2.5-flash, which Google shuts
   * down on Dec 1, 2026.) Switch to "gemini-3.8-flash" if questions feel
   * shallow, but test the response delay.
   */
  voiceInterviewer: "gemini-3.1-flash-lite",
} as const;
