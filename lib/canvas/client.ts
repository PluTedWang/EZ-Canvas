export type CanvasParams = Record<string, string | number | Array<string | number>>;

export class CanvasError extends Error {
  constructor(
    public status: number,
    public path: string,
  ) {
    super(`Canvas responded ${status} for ${path}`);
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
  const root = baseUrl.replace(/\/+$/, "") + "/api/v1";

  async function request(url: string, path: string, attempt = 0): Promise<Response> {
    const res = await fetchImpl(url, { headers: { Authorization: `Bearer ${token}` } });
    const remaining = Number(res.headers.get("x-rate-limit-remaining") ?? NaN);
    if (res.status === 403 && remaining <= 0 && attempt < maxRetries) {
      await sleep(retryMs);
      return request(url, path, attempt + 1);
    }
    if (!res.ok) throw new CanvasError(res.status, path);
    if (remaining < lowWater) await sleep(throttleMs);
    return res;
  }

  return {
    async get<T>(path: string, params: CanvasParams = {}): Promise<T> {
      const res = await request(buildUrl(root, path, params), path);
      return res.json();
    },
    // File downloads are absolute Canvas URLs, not API paths, but still need the bearer token.
    async getBytes(url: string): Promise<Uint8Array> {
      const res = await request(url, new URL(url).pathname);
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
