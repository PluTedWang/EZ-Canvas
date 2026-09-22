export type CanvasParams = Record<string, string | number | Array<string | number>>;

export class CanvasError extends Error {
  constructor(
    public status: number,
    public path: string,
    // Canvas answers a spent rate limit with 403 too; it must not read as "tab hidden".
    public rateLimited = false,
  ) {
    super(`Canvas responded ${status} for ${path}${rateLimited ? " (rate limited)" : ""}`);
  }
}

// Canvas allows about 700 cost units per bucket; slow down before it runs dry.
const lowWater = 100;
const throttleMs = 1000;
const retryMs = 2000;
const maxRetries = 3;

const sleep = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms));

function buildUrl(root: string, path: string, params: CanvasParams) {
  const url = new URL(root + path);
  for (const [key, value] of Object.entries(params)) {
    if (Array.isArray(value)) value.forEach((v) => url.searchParams.append(`${key}[]`, String(v)));
    else url.searchParams.set(key, String(value));
  }
  return url.toString();
}

export function nextLink(header: string | null) {
  const match = header?.match(/<([^>]+)>;\s*rel="next"/);
  return match?.[1] ?? null;
}

export function createCanvasClient({
  baseUrl,
  token,
  fetchImpl = fetch,
}: {
  baseUrl: string;
  token: string;
  fetchImpl?: typeof fetch;
}) {
  const origin = new URL(baseUrl).origin;
  const root = origin + "/api/v1";

  // API calls never follow redirects, so a token cannot be walked off to another host.
  // File downloads do: Canvas answers them with a redirect to its file store.
  async function request(url: string, path: string, redirect: RequestRedirect = "error", attempt = 0): Promise<Response> {
    const res = await fetchImpl(url, { headers: { Authorization: `Bearer ${token}` }, redirect });
    const remaining = Number(res.headers.get("x-rate-limit-remaining") ?? NaN);
    if (res.status === 403 && remaining <= 0 && attempt < maxRetries) {
      await sleep(retryMs);
      return request(url, path, redirect, attempt + 1);
    }
    if (!res.ok) throw new CanvasError(res.status, path, res.status === 403 && remaining <= 0);
    if (remaining < lowWater) await sleep(throttleMs);
    return res;
  }

  return {
    async get<T>(path: string, params: CanvasParams = {}): Promise<T> {
      const res = await request(buildUrl(root, path, params), path);
      return res.json();
    },
    // File downloads are absolute Canvas URLs, not API paths, but still need the bearer token.
    // Only URLs on the connected Canvas host are fetched.
    async getBytes(url: string): Promise<Uint8Array> {
      const target = new URL(url);
      if (target.origin !== origin) throw new CanvasError(0, target.pathname);
      const res = await request(url, target.pathname, "follow");
      return new Uint8Array(await res.arrayBuffer());
    },
    async getAll<T>(path: string, params: CanvasParams = {}): Promise<T[]> {
      const items: T[] = [];
      let url: string | null = buildUrl(root, path, { per_page: 100, ...params });
      while (url) {
        const res = await request(url, path);
        items.push(...((await res.json()) as T[]));
        url = nextLink(res.headers.get("link"));
      }
      return items;
    },
  };
}

export type CanvasClient = ReturnType<typeof createCanvasClient>;
