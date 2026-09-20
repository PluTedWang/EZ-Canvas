"use server";

import { randomUUID } from "node:crypto";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { auth } from "@/lib/auth";
import { loadWeek, proposeBlocks } from "@/lib/calendar";
import { db } from "@/lib/db";

// Re-plans the week on the server and writes the blocks, so the form cannot post times of its own.
export async function acceptBlocks(formData: FormData) {
  const session = await auth();
  const userId = session?.user?.id;
  if (!userId) redirect("/signin");
  const weekStart = new Date(String(formData.get("week")));
  if (Number.isNaN(weekStart.getTime())) redirect("/calendar");

  const now = new Date();
  const blocks = proposeBlocks(await loadWeek(userId, weekStart), now);
  await db.calendarItem.createMany({
    data: blocks.map((block) => ({
      userId,
      courseId: block.courseId,
      assignmentId: block.assignmentId,
      source: "study",
      title: block.title,
      startAt: block.start,
      endAt: block.end,
      accepted: true,
    })),
  });
  revalidatePath("/calendar");
}

// The feed token is created the first time the student opens Export, never during a page render.
export async function openExport() {
  const session = await auth();
  const userId = session?.user?.id;
  if (!userId) redirect("/signin");
  const user = await db.user.findUniqueOrThrow({ where: { id: userId }, select: { calendarToken: true } });
  if (!user.calendarToken) {
    await db.user.update({ where: { id: userId }, data: { calendarToken: randomUUID() } });
  }
  redirect("/calendar?export=1");
}
