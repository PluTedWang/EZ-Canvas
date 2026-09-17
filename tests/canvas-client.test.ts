import { afterEach, expect, test, vi } from "vitest";
import { CanvasError, createCanvasClient, nextLink } from "../lib/canvas/client";

type Reply = { status?: number; body: unknown; headers?: Record<string, string> };

function fakeFetch(replies: Reply[]) {
  const calls: string[] = [];
  const fetchImpl = vi.fn(async (input: string | URL | Request) => {
    calls.push(String(input));
    const reply = replies.shift();
    if (!reply) throw new Error("no reply queued");
    return new Response(JSON.stringify(reply.body), {
      status: reply.status ?? 200,
      headers: { "content-type": "application/json", "x-rate-limit-remaining": "650", ...reply.headers },
    });
  }) as unknown as typeof fetch;
  return { fetchImpl, calls };
}

afterEach(() => vi.useRealTimers());

test("nextLink reads the rel=next url from a Link header", () => {
  const header =
    '<https://x.edu/api/v1/courses?page=2&per_page=100>; rel="next",<https://x.edu/api/v1/courses?page=1&per_page=100>; rel="first"';
  expect(nextLink(header)).toBe("https://x.edu/api/v1/courses?page=2&per_page=100");
  expect(nextLink('<https://x.edu/api/v1/courses?page=1>; rel="current"')).toBeNull();
  expect(nextLink(null)).toBeNull();
});

test("getAll follows pagination and sends the token, per_page and array params", async () => {
  const { fetchImpl, calls } = fakeFetch([
    { body: [{ id: 1 }, { id: 2 }], headers: { link: '<https://x.edu/api/v1/courses?page=2>; rel="next"' } },
    { body: [{ id: 3 }] },
  ]);
  const client = createCanvasClient({ baseUrl: "https://x.edu/", token: "tok", fetchImpl });
  const items = await client.getAll<{ id: number }>("/courses", { include: ["term", "teachers"] });

  expect(items.map((i) => i.id)).toEqual([1, 2, 3]);
  expect(calls[0]).toBe("https://x.edu/api/v1/courses?per_page=100&include%5B%5D=term&include%5B%5D=teachers");
  expect(calls[1]).toBe("https://x.edu/api/v1/courses?page=2");
  expect((fetchImpl as ReturnType<typeof vi.fn>).mock.calls[0][1]).toEqual({
    headers: { Authorization: "Bearer tok" },
  });
});

test("a rate limited 403 is retried after a pause", async () => {
  vi.useFakeTimers();
  const { fetchImpl, calls } = fakeFetch([
    { status: 403, body: "403 Forbidden (Rate Limit Exceeded)", headers: { "x-rate-limit-remaining": "0" } },
    { body: { id: 9 } },
  ]);
  const client = createCanvasClient({ baseUrl: "https://x.edu", token: "tok", fetchImpl });
  const pending = client.get<{ id: number }>("/users/self/profile");
  await vi.runAllTimersAsync();

  expect(await pending).toEqual({ id: 9 });
  expect(calls).toHaveLength(2);
});

test("other errors throw a CanvasError with the status and path", async () => {
  const { fetchImpl } = fakeFetch([{ status: 401, body: { errors: [{ message: "Invalid access token." }] } }]);
  const client = createCanvasClient({ baseUrl: "https://x.edu", token: "bad", fetchImpl });
  await expect(client.get("/users/self/profile")).rejects.toMatchObject(
    new CanvasError(401, "/users/self/profile"),
  );
});
