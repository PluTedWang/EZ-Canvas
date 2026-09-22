import { canvasApi } from "./api";
import { createCanvasClient } from "./client";
import { mockBaseUrl, mockFetch } from "./mock";

// In mock mode every request goes to the fixtures, which live on their own example host.
export function canvas(baseUrl: string, token: string) {
  return process.env.CANVAS_MOCK === "1"
    ? canvasApi(createCanvasClient({ baseUrl: mockBaseUrl, token, fetchImpl: mockFetch }))
    : canvasApi(createCanvasClient({ baseUrl, token }));
}
