import { redirect } from "next/navigation";
import { db } from "@/lib/db";
import { requireUser } from "@/lib/session";

// There is no separate course index in the designs; the nav item opens the first course.
export default async function CoursesPage() {
  const user = await requireUser();
  const course = await db.course.findFirst({
    where: { userId: user.id, hidden: false },
    orderBy: { canvasId: "asc" },
    select: { id: true },
  });
  redirect(course ? `/courses/${course.id}` : "/settings");
}
