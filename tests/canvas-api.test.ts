import { expect, test } from "vitest";
import { canvasApi } from "../lib/canvas/api";
import type { CanvasClient } from "../lib/canvas/client";

function recordingClient() {
  const calls: { path: string; params: Record<string, unknown> }[] = [];
  const client = {
    get: async () => ({}),
    getBytes: async () => new Uint8Array(),
    getAll: async (path: string, params: Record<string, unknown> = {}) => {
      calls.push({ path, params });
      return (params.context_codes as string[]).map((code) => ({ context_code: code }));
    },
  } as unknown as CanvasClient;
  return { client, calls };
}

// A student with twelve courses used to send all twelve codes in one request, past Canvas's limit of ten.
test("calendar events for many courses are fetched in batches of ten and joined", async () => {
  const { client, calls } = recordingClient();
  const ids = Array.from({ length: 12 }, (_, i) => 100 + i);
  const events = await canvasApi(client).calendarEvents(ids, "event", "2026-09-01", "2026-12-01");
  expect(calls.map((c) => (c.params.context_codes as string[]).length)).toEqual([10, 2]);
  expect(calls[0].params).toMatchObject({ type: "event", start_date: "2026-09-01", end_date: "2026-12-01" });
  expect(events).toHaveLength(12);
});

test("announcements are batched the same way", async () => {
  const { client, calls } = recordingClient();
  await canvasApi(client).announcements([1, 2, 3], "2026-09-01");
  expect(calls).toHaveLength(1);
  expect(calls[0].params.context_codes).toEqual(["course_1", "course_2", "course_3"]);
});
