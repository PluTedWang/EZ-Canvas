import Link from "next/link";
import { getTranslations } from "next-intl/server";
import { courseSolid } from "@/components/course-color";

export type CalendarFilter = { courses: string[]; lectures: boolean; blocks: boolean };

const chipBase = "inline-flex h-8 items-center gap-[7px] rounded-chip border px-3 text-[14px] font-semibold whitespace-nowrap";
const on = "border-control-border bg-surface text-text";
const off = "border-control-border bg-transparent text-text-3";

// Filters are links so the week survives a reload and can be shared; no client state involved.
function href(params: URLSearchParams, key: string, value: string | null) {
  const next = new URLSearchParams(params);
  if (value === null) next.delete(key);
  else next.set(key, value);
  return `/calendar${next.size > 0 ? `?${next}` : ""}`;
}

export async function CalendarFilters({
  courses,
  filter,
  params,
}: {
  courses: { id: string; code: string; color: number }[];
  filter: CalendarFilter;
  params: URLSearchParams;
}) {
  const t = await getTranslations("calendar");
  const shown = (id: string) => filter.courses.length === 0 || filter.courses.includes(id);

  return (
    <div className="flex flex-wrap items-center gap-2">
      {courses.map((course) => {
        const active = shown(course.id);
        const rest = courses.filter((c) => c.id !== course.id && shown(c.id)).map((c) => c.id);
        const nextCourses = active ? rest : [...courses.filter((c) => shown(c.id)).map((c) => c.id), course.id];
        return (
          <Link
            key={course.id}
            href={href(params, "course", nextCourses.length === courses.length ? null : nextCourses.join(","))}
            aria-pressed={active}
            className={`${chipBase} ${active ? on : off}`}
          >
            <span className={`h-[9px] w-[9px] rounded-chip ${active ? courseSolid(course.color) : "bg-switch-off"}`} />
            {course.code}
          </Link>
        );
      })}
      <span className="mx-1 h-[22px] w-px bg-control-border" />
      <Link href={href(params, "lectures", filter.lectures ? "0" : null)} aria-pressed={filter.lectures} className={`${chipBase} ${filter.lectures ? on : off}`}>
        {t("filters.lectures")}
      </Link>
      <Link
        href={href(params, "blocks", filter.blocks ? "0" : null)}
        aria-pressed={filter.blocks}
        className={`${chipBase} border-dashed ${filter.blocks ? "border-teal text-teal" : off}`}
      >
        {t("filters.blocks")}
      </Link>
    </div>
  );
}
