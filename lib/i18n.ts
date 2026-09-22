import { cookies } from "next/headers";
import { getRequestConfig } from "next-intl/server";
import { auth } from "./auth";
import { db } from "./db";
import { defaultLocale, isLocale, localeCookie } from "./locales";
import { defaultTimeZone } from "./week";

// The signed in user's interface language and time zone win; the cookie covers signed out pages.
async function currentSettings() {
  const session = await auth();
  const user = session?.user?.id
    ? await db.user.findUnique({ where: { id: session.user.id }, select: { interfaceLanguage: true, timeZone: true } })
    : null;
  if (user && isLocale(user.interfaceLanguage)) return { locale: user.interfaceLanguage, timeZone: user.timeZone };
  const stored = (await cookies()).get(localeCookie)?.value;
  return { locale: isLocale(stored) ? stored : defaultLocale, timeZone: user?.timeZone ?? defaultTimeZone };
}

export default getRequestConfig(async () => {
  const { locale, timeZone } = await currentSettings();
  return {
    locale,
    timeZone,
    messages: (await import(`../messages/${locale}.json`)).default,
  };
});
