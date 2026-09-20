// Week maths for the calendar. Pure date helpers, no database, so the screens and tests share them.
export const daysPerWeek = 7;

export function startOfWeek(date: Date) {
  const day = new Date(date.getFullYear(), date.getMonth(), date.getDate());
  day.setDate(day.getDate() - ((day.getDay() + 6) % 7)); // Monday starts the week
  return day;
}

export const addDays = (date: Date, days: number) => {
  const next = new Date(date);
  next.setDate(next.getDate() + days);
  return next;
};

// "2026-09-21" names a local calendar day; new Date() alone would read it as UTC and slip a week.
export function parseWeekParam(value: unknown, fallback: Date) {
  const match = typeof value === "string" ? /^(\d{4})-(\d{2})-(\d{2})$/.exec(value) : null;
  return match ? new Date(Number(match[1]), Number(match[2]) - 1, Number(match[3])) : fallback;
}
