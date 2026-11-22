// Browser-only Word (.docx) text extraction with mammoth (loaded on demand so
// it's only downloaded when someone uploads a Word file). Structure handling
// lives in lib/docx-text.ts.
import { docxHtmlToText, isZipBytes } from "@/lib/docx-text";

export async function extractDocxText(data: ArrayBuffer): Promise<{ text: string }> {
  if (!isZipBytes(new Uint8Array(data.slice(0, 4)))) {
    throw new Error("Not a valid .docx file.");
  }
  const mammoth = await import("mammoth");
  const { value: html } = await mammoth.convertToHtml(
    { arrayBuffer: data },
    {
      // Skip images entirely (they'd be inlined as base64 data)
      convertImage: mammoth.images.imgElement(() => Promise.resolve({ src: "" })),
    },
  );
  return { text: docxHtmlToText(html) };
}
