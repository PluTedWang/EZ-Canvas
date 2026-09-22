import { requireProvider } from "../ai";
import { summarizeMaterial, type MaterialNotes } from "../ai/prompts/summarize-material";
import { canvas } from "../canvas";
import { assertCanvasHost } from "../canvas/host";
import { decrypt } from "../crypto";
import { db } from "../db";
import { extractMaterial } from "./extract";

// Notes are stored per language, so switching the toggle does not spend tokens twice on one file.
// Sync clears them when Canvas reports a new version of the file (see materialChanged).
export type NotesByLanguage = Record<string, MaterialNotes>;

export function readNotes(stored: unknown, language: string) {
  if (stored === null || typeof stored !== "object") return null;
  const notes = (stored as NotesByLanguage)[language];
  return notes && Array.isArray(notes.points) ? notes : null;
}

export function mergeNotes(stored: unknown, language: string, notes: MaterialNotes): NotesByLanguage {
  const existing = stored !== null && typeof stored === "object" ? (stored as NotesByLanguage) : {};
  return { ...existing, [language]: notes };
}

// A new upload of a file moves its updated_at; an edited page or announcement changes its body.
export function materialChanged(
  stored: { postedAt: Date | null; body: string | null },
  incoming: { postedAt?: Date | null; body?: string | null },
) {
  const postedChanged = (incoming.postedAt?.getTime() ?? null) !== (stored.postedAt?.getTime() ?? null);
  const bodyChanged = incoming.body !== undefined && (incoming.body ?? null) !== stored.body;
  return postedChanged || bodyChanged;
}

async function download(userId: string, url: string) {
  const connection = await db.connection.findUniqueOrThrow({ where: { userId_type: { userId, type: "canvas" } } });
  await assertCanvasHost(connection.baseUrl);
  return canvas(connection.baseUrl, decrypt(connection.token)).download(url);
}

export type NotesResult = { notes: MaterialNotes } | { unsupported: string };

export async function ensureNotes(userId: string, materialId: string, language: string): Promise<NotesResult> {
  const material = await db.material.findFirstOrThrow({
    where: { id: materialId, course: { userId } },
    select: { id: true, type: true, title: true, url: true, body: true, contentType: true, notes: true, course: { select: { code: true } } },
  });
  const cached = readNotes(material.notes, language);
  if (cached) return { notes: cached };

  const extracted = await extractMaterial(material, () => download(userId, material.url));
  if ("unsupported" in extracted) {
    await db.material.update({ where: { id: material.id }, data: { unsupported: extracted.unsupported } });
    return extracted;
  }

  const notes = await summarizeMaterial(await requireProvider(userId), {
    title: material.title,
    courseCode: material.course.code,
    text: extracted.text,
    explanationLanguage: language,
  });
  await db.material.update({
    where: { id: material.id },
    data: { notes: mergeNotes(material.notes, language, notes), notesAt: new Date(), unsupported: null },
  });
  return { notes };
}
