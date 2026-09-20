// Builds an iCalendar feed. Times go out in UTC so the file needs no VTIMEZONE block.
export type IcsEvent = {
  uid: string;
  title: string;
  start: Date;
  end: Date | null;
  allDay: boolean;
  location?: string | null;
  description?: string | null;
};

const pad = (value: number, length = 2) => String(value).padStart(length, "0");
const utcStamp = (date: Date) =>
  `${date.getUTCFullYear()}${pad(date.getUTCMonth() + 1)}${pad(date.getUTCDate())}T${pad(date.getUTCHours())}${pad(date.getUTCMinutes())}${pad(date.getUTCSeconds())}Z`;
const utcDate = (date: Date) => `${date.getUTCFullYear()}${pad(date.getUTCMonth() + 1)}${pad(date.getUTCDate())}`;

// Commas, semicolons and backslashes carry meaning in iCalendar, so they are escaped.
const escape = (value: string) => value.replace(/([\\;,])/g, "\\$1").replace(/\r?\n/g, "\\n");

// Lines are folded at 75 octets with a leading space on each continuation.
function fold(line: string) {
  const bytes = Buffer.from(line, "utf8");
  if (bytes.length <= 75) return line;
  const parts: string[] = [];
  let offset = 0;
  while (offset < bytes.length) {
    const size = offset === 0 ? 75 : 74;
    // Step back to avoid splitting a multi byte character across two lines.
    let take = Math.min(size, bytes.length - offset);
    while (take > 1 && (bytes[offset + take] & 0xc0) === 0x80) take -= 1;
    parts.push((offset === 0 ? "" : " ") + bytes.subarray(offset, offset + take).toString("utf8"));
    offset += take;
  }
  return parts.join("\r\n");
}

export function icsFeed(name: string, events: IcsEvent[], now = new Date()) {
  const lines = ["BEGIN:VCALENDAR", "VERSION:2.0", "PRODID:-//EZCanvas//EN", "CALSCALE:GREGORIAN", "METHOD:PUBLISH", `X-WR-CALNAME:${escape(name)}`];
  for (const event of events) {
    lines.push("BEGIN:VEVENT", `UID:${event.uid}@ezcanvas`, `DTSTAMP:${utcStamp(now)}`);
    if (event.allDay) {
      lines.push(`DTSTART;VALUE=DATE:${utcDate(event.start)}`);
    } else {
      lines.push(`DTSTART:${utcStamp(event.start)}`);
      if (event.end) lines.push(`DTEND:${utcStamp(event.end)}`);
    }
    lines.push(`SUMMARY:${escape(event.title)}`);
    if (event.location) lines.push(`LOCATION:${escape(event.location)}`);
    if (event.description) lines.push(`DESCRIPTION:${escape(event.description)}`);
    lines.push("END:VEVENT");
  }
  lines.push("END:VCALENDAR");
  return lines.map(fold).join("\r\n") + "\r\n";
}
