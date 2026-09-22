"use server";

import { auth } from "./auth";
import { db } from "./db";
import { isTimeZone } from "./week";

// The browser reports its zone when the app loads; the component only calls this when it changed.
export async function saveTimeZone(timeZone: string) {
  const session = await auth();
  if (!session?.user?.id || !isTimeZone(timeZone)) return;
  await db.user.update({ where: { id: session.user.id }, data: { timeZone } });
}
