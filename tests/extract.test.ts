import { readFileSync } from "node:fs";
import { expect, test } from "vitest";
import { extractMaterial, extractPdf } from "../lib/materials/extract";

const pdfBytes = () => new Uint8Array(readFileSync("fixtures/materials/lecture.pdf"));
const never = async () => {
  throw new Error("should not download");
};

test("a PDF yields its text, one block per page", async () => {
  const text = await extractPdf(pdfBytes());
  expect(text.split("\n\n")).toEqual([
    "Lecture 7: Requirements elicitation",
    "A stakeholder is anyone affected by the system. Traceability links each requirement to a test.",
  ]);
});

test("a Canvas page is read from its HTML body without downloading", async () => {
  const result = await extractMaterial(
    { type: "page", contentType: null, body: "<h2>Policies</h2><p>Late work loses 10% &amp; more.</p>" },
    never,
  );
  expect(result).toEqual({ text: "Policies\nLate work loses 10% & more." });
});

test("an announcement is read the same way as a page", async () => {
  const result = await extractMaterial({ type: "announcement", contentType: null, body: "<p>Use the v2 template.</p>" }, never);
  expect(result).toEqual({ text: "Use the v2 template." });
});

test("a PDF file is downloaded and parsed", async () => {
  const result = await extractMaterial({ type: "file", contentType: "application/pdf", body: null }, async () => pdfBytes());
  expect("text" in result && result.text).toContain("Traceability");
});

test("a Word file reports its type rather than pretending to be empty", async () => {
  const type = "application/vnd.openxmlformats-officedocument.wordprocessingml.document";
  expect(await extractMaterial({ type: "file", contentType: type, body: null }, never)).toEqual({ unsupported: type });
});

test("a bare link and an empty page are reported, not summarized", async () => {
  expect(await extractMaterial({ type: "link", contentType: null, body: null }, never)).toEqual({ unsupported: "link" });
  expect(await extractMaterial({ type: "page", contentType: null, body: "" }, never)).toEqual({ unsupported: "empty" });
});
