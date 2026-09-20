import { redirect } from "next/navigation";
import { auth } from "@/lib/auth";
import { db } from "@/lib/db";

// There is no separate course index in the designs; the nav item opens the first course.
export default async function CoursesPage() {
  const session = await auth();
  if (!session?.user?.id) redirect("/signin");
  const course = await db.course.findFirst({
    where: { userId: session.user.id, hidden: false },
    orderBy: { canvasId: "asc" },
    select: { id: true },
  });
  redirect(course ? `/courses/${course.id}` : "/settings");
}
