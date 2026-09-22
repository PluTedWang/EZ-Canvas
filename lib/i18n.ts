import { cookies } from "next/headers";
import { getRequestConfig } from "next-intl/server";
import { defaultLocale, isLocale, localeCookie } from "./locales";
import { currentUser } from "./session";
import { defaultTimeZone } from "./week";

// The signed in user's interface language and time zone win; the cookie covers signed out pages.
async function currentSettings() {
  const user = await currentUser();
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
