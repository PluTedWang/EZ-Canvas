import { readFile } from "node:fs/promises";
import path from "node:path";

// Serves fixtures/canvas/*.json in place of the Canvas API when CANVAS_MOCK=1.

const fixturesDir = path.join(process.cwd(), "fixtures", "canvas");
export const mockBaseUrl = "https://canvas.example.edu";

const singleFiles: Record<string, string> = {
  "/users/self/profile": "profile.json",
  "/courses": "courses.json",
  "/announcements": "announcements.json",
  "/calendar_events": "calendar_events.json",
  "/users/self/groups": "groups.json",
};

function fixtureFile(apiPath: string) {
  const course = apiPath.match(/^\/courses\/(\d+)\/(assignments|modules|files|pages)$/);
  if (course) return `${course[2]}-${course[1]}.json`;
  const group = apiPath.match(/^\/groups\/(\d+)\/users$/);
  if (group) return `group-users-${group[1]}.json`;
  return singleFiles[apiPath] ?? null;
}

async function loadFixture(file: string): Promise<unknown> {
  try {
    return JSON.parse(await readFile(path.join(fixturesDir, file), "utf8"));
  } catch (error) {
    if ((error as NodeJS.ErrnoException).code === "ENOENT") return [];
    throw error;
  }
}

function filterByContext(items: unknown, params: URLSearchParams) {
  if (!Array.isArray(items)) return items;
  const codes = params.getAll("context_codes[]");
  const type = params.get("type");
  return items.filter(
    (item: { context_code?: string; type?: string }) =>
      (codes.length === 0 || codes.includes(item.context_code ?? "")) && (!type || item.type === type),
  );
}

export const mockFetch: typeof fetch = async (input) => {
  const url = new URL(typeof input === "string" ? input : input instanceof URL ? input.href : input.url);
  // Every fixture file download serves the same small sample PDF.
  if (/^\/files\/\d+\/download$/.test(url.pathname)) {
    const bytes = await readFile(path.join(process.cwd(), "fixtures", "materials", "lecture.pdf"));
    return new Response(new Uint8Array(bytes), {
      status: 200,
      headers: { "content-type": "application/pdf", "x-rate-limit-remaining": "700" },
    });
  }
  const apiPath = url.pathname.replace(/^.*\/api\/v1/, "");
  const file = fixtureFile(apiPath);
  const body = file ? filterByContext(await loadFixture(file), url.searchParams) : null;
  return new Response(JSON.stringify(body ?? { errors: [{ message: "not mocked" }] }), {
    status: file ? 200 : 404,
    headers: { "content-type": "application/json", "x-rate-limit-remaining": "700" },
  });
};
