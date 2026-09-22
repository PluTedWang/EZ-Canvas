import { addDays, startOfDay, zonedParts, zonedTime } from "./week";

// Proposes study blocks from hours left, the lectures already on the calendar, and free time.
// Blocks are proposals only; nothing reaches the calendar until the student accepts them.
// Hours are the student's local hours, read in their time zone.

export const dayStartHour = 9;
export const dayEndHour = 19;

const hourMs = 60 * 60 * 1000;
const maxBlockHours = 2;
const minBlockHours = 1;
// One evening stays free each weekend: Saturday after this hour is never booked.
const freeEveningWeekday = 6;
const freeEveningFromHour = 17;

export type Interval = { start: Date; end: Date };

export type PlannedAssignment = {
  id: string;
  title: string;
  courseId: string | null;
  dueAt: Date;
  hoursLeft: number;
};

export type StudyBlock = Interval & { assignmentId: string; title: string; courseId: string | null };

function at(day: Date, hour: number, timeZone: string) {
  const p = zonedParts(day, timeZone);
  return zonedTime(timeZone, p.year, p.month, p.day, hour);
}

const overlaps = (a: Interval, b: Interval) => a.start < b.end && b.start < a.end;

function eachDay(from: Date, to: Date, timeZone: string) {
  const days: Date[] = [];
  for (let cursor = startOfDay(from, timeZone); cursor <= to; cursor = addDays(cursor, 1, timeZone)) days.push(cursor);
  return days;
}

// Blocks start on the hour or the half hour so the calendar reads cleanly.
const slotMs = 30 * 60 * 1000;
function nextSlot(time: Date, timeZone: string) {
  const p = zonedParts(time, timeZone);
  const into = ((p.minute % 30) * 60 + p.second) * 1000 + time.getUTCMilliseconds();
  return into === 0 ? time : new Date(time.getTime() - into + slotMs);
}

// The working part of one day, minus anything already booked and minus the past.
function freeSlots(day: Date, busy: Interval[], now: Date, timeZone: string): Interval[] {
  const freeEvening = zonedParts(day, timeZone).weekday === freeEveningWeekday;
  const dayEnd = at(day, freeEvening ? freeEveningFromHour : dayEndHour, timeZone);
  const start = nextSlot(new Date(Math.max(at(day, dayStartHour, timeZone).getTime(), now.getTime())), timeZone);
  if (start >= dayEnd) return [];

  let slots: Interval[] = [{ start, end: dayEnd }];
  for (const taken of busy) {
    slots = slots.flatMap((slot) => {
      if (!overlaps(slot, taken)) return [slot];
      const pieces: Interval[] = [];
      if (slot.start < taken.start) pieces.push({ start: slot.start, end: taken.start });
      if (taken.end < slot.end) pieces.push({ start: nextSlot(taken.end, timeZone), end: slot.end });
      return pieces;
    });
  }
  return slots.filter((slot) => slot.end.getTime() - slot.start.getTime() >= minBlockHours * hourMs);
}

export function planStudyBlocks({
  assignments,
  busy,
  from,
  to,
  now,
  timeZone,
}: {
  assignments: PlannedAssignment[];
  busy: Interval[];
  from: Date;
  to: Date;
  now: Date;
  timeZone: string;
}): StudyBlock[] {
  const booked = [...busy];
  const planned: StudyBlock[] = [];
  const days = eachDay(new Date(Math.max(from.getTime(), now.getTime())), to, timeZone);

  // Earliest deadline first, so the most urgent assignment claims the earliest free time.
  for (const assignment of [...assignments].sort((a, b) => a.dueAt.getTime() - b.dueAt.getTime())) {
    let remainingMs = assignment.hoursLeft * hourMs;
    for (const day of days) {
      if (remainingMs < minBlockHours * hourMs) break;
      for (const slot of freeSlots(day, booked, now, timeZone)) {
        if (remainingMs < minBlockHours * hourMs) break;
        const available = Math.min(slot.end.getTime(), assignment.dueAt.getTime()) - slot.start.getTime();
        const length = Math.min(remainingMs, maxBlockHours * hourMs, available);
        if (length < minBlockHours * hourMs) continue;
        const block = {
          start: slot.start,
          end: new Date(slot.start.getTime() + length),
          assignmentId: assignment.id,
          title: assignment.title,
          courseId: assignment.courseId,
        };
        planned.push(block);
        booked.push(block);
        remainingMs -= length;
      }
    }
  }
  return planned.sort((a, b) => a.start.getTime() - b.start.getTime());
}
