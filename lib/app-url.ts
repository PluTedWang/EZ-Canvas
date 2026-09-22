import { headers } from "next/headers";

// The public address of this app, for links that leave the browser, like the calendar feed.
// APP_URL wins; without it the host the request arrived on is used, behind a proxy too.
export function originFrom(appUrl: string | undefined, header: (name: string) => string | null) {
  if (appUrl && URL.canParse(appUrl)) return new URL(appUrl).origin;
  const host = header("x-forwarded-host") ?? header("host") ?? "localhost:3000";
  const local = /^(localhost|127\.0\.0\.1)(:|$)/.test(host);
  const proto = header("x-forwarded-proto") ?? (local ? "http" : "https");
  return `${proto}://${host}`;
}

export async function appOrigin() {
  const request = await headers();
  return originFrom(process.env.APP_URL, (name) => request.get(name));
}

// Calendar apps subscribe from their own servers, so they cannot reach a feed on this machine.
export const isLocalOrigin = (origin: string) => /^https?:\/\/(localhost|127\.0\.0\.1)(:|$)/.test(origin);
