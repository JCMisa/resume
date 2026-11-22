// Browser-only PDF text extraction (pdf.js), shared by the analyze page and the
// interview setup form. Layout reconstruction lives in lib/pdf-layout.ts.
import { joinPages, layoutPageText, type PdfTextItem } from "@/lib/pdf-layout";

export type ExtractedPdf = { text: string; pages: number };

export async function extractPdfText(
  data: ArrayBuffer,
  onPage?: (page: number, total: number) => void,
): Promise<ExtractedPdf> {
  const pdfjs = await import("pdfjs-dist");
  pdfjs.GlobalWorkerOptions.workerSrc = `//unpkg.com/pdfjs-dist@${pdfjs.version}/build/pdf.worker.min.mjs`;

  const task = pdfjs.getDocument({ data });
  const pdf = await task.promise;
  try {
    const pages: string[] = [];
    for (let n = 1; n <= pdf.numPages; n++) {
      onPage?.(n, pdf.numPages);
      const page = await pdf.getPage(n);
      const { width } = page.getViewport({ scale: 1 });
      const content = await page.getTextContent();

      const items: PdfTextItem[] = [];
      for (const raw of content.items) {
        if (!("str" in raw)) continue; // marked-content entries carry no text
        const [, , , d, e, f] = raw.transform;
        items.push({
          str: raw.str,
          x: e,
          y: f,
          width: raw.width,
          height: raw.height || Math.abs(d) || 10,
        });
      }
      pages.push(layoutPageText(items, width));
      page.cleanup();
    }
    return { text: joinPages(pages), pages: pdf.numPages };
  } finally {
    void task.destroy(); // frees the worker-side document
  }
}
