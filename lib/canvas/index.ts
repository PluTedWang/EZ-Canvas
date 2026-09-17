import { canvasApi } from "./api";
import { createCanvasClient } from "./client";
import { mockFetch } from "./mock";

export function canvas(baseUrl: string, token: string) {
  const fetchImpl = process.env.CANVAS_MOCK === "1" ? mockFetch : fetch;
  return canvasApi(createCanvasClient({ baseUrl, token, fetchImpl }));
}
