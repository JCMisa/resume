// Browser-only: read an uploaded resume file (PDF or Word) into text, the
// same way the Analyze page does (layout-aware PDF text, mammoth for Word).
// Scanned PDFs (no text layer) are flagged so the AI can read the file itself.
import { extractPdfText } from "@/lib/pdf-extract";
import { extractDocxText } from "@/lib/docx-extract";
import { resumeFileKind } from "@/lib/docx-text";
import { SCANNED_PDF_MAX_BYTES, countWords, looksScanned } from "@/lib/resume-text";

export const RESUME_FILE_MAX_BYTES = 10 * 1024 * 1024;
export const RESUME_FILE_ACCEPT = ".pdf,.docx,application/pdf,application/vnd.openxmlformats-officedocument.wordprocessingml.document";

export type ResumeFileRead =
  | { ok: true; kind: "text"; text: string; words: number; pages: number }
  | { ok: true; kind: "scanned"; pages: number }
  | { ok: false; error: string };

const MB = (bytes: number) => Math.round((bytes / 1024 / 1024) * 10) / 10;

/** Read a resume file in the browser. Never throws. */
export async function readResumeFile(file: File, onProgress?: (message: string) => void): Promise<ResumeFileRead> {
  const kind = resumeFileKind(file);
  if (kind === "doc") return { ok: false, error: "Old .doc files can't be read. Save it as .docx or PDF in Word, then upload it again." };
  if (kind === "other") return { ok: false, error: "Please upload a PDF or Word (.docx) file." };
  if (file.size > RESUME_FILE_MAX_BYTES) return { ok: false, error: `That file is over ${MB(RESUME_FILE_MAX_BYTES)} MB. Try a smaller file.` };

  try {
    const buffer = await file.arrayBuffer();
    if (kind === "docx") {
      onProgress?.("Reading your Word document…");
      const { text } = await extractDocxText(buffer);
      if (looksScanned(text)) {
        return { ok: false, error: "We couldn't find text in this Word file. If your resume is an image inside Word, export it as a PDF instead." };
      }
      return { ok: true, kind: "text", text, words: countWords(text), pages: 0 };
    }

    onProgress?.("Loading the PDF reader…");
    const { text, pages } = await extractPdfText(buffer, (page, total) => onProgress?.(`Reading page ${page} of ${total}…`));
    if (looksScanned(text)) {
      if (file.size > SCANNED_PDF_MAX_BYTES) {
        return {
          ok: false,
          error: `This looks like a scan, and it's too large for the AI to read (over ${MB(SCANNED_PDF_MAX_BYTES)} MB). Re-save it at a lower quality, or export it as a text PDF from Word or Google Docs.`,
        };
      }
      return { ok: true, kind: "scanned", pages };
    }
    return { ok: true, kind: "text", text, words: countWords(text), pages };
  } catch (error) {
    console.error("Resume file read failed:", error);
    return {
      ok: false,
      error:
        kind === "docx"
          ? "The Word file may be corrupted or password-protected. Try saving it again, or export it as a PDF."
          : "The file may be corrupted or password-protected. Try re-exporting it as a PDF.",
    };
  }
}
