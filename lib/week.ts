// Calendar maths in the student's time zone. Every function takes the IANA zone their browser
// reported, so the server's own clock zone never decides what "today" or "Monday" means.
// Pure date helpers, no database, so the screens and tests share them.
export const daysPerWeek = 7;
export const defaultTimeZone = "UTC";

const dayMs = 24 * 60 * 60 * 1000;

export type ZonedParts = { year: number; month: number; day: number; hour: number; minute: number; second: number; weekday: number };

const weekdays = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];
const formatters = new Map<string, Intl.DateTimeFormat>();

function formatter(timeZone: string) {
  let format = formatters.get(timeZone);
  if (!format) {
    format = new Intl.DateTimeFormat("en-US", {
      timeZone,
      hourCycle: "h23",
      weekday: "short",
      year: "numeric",
      month: "numeric",
      day: "numeric",
      hour: "numeric",
      minute: "numeric",
      second: "numeric",
    });
    formatters.set(timeZone, format);
  }
  return format;
}

export function isTimeZone(value: unknown): value is string {
  if (typeof value !== "string" || !value) return false;
  try {
    formatter(value);
    return true;
  } catch {
    return false;
  }
}

// The wall clock reading of an instant in a zone. Month is 1 to 12, weekday 0 (Sunday) to 6.
export function zonedParts(date: Date, timeZone: string): ZonedParts {
  const parts = Object.fromEntries(formatter(timeZone).formatToParts(date).map((p) => [p.type, p.value]));
  return {
    year: Number(parts.year),
    month: Number(parts.month),
    day: Number(parts.day),
    hour: Number(parts.hour),
    minute: Number(parts.minute),
    second: Number(parts.second),
    weekday: weekdays.indexOf(parts.weekday),
  };
}

// How far the zone's wall clock runs ahead of UTC at that instant.
function offsetMs(date: Date, timeZone: string) {
  const p = zonedParts(date, timeZone);
  const wall = Date.UTC(p.year, p.month - 1, p.day, p.hour, p.minute, p.second);
  return wall - (date.getTime() - date.getUTCMilliseconds());
}

// The instant when the zone's wall clock shows this local time. Days past the end of the month roll over.
export function zonedTime(timeZone: string, year: number, month: number, day: number, hour = 0, minute = 0) {
  const wall = Date.UTC(year, month - 1, day, hour, minute);
  const first = wall - offsetMs(new Date(wall), timeZone);
  // A second pass settles instants near a daylight saving change.
  return new Date(wall - offsetMs(new Date(first), timeZone));
}

// "2026-09-21": the local calendar day, also the format of the ?week= parameter.
export function dayKey(date: Date, timeZone: string) {
  const p = zonedParts(date, timeZone);
  return `${p.year}-${String(p.month).padStart(2, "0")}-${String(p.day).padStart(2, "0")}`;
}

export const sameDay = (a: Date, b: Date, timeZone: string) => dayKey(a, timeZone) === dayKey(b, timeZone);

// Hours since local midnight, with minutes as a fraction: 13:30 is 13.5.
export function hourOfDay(date: Date, timeZone: string) {
  const p = zonedParts(date, timeZone);
  return p.hour + p.minute / 60;
}

export function startOfDay(date: Date, timeZone: string) {
  const p = zonedParts(date, timeZone);
  return zonedTime(timeZone, p.year, p.month, p.day);
}

export function startOfWeek(date: Date, timeZone: string) {
  const p = zonedParts(date, timeZone);
  return zonedTime(timeZone, p.year, p.month, p.day - ((p.weekday + 6) % 7)); // Monday starts the week
}

// Keeps the local time of day, so a daylight saving change does not shift it by an hour.
export function addDays(date: Date, days: number, timeZone: string) {
  const p = zonedParts(date, timeZone);
  const next = zonedTime(timeZone, p.year, p.month, p.day + days, p.hour, p.minute);
  return new Date(next.getTime() + p.second * 1000 + date.getUTCMilliseconds());
}

// Whole calendar days from one date to another, so 11 PM to 1 AM the next day is one day.
export function daysBetween(from: Date, to: Date, timeZone: string) {
  const a = zonedParts(from, timeZone);
  const b = zonedParts(to, timeZone);
  return Math.round((Date.UTC(b.year, b.month - 1, b.day) - Date.UTC(a.year, a.month - 1, a.day)) / dayMs);
}

// "2026-09-21" names a local calendar day in the student's zone.
export function parseWeekParam(value: unknown, timeZone: string, fallback: Date) {
  const match = typeof value === "string" ? /^(\d{4})-(\d{2})-(\d{2})$/.exec(value) : null;
  return match ? zonedTime(timeZone, Number(match[1]), Number(match[2]), Number(match[3])) : fallback;
}
