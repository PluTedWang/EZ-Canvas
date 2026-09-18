"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { auth } from "@/lib/auth";
import { syncCanvas } from "@/lib/canvas/sync";
import { visibilityUpdates } from "@/lib/course-visibility";
import { db } from "@/lib/db";

async function userId() {
  const session = await auth();
  if (!session?.user?.id) redirect("/signin");
  return session.user.id;
}

export async function syncNow() {
  const connection = await db.connection.findUnique({ where: { userId_type: { userId: await userId(), type: "canvas" } } });
  if (!connection) redirect("/onboarding");
  // syncCanvas records the error status on the connection; the page shows it.
  await syncCanvas(connection.id).catch((error) => console.error("Canvas sync failed", error));
  revalidatePath("/settings");
}

export async function saveCourseVisibility(formData: FormData) {
  const courses = await db.course.findMany({ where: { userId: await userId() }, select: { id: true, hidden: true } });
  const shownIds = formData.getAll("shown").map(String);
  await db.$transaction(
    visibilityUpdates(courses, shownIds).map(({ id, hidden }) => db.course.update({ where: { id }, data: { hidden } })),
  );
  redirect("/settings");
}
