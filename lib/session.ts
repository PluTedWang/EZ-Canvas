import { redirect } from "next/navigation";
import { cache } from "react";
import { auth } from "./auth";
import { db } from "./db";

// One session lookup and one user row per request, shared by the layout, the page and the
// i18n config instead of each asking the database again. Server only: the row holds secrets.
export const currentUser = cache(async () => {
  const session = await auth();
  if (!session?.user?.id) return null;
  return db.user.findUnique({
    where: { id: session.user.id },
    include: { connections: { where: { type: "canvas" } } },
  });
});

export async function requireUser() {
  const user = await currentUser();
  if (!user) redirect("/signin");
  return user;
}
