/**
 * Extract text from a PDF using pdfjs-dist v3 legacy build (no top-level await).
 */
// @ts-ignore
import * as pdfjsLib from "pdfjs-dist/legacy/build/pdf.js";
// @ts-ignore
import workerSrc from "pdfjs-dist/legacy/build/pdf.worker.min.js?url";

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
