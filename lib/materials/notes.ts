import { createHash } from "node:crypto";
import { requireProvider } from "../ai";
import { summarizeMaterial, type MaterialNotes } from "../ai/prompts/summarize-material";
import { canvas } from "../canvas";
import { decrypt } from "../crypto";
import { db } from "../db";
import { extractMaterial } from "./extract";

export const sourceHash = (text: string) => createHash("sha256").update(text).digest("hex").slice(0, 32);

// Notes are stored per language, so switching the toggle does not spend tokens twice on one file.
export type NotesByLanguage = Record<string, MaterialNotes>;

export function readNotes(stored: unknown, hash: string | null, wantedHash: string, language: string) {
  if (hash !== wantedHash || stored === null || typeof stored !== "object") return null;
  const notes = (stored as NotesByLanguage)[language];
  return notes && Array.isArray(notes.points) ? notes : null;
}

// A changed file drops every language at once; stale notes in any language would be wrong.
export function mergeNotes(stored: unknown, sameFile: boolean, language: string, notes: MaterialNotes): NotesByLanguage {
  const existing = sameFile && stored !== null && typeof stored === "object" ? (stored as NotesByLanguage) : {};
  return { ...existing, [language]: notes };
}

export type NotesResult = { notes: MaterialNotes } | { unsupported: string };

export async function ensureNotes(userId: string, materialId: string, language: string): Promise<NotesResult> {
  const material = await db.material.findFirstOrThrow({
    where: { id: materialId, course: { userId } },
    select: {
      id: true,
      type: true,
      title: true,
      url: true,
      body: true,
      contentType: true,
      notes: true,
      notesHash: true,
      course: { select: { code: true } },
    },
  });

  const connection = await db.connection.findUniqueOrThrow({ where: { userId_type: { userId, type: "canvas" } } });
  const api = canvas(connection.baseUrl, decrypt(connection.token));
  const extracted = await extractMaterial(material, () => api.download(material.url));
  if ("unsupported" in extracted) {
    await db.material.update({ where: { id: material.id }, data: { unsupported: extracted.unsupported } });
    return extracted;
  }

  const hash = sourceHash(extracted.text);
  const cached = readNotes(material.notes, material.notesHash, hash, language);
  if (cached) return { notes: cached };

  const notes = await summarizeMaterial(await requireProvider(userId), {
    title: material.title,
    courseCode: material.course.code,
    text: extracted.text,
    explanationLanguage: language,
  });
  await db.material.update({
    where: { id: material.id },
    data: {
      notes: mergeNotes(material.notes, material.notesHash === hash, language, notes),
      notesHash: hash,
      notesLanguage: language,
      notesAt: new Date(),
      unsupported: null,
    },
  });
  return { notes };
}
