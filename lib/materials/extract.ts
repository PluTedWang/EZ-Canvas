import { htmlToText } from "../canvas/syllabus";

// Turns a Canvas material into plain text for the summarizer.
// Canvas pages and announcements arrive as HTML; files must be downloaded and parsed.

export const pdfContentType = "application/pdf";

export type ExtractResult = { text: string } | { unsupported: string };

export async function extractPdf(bytes: Uint8Array) {
  // The legacy build is the one that runs under Node without a DOM.
  const pdfjs = await import("pdfjs-dist/legacy/build/pdf.mjs");
  const task = pdfjs.getDocument({ data: bytes, useSystemFonts: true });
  const doc = await task.promise;
  const pages: string[] = [];
  for (let number = 1; number <= doc.numPages; number += 1) {
    const page = await doc.getPage(number);
    const content = await page.getTextContent();
    const text = content.items
      .map((item) => ("str" in item ? item.str : ""))
      .join(" ")
      .replace(/[ \t]+/g, " ")
      .trim();
    if (text) pages.push(text);
  }
  await task.destroy();
  return pages.join("\n\n");
}

export async function extractMaterial(
  material: { type: string; contentType: string | null; body: string | null },
  download: () => Promise<Uint8Array>,
): Promise<ExtractResult> {
  if (material.type === "page" || material.type === "announcement") {
    const text = htmlToText(material.body ?? "");
    return text ? { text } : { unsupported: "empty" };
  }
  if (material.type === "link") return { unsupported: "link" };
  if (material.contentType === pdfContentType) return { text: await extractPdf(await download()) };
  return { unsupported: material.contentType ?? "unknown" };
}
