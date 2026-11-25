/**
 * User-facing error text. Our own messages ("Resume not found", limit and
 * rate-limit notices) pass through; anything that names an internal service
 * or looks like a raw library/database error is replaced with `fallback`, so
 * the UI never mentions the tools ResuMe is built on. Pure (tested).
 */
const INTERNAL =
  // tool names as word starts, so "NeonDbError" / "VapiError" are caught too
  /\b(gemini|google|genai|vapi|clerk|arcjet|cloudinary|neon|drizzle|postgres|sql|svix|deepgram|assembly\s?ai|openai|anthropic|vercel|pdfjs|mammoth)|ECONN|ETIMEDOUT|fetch failed|undefined|null|stack|\bat\s+\S+\s+\(/i;

/** Longest message we show as-is; longer ones are almost always raw dumps. */
const MAX_LENGTH = 200;

export function publicErrorMessage(error: unknown, fallback: string): string {
  const message =
    typeof error === "string" ? error : error instanceof Error ? error.message : "";
  const text = message.trim();
  if (!text || text.length > MAX_LENGTH || INTERNAL.test(text)) return fallback;
  return text;
}
