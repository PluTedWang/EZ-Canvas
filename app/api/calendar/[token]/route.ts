import { feedEvents } from "@/lib/calendar";
import { db } from "@/lib/db";
import { icsFeed } from "@/lib/ics";

// The token in the URL is the only credential a calendar app can present, so it is the whole check.
export async function GET(_request: Request, { params }: RouteContext<"/api/calendar/[token]">) {
  const { token } = await params;
  const user = await db.user.findUnique({ where: { calendarToken: token }, select: { id: true, name: true } });
  if (!user) return new Response("Not found", { status: 404 });

  const body = icsFeed(`EZCanvas · ${user.name ?? "My courses"}`, await feedEvents(user.id));
  return new Response(body, {
    headers: {
      "content-type": "text/calendar; charset=utf-8",
      "content-disposition": 'inline; filename="ezcanvas.ics"',
      "cache-control": "no-store",
    },
  });
}
