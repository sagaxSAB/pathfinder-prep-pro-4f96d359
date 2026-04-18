/**
 * Extract text from a PDF using pdfjs-dist (browser worker).
 * Returns plain text from up to maxPages pages.
 */
import * as pdfjsLib from "pdfjs-dist";
// Vite worker import — handled by Vite at build time.
// @ts-ignore
import workerSrc from "pdfjs-dist/build/pdf.worker.min.mjs?url";

(pdfjsLib as any).GlobalWorkerOptions.workerSrc = workerSrc;

export async function extractPdfText(file: File, maxPages = 15): Promise<string> {
  const buf = await file.arrayBuffer();
  const pdf = await (pdfjsLib as any).getDocument({ data: buf }).promise;
  const pages = Math.min(pdf.numPages, maxPages);
  let out = "";
  for (let i = 1; i <= pages; i++) {
    const page = await pdf.getPage(i);
    const content = await page.getTextContent();
    const strings = content.items.map((it: any) => it.str);
    out += strings.join(" ") + "\n\n";
  }
  return out.trim();
}
