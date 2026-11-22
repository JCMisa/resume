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
