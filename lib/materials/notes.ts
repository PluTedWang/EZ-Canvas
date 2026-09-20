import { createHash } from "node:crypto";
import { requireProvider } from "../ai";
import { summarizeMaterial, type MaterialNotes } from "../ai/prompts/summarize-material";
import { canvas } from "../canvas";
import { decrypt } from "../crypto";
import { db } from "../db";
import { extractMaterial } from "./extract";

export const sourceHash = (text: string) => createHash("sha256").update(text).digest("hex").slice(0, 32);

// Notes are cached per file version. Nothing is resummarized while the text and the language match.
export function notesAreCurrent(
  material: { notes: unknown; notesHash: string | null; notesLanguage: string | null },
  hash: string,
  language: string,
) {
  return material.notes !== null && material.notesHash === hash && material.notesLanguage === language;
}

export type NotesResult = { notes: MaterialNotes } | { unsupported: string };

export async function ensureNotes(userId: string, materialId: string): Promise<NotesResult> {
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
      notesLanguage: true,
      course: { select: { code: true } },
    },
  });
  const user = await db.user.findUniqueOrThrow({ where: { id: userId }, select: { explanationLanguage: true } });

  const connection = await db.connection.findUniqueOrThrow({ where: { userId_type: { userId, type: "canvas" } } });
  const api = canvas(connection.baseUrl, decrypt(connection.token));
  const extracted = await extractMaterial(material, () => api.download(material.url));
  if ("unsupported" in extracted) {
    await db.material.update({ where: { id: material.id }, data: { unsupported: extracted.unsupported } });
    return extracted;
  }

  const hash = sourceHash(extracted.text);
  if (notesAreCurrent(material, hash, user.explanationLanguage)) {
    return { notes: material.notes as MaterialNotes };
  }

  const notes = await summarizeMaterial(await requireProvider(userId), {
    title: material.title,
    courseCode: material.course.code,
    text: extracted.text,
    explanationLanguage: user.explanationLanguage,
  });
  await db.material.update({
    where: { id: material.id },
    data: { notes, notesHash: hash, notesLanguage: user.explanationLanguage, notesAt: new Date(), unsupported: null },
  });
  return { notes };
}
