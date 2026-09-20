"use server";

import { redirect } from "next/navigation";
import { auth } from "@/lib/auth";
import { AiError } from "@/lib/ai/types";
import { isLocale } from "@/lib/locales";
import { ensureNotes } from "@/lib/materials/notes";
import { db } from "@/lib/db";

// Summarizing costs the student tokens, so it only ever runs from this explicit click.
export async function generateNotes(formData: FormData) {
  const session = await auth();
  const userId = session?.user?.id;
  if (!userId) redirect("/signin");

  const materialId = String(formData.get("materialId") ?? "");
  const language = String(formData.get("language") ?? "");
  if (!materialId || !isLocale(language)) redirect("/courses");

  const material = await db.material.findFirstOrThrow({
    where: { id: materialId, course: { userId } },
    select: { courseId: true },
  });
  const back = `/courses/${material.courseId}?file=${materialId}&lang=${language}`;

  try {
    await ensureNotes(userId, materialId, language);
  } catch (error) {
    redirect(`${back}&error=${error instanceof AiError ? error.kind : "request"}`);
  }
  redirect(back);
}
