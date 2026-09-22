import { expect, test } from "vitest";
import { isLocalOrigin, originFrom } from "../lib/app-url";

const headers = (values: Record<string, string>) => (name: string) => values[name] ?? null;

test("APP_URL wins over the request", () => {
  expect(originFrom("https://ezcanvas.app/some/path", headers({ host: "internal:3000" }))).toBe("https://ezcanvas.app");
});

// The old code read the Referer header and fell back to localhost, so a missing Referer
// handed deployed users a feed address no calendar app could reach.
test("without APP_URL the request host is used, https unless it is local", () => {
  expect(originFrom(undefined, headers({ host: "ezcanvas.app" }))).toBe("https://ezcanvas.app");
  expect(originFrom(undefined, headers({ host: "localhost:3000" }))).toBe("http://localhost:3000");
});

test("a reverse proxy's forwarded host and protocol are respected", () => {
  expect(originFrom(undefined, headers({ host: "10.0.0.4:3000", "x-forwarded-host": "ezcanvas.app", "x-forwarded-proto": "https" }))).toBe(
    "https://ezcanvas.app",
  );
});

test("only a local feed address gets the download hint", () => {
  expect(isLocalOrigin("http://localhost:3000/api/calendar/x")).toBe(true);
  expect(isLocalOrigin("http://127.0.0.1:3000")).toBe(true);
  expect(isLocalOrigin("https://ezcanvas.app/api/calendar/x")).toBe(false);
  expect(isLocalOrigin("https://localhost.example.com")).toBe(false);
});
