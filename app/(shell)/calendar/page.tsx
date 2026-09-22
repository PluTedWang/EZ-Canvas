import Link from "next/link";
import { redirect } from "next/navigation";
import { getFormatter, getTimeZone, getTranslations } from "next-intl/server";
import { Button } from "@/components/Button";
import { CalendarFilters, type CalendarFilter } from "@/components/CalendarFilters";
import { ExportPanel } from "@/components/ExportPanel";
import { ChevronLeftIcon, ChevronRightIcon } from "@/components/icons";
import { TimeNeededCard, type TimeNeededRow } from "@/components/TimeNeededCard";
import { TodayPanel, type TodayEntry } from "@/components/TodayPanel";
import { WeekGrid, type GridDue, type GridEvent } from "@/components/WeekGrid";
import { WeekPlanCard } from "@/components/WeekPlanCard";
import { openExport } from "./actions";
import { appOrigin } from "@/lib/app-url";
import { auth } from "@/lib/auth";
import { db } from "@/lib/db";
import { loadWeek, openWork, proposeBlocks } from "@/lib/calendar";
import { addDays, dayKey, daysBetween, daysPerWeek, parseWeekParam, sameDay, startOfWeek } from "@/lib/week";

const navButton = "flex h-9 w-9 items-center justify-center rounded-[9px] border border-border bg-surface text-text-2 hover:border-teal";

export default async function CalendarPage({ searchParams }: PageProps<"/calendar">) {
  const session = await auth();
  if (!session?.user?.id) redirect("/signin");
  const query = await searchParams;
  const now = new Date();
  const timeZone = await getTimeZone();
  const isThisWeek = (start: Date) => sameDay(start, startOfWeek(now, timeZone), timeZone);

  const weekStart = startOfWeek(parseWeekParam(query.week, timeZone, now), timeZone);
  const filter: CalendarFilter = {
    courses: typeof query.course === "string" && query.course ? query.course.split(",") : [],
    lectures: query.lectures !== "0",
    blocks: query.blocks !== "0",
  };
  const params = new URLSearchParams();
  if (!isThisWeek(weekStart)) params.set("week", dayKey(weekStart, timeZone));
  if (filter.courses.length > 0) params.set("course", filter.courses.join(","));
  if (!filter.lectures) params.set("lectures", "0");
  if (!filter.blocks) params.set("blocks", "0");

  const [t, format, week, user] = await Promise.all([
    getTranslations("calendar"),
    getFormatter(),
    loadWeek(session.user.id, weekStart, timeZone),
    db.user.findUniqueOrThrow({ where: { id: session.user.id }, select: { calendarToken: true } }),
  ]);
  const showExport = query.export === "1" && user.calendarToken !== null;
  const feedUrl = showExport ? `${await appOrigin()}/api/calendar/${user.calendarToken}` : "";
  const colorOf = new Map<string, number>(week.courses.map((c) => [c.id, c.color]));
  const visible = (courseId: string | null) => filter.courses.length === 0 || (courseId !== null && filter.courses.includes(courseId));

  const accepted = week.items.filter((item) => item.source === "study" && visible(item.courseId) && filter.blocks);
  const proposals = filter.blocks ? proposeBlocks(week, now) : [];
  const work = openWork(week, now);

  const events: GridEvent[] = [
    ...week.items
      .filter((item) => item.source === "lecture" && filter.lectures && visible(item.courseId) && item.endAt)
      .map((item) => ({
        id: item.id,
        title: item.title,
        start: item.startAt,
        end: item.endAt as Date,
        location: item.location,
        color: item.courseId ? (colorOf.get(item.courseId) ?? null) : null,
        suggested: false,
      })),
    ...accepted.map((item) => ({
      id: item.id,
      title: item.title,
      start: item.startAt,
      end: item.endAt as Date,
      location: null,
      color: null,
      suggested: false,
    })),
    ...proposals
      .filter((block) => visible(block.courseId))
      .map((block, index) => ({
        id: `proposal-${index}`,
        title: block.title,
        start: block.start,
        end: block.end,
        location: null,
        color: null,
        suggested: true,
      })),
  ];

  const weekEnd = addDays(weekStart, daysPerWeek, timeZone);
  const due: GridDue[] = week.assignments
    .filter((a) => a.dueAt && a.dueAt >= weekStart && a.dueAt < weekEnd && visible(a.courseId))
    .map((a) => ({
      id: a.id,
      title: a.title,
      dueAt: a.dueAt as Date,
      color: colorOf.get(a.courseId) ?? 1,
      submitted: a.submittedAt !== null,
      hoursLeft: work.find((w) => w.id === a.id)?.left ?? null,
    }));

  const rows: TimeNeededRow[] = work.map((item) => ({
    id: item.id,
    title: item.title,
    color: colorOf.get(item.courseId) ?? 1,
    predicted: item.prediction.hours,
    done: item.done,
    left: item.left,
    drivers: item.prediction.drivers,
  }));

  const entries: TodayEntry[] = [
    ...week.items
      .filter((item) => sameDay(item.startAt, now, timeZone) && visible(item.courseId))
      .map((item) => ({
        id: item.id,
        when: item.startAt,
        tomorrow: false,
        title: item.title,
        detail: item.location,
        past: item.endAt ? item.endAt < now : false,
      })),
    ...proposals
      .filter((block) => sameDay(block.start, now, timeZone))
      .map((block, index) => ({
        id: `today-proposal-${index}`,
        when: block.start,
        tomorrow: false,
        title: block.title,
        detail: t("today.studyBlock", { hours: (block.end.getTime() - block.start.getTime()) / 3600_000 }),
        past: false,
      })),
    ...week.assignments
      .filter((a) => a.dueAt && !a.submittedAt && daysBetween(now, a.dueAt, timeZone) === 1 && visible(a.courseId))
      .map((a) => {
        const course = week.courses.find((c) => c.id === a.courseId);
        return {
          id: `due-${a.id}`,
          when: a.dueAt as Date,
          tomorrow: true,
          title: t("today.dueTomorrow", { title: a.title, time: format.dateTime(a.dueAt as Date, { timeStyle: "short" }) }),
          detail: [course?.code, course?.latePolicy].filter(Boolean).join(" · ") || null,
          past: false,
        };
      }),
  ].sort((a, b) => a.when.getTime() - b.when.getTime());

  const weekHref = (start: Date) => {
    const next = new URLSearchParams(params);
    if (isThisWeek(start)) next.delete("week");
    else next.set("week", dayKey(start, timeZone));
    return `/calendar${next.size > 0 ? `?${next}` : ""}`;
  };

  return (
    <>
      <div className="flex items-center gap-[14px]">
        <h1 className="font-title text-[32px] tracking-[-0.01em]">{format.dateTime(weekStart, { month: "long", year: "numeric" })}</h1>
        <div className="flex gap-1">
          <Link href={weekHref(addDays(weekStart, -daysPerWeek, timeZone))} aria-label={t("previousWeek")} className={navButton}>
            <ChevronLeftIcon className="h-[18px] w-[18px]" />
          </Link>
          <Link href={weekHref(addDays(weekStart, daysPerWeek, timeZone))} aria-label={t("nextWeek")} className={navButton}>
            <ChevronRightIcon className="h-[18px] w-[18px]" />
          </Link>
        </div>
        <Link href={weekHref(startOfWeek(now, timeZone))} className="inline-flex h-9 items-center rounded-[9px] border border-control-border bg-surface px-4 text-[14.5px] font-semibold hover:border-teal">
          {t("today.label")}
        </Link>
        <div className="grow" />
        <form action={openExport}>
          <Button type="submit" variant="secondary" size="small">
            {t("export.button")}
          </Button>
        </form>
      </div>

      <CalendarFilters courses={week.courses} filter={filter} params={params} />

      <div className="flex min-h-0 grow gap-5">
        <WeekGrid weekStart={weekStart} now={now} events={events} due={due} />
        <aside className="flex w-80 shrink-0 flex-col gap-4">
          <TodayPanel now={now} entries={entries} />
          <TimeNeededCard rows={rows} />
          <WeekPlanCard blocks={proposals} weekStart={weekStart} openHours={work.reduce((total, item) => total + item.unplanned, 0)} />
          {showExport && <ExportPanel feedUrl={feedUrl} />}
        </aside>
      </div>
    </>
  );
}
