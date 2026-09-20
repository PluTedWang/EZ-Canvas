// How a due date is shown: near deadlines read as a day word, the rest as a date.
export type DueTone = "danger" | "warn" | "neutral";
export type DueLabel = "overdue" | "today" | "tomorrow" | "date";

const startOfDay = (value: Date) => new Date(value.getFullYear(), value.getMonth(), value.getDate());
const dayMs = 24 * 60 * 60 * 1000;

export const daysBetween = (from: Date, to: Date) => Math.round((startOfDay(to).getTime() - startOfDay(from).getTime()) / dayMs);

export function dueChip(dueAt: Date, now: Date): { tone: DueTone; label: DueLabel } {
  if (dueAt.getTime() < now.getTime()) return { tone: "danger", label: "overdue" };
  const days = daysBetween(now, dueAt);
  if (days === 0) return { tone: "warn", label: "today" };
  if (days === 1) return { tone: "warn", label: "tomorrow" };
  return { tone: "neutral", label: "date" };
}
