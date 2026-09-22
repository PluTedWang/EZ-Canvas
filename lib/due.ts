import { daysBetween } from "./week";

// How a due date is shown: near deadlines read as a day word, the rest as a date.
export type DueTone = "danger" | "warn" | "neutral";
export type DueLabel = "overdue" | "today" | "tomorrow" | "date";

export function dueChip(dueAt: Date, now: Date, timeZone: string): { tone: DueTone; label: DueLabel } {
  if (dueAt.getTime() < now.getTime()) return { tone: "danger", label: "overdue" };
  const days = daysBetween(now, dueAt, timeZone);
  if (days === 0) return { tone: "warn", label: "today" };
  if (days === 1) return { tone: "warn", label: "tomorrow" };
  return { tone: "neutral", label: "date" };
}
