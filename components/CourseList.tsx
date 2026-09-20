import { getFormatter, getTranslations } from "next-intl/server";
import { Card, cardRowClass, EmptyRow } from "@/components/Card";
import { courseSolid } from "@/components/course-color";
import type { Dashboard } from "@/lib/dashboard";

// The last four characters of "SYSEN 5100" are the course number shown on the tile.
const tileNumber = (code: string) => code.replace(/\D/g, "").slice(-4) || code.slice(0, 4);

export async function CourseList({ courses, term }: { courses: Dashboard["courses"]; term: string | null }) {
  const [t, format] = await Promise.all([getTranslations("dashboard"), getFormatter()]);
  return (
    <Card title={t("courses.title")} aside={term ? <span className="text-[14px] text-text-3">{term}</span> : undefined} grow>
      {courses.length === 0 && <EmptyRow>{t("courses.empty")}</EmptyRow>}
      {courses.map((course) => {
        const percent = course.total > 0 ? Math.round((course.done / course.total) * 100) : 0;
        const meta = course.next
          ? t("courses.next", {
              code: course.code,
              title: course.next.title,
              date: format.dateTime(course.next.dueAt, { weekday: "short", month: "short", day: "numeric" }),
            })
          : t("courses.progress", { code: course.code, done: course.done, total: course.total });
        return (
          <div key={course.id} className={cardRowClass}>
            <span
              className={`flex h-9 w-9 shrink-0 items-center justify-center rounded-control text-[12px] font-bold text-white ${courseSolid(course.color)}`}
            >
              {tileNumber(course.code)}
            </span>
            <span className="flex min-w-0 grow flex-col gap-[3px]">
              <span className="truncate text-[15.5px] font-semibold">{course.name}</span>
              <span className="truncate text-[13.5px] text-text-3">{meta}</span>
            </span>
            <span
              className="block h-[6px] w-[72px] shrink-0 overflow-hidden rounded-chip bg-line"
              role="img"
              aria-label={t("courses.progress", { code: course.code, done: course.done, total: course.total })}
            >
              <span className={`block h-full ${courseSolid(course.color)}`} style={{ width: `${percent}%` }} />
            </span>
          </div>
        );
      })}
    </Card>
  );
}
