"use server";

import { cookies } from "next/headers";
import { isLocale, localeCookie, locales } from "./locales";

const oneYear = 60 * 60 * 24 * 365;

export async function toggleLocale() {
  const store = await cookies();
  const current = store.get(localeCookie)?.value;
  const index = isLocale(current) ? locales.indexOf(current) : 0;
  const next = locales[(index + 1) % locales.length];
  store.set(localeCookie, next, { path: "/", maxAge: oneYear });
}
