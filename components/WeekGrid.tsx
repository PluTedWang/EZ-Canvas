import { getFormatter, getTimeZone, getTranslations } from "next-intl/server";
import { courseSolid } from "@/components/course-color";
import { addDays, daysPerWeek, hourOfDay, sameDay, zonedParts } from "@/lib/week";
import { dayEndHour, dayStartHour } from "@/lib/study-blocks";

const hourHeight = 52;
const hours = Array.from({ length: dayEndHour - dayStartHour }, (_, i) => dayStartHour + i);

export type GridEvent = {
  id: string;
  title: string;
  start: Date;
  end: Date;
  location: string | null;
  color: number | null;
  suggested: boolean;
};

export type GridDue = { id: string; title: string; dueAt: Date; color: number; submitted: boolean; hoursLeft: number | null };

export async function WeekGrid({
  weekStart,
  now,
  events,
  due,
}: {
  weekStart: Date;
  now: Date;
  events: GridEvent[];
  due: GridDue[];
}) {
  const [t, format, timeZone] = await Promise.all([getTranslations("calendar"), getFormatter(), getTimeZone()]);
  const days = Array.from({ length: daysPerWeek }, (_, i) => addDays(weekStart, i, timeZone));
  const isToday = (day: Date) => sameDay(day, now, timeZone);
  const offsetPx = (time: Date) => ((hourOfDay(time, timeZone) - dayStartHour) * hourHeight).toFixed(1);
  const time = (value: Date) => format.dateTime(value, { hour: "numeric", minute: "2-digit" });

  return (
    <section className="grid min-w-0 grow self-start overflow-hidden rounded-card border border-border bg-surface [grid-template-columns:56px_repeat(7,minmax(0,1fr))] [grid-template-rows:56px_auto_520px]">
      <div />
      {days.map((day) => {
        const today = isToday(day);
        return (
          <div
            key={`head-${day.toISOString()}`}
            className={`flex h-14 flex-col items-center justify-center gap-[2px] border-l border-line ${today ? "bg-teal-soft" : ""}`}
          >
            <span className={`text-[12.5px] font-semibold tracking-[0.04em] uppercase ${today ? "text-teal" : "text-text-3"}`}>
              {format.dateTime(day, { weekday: "short" })}
            </span>
            {today ? (
              <span className="flex h-[30px] w-[30px] items-center justify-center rounded-chip bg-teal text-[16px] font-semibold text-white">
                {zonedParts(day, timeZone).day}
              </span>
            ) : (
              <span className="text-[18px] font-semibold">{zonedParts(day, timeZone).day}</span>
            )}
          </div>
        );
      })}

      <div className="flex items-center justify-end border-t border-b border-line pr-2 text-[12px] font-semibold text-text-3">
        {t("dueRow")}
      </div>
      {days.map((day) => (
        <div
          key={`due-${day.toISOString()}`}
          className={`flex min-h-14 flex-col gap-1 border-t border-b border-l border-line p-[6px] ${isToday(day) ? "bg-teal-soft" : ""}`}
        >
          {due
            .filter((item) => sameDay(item.dueAt, day, timeZone))
            .map((item) => (
              <span
                key={item.id}
                className={`flex flex-col gap-[1px] rounded-[7px] px-2 py-[5px] text-[13px] leading-[1.25] font-semibold ${
                  item.submitted ? "bg-neutral-soft text-text-3 line-through" : `${courseSolid(item.color)} text-white`
                }`}
              >
                <span>{item.submitted ? t("submitted", { title: item.title }) : t("dueAt", { title: item.title, time: time(item.dueAt) })}</span>
                {!item.submitted && item.hoursLeft !== null && (
                  <span className="text-[12px] font-medium opacity-85">{t("aboutLeft", { hours: item.hoursLeft })}</span>
                )}
              </span>
            ))}
        </div>
      ))}

      <div className="flex flex-col">
        {hours.map((hour) => (
          <div key={hour} className="h-[52px] pt-[2px] pr-2 text-right text-[12.5px] text-text-3">
            {format.dateTime(new Date(Date.UTC(2000, 0, 1, hour)), { hour: "numeric", timeZone: "UTC" })}
          </div>
        ))}
      </div>
      {days.map((day) => (
        <div
          key={`col-${day.toISOString()}`}
          className={`relative h-[520px] border-l border-line [background-image:repeating-linear-gradient(to_bottom,var(--ez-line)_0_1px,transparent_1px_52px)] ${
            isToday(day) ? "bg-[#F6FAF9]" : ""
          }`}
        >
          {events
            .filter((event) => sameDay(event.start, day, timeZone))
            .map((event) => (
              <div
                key={event.id}
                style={{ top: `${offsetPx(event.start)}px`, height: `${Number(offsetPx(event.end)) - Number(offsetPx(event.start))}px` }}
                className={`absolute right-1 left-1 flex flex-col gap-[1px] overflow-hidden rounded-lg px-2 py-[6px] text-[13px] leading-[1.3] ${
                  event.suggested
                    ? "border-[1.5px] border-dashed border-teal bg-[#F2F8F7] text-teal-deep"
                    : event.color
                      ? `${courseSolid(event.color)} text-white`
                      : "bg-teal text-white"
                }`}
              >
                <span className="font-semibold">{event.title}</span>
                <span className="text-[12.5px] opacity-85">
                  {[`${time(event.start)} – ${time(event.end)}`, event.location, event.suggested ? t("suggested") : null]
                    .filter(Boolean)
                    .join(" · ")}
                </span>
              </div>
            ))}
          {isToday(day) && hourOfDay(now, timeZone) >= dayStartHour && hourOfDay(now, timeZone) < dayEndHour && (
            <div aria-hidden className="absolute right-0 left-0 h-[2px] bg-danger" style={{ top: `${offsetPx(now)}px` }} />
          )}
        </div>
      ))}
    </section>
  );
}
