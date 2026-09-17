"use server";

import { cookies } from "next/headers";
import { getLocale } from "next-intl/server";
import { auth } from "./auth";
import { db } from "./db";
import { isLocale, localeCookie, locales } from "./locales";

const oneYear = 60 * 60 * 24 * 365;

export async function toggleLocale() {
  const current = await getLocale();
  const index = isLocale(current) ? locales.indexOf(current) : 0;
  const next = locales[(index + 1) % locales.length];
  const session = await auth();
  if (session?.user?.id) {
    await db.user.update({ where: { id: session.user.id }, data: { interfaceLanguage: next } });
  }
  (await cookies()).set(localeCookie, next, { path: "/", maxAge: oneYear });
}
