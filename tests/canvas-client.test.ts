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
    redirect: "error",
  });
});

test("downloads follow redirects but only start on the Canvas host", async () => {
  const { fetchImpl, calls } = fakeFetch([{ body: "pdf" }]);
  const client = createCanvasClient({ baseUrl: "https://x.edu", token: "tok", fetchImpl });
  await client.getBytes("https://x.edu/files/5/download?verifier=abc");
  expect(calls).toEqual(["https://x.edu/files/5/download?verifier=abc"]);
  expect((fetchImpl as ReturnType<typeof vi.fn>).mock.calls[0][1]).toMatchObject({ redirect: "follow" });
  await expect(client.getBytes("http://169.254.169.254/latest/meta-data")).rejects.toMatchObject({ status: 0 });
  expect(calls).toHaveLength(1);
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

// A hidden course tab and a spent rate limit both answer 403; only the second is marked.
test("a 403 that is still rate limited after the retries is marked as such", async () => {
  vi.useFakeTimers();
  const limited = { status: 403, body: "Rate Limit Exceeded", headers: { "x-rate-limit-remaining": "0" } };
  const { fetchImpl } = fakeFetch([limited, limited, limited, limited]);
  const client = createCanvasClient({ baseUrl: "https://x.edu", token: "tok", fetchImpl });
  const pending = client.getAll("/courses/1/files").catch((error) => error);
  await vi.runAllTimersAsync();
  expect(await pending).toMatchObject({ status: 403, rateLimited: true });

  const { fetchImpl: hidden } = fakeFetch([{ status: 403, body: "unauthorized" }]);
  const error = await createCanvasClient({ baseUrl: "https://x.edu", token: "tok", fetchImpl: hidden })
    .getAll("/courses/1/files")
    .catch((e) => e);
  expect(error).toMatchObject({ status: 403, rateLimited: false });
});
