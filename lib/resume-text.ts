// Pure helpers for text extracted from resume PDFs in the browser.

/** Fewer readable (non-whitespace) characters than this: an image-only / scanned PDF. */
export const MIN_RESUME_TEXT_CHARS = 150;

/** True when extracted text is too thin to be a real text-based resume. */
export function looksScanned(text: string) {
  return text.replace(/\s/g, "").length < MIN_RESUME_TEXT_CHARS;
}

export function countWords(text: string) {
  return text.split(/\s+/).filter(Boolean).length;
}

/**
 * Scanned (image-only) resumes are sent to Gemini as the PDF itself, through a
 * server action. Keep under the 4mb serverActions.bodySizeLimit in
 * next.config.ts (and Vercel's 4.5MB request cap), leaving room for overhead.
 */
export const SCANNED_PDF_MAX_BYTES = 3.5 * 1024 * 1024;

/** True when the bytes start with the PDF signature "%PDF-". */
export function isPdfBytes(bytes: Uint8Array): boolean {
  const sig = [0x25, 0x50, 0x44, 0x46, 0x2d]; // %PDF-
  return bytes.length >= sig.length && sig.every((b, i) => bytes[i] === b);
}
