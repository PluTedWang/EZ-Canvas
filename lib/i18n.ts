import { cookies } from "next/headers";
import { getRequestConfig } from "next-intl/server";
import { auth } from "./auth";
import { db } from "./db";
import { defaultLocale, isLocale, localeCookie } from "./locales";

// The signed in user's interface language wins; the cookie covers signed out pages.
async function currentLocale() {
  const session = await auth();
  if (session?.user?.id) {
    const user = await db.user.findUnique({
      where: { id: session.user.id },
      select: { interfaceLanguage: true },
    });
    if (isLocale(user?.interfaceLanguage)) return user.interfaceLanguage;
  }
  const stored = (await cookies()).get(localeCookie)?.value;
  return isLocale(stored) ? stored : defaultLocale;
}

export default getRequestConfig(async () => {
  const locale = await currentLocale();
  return {
    locale,
    messages: (await import(`../messages/${locale}.json`)).default,
  };
});
