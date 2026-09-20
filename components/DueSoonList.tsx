import { getFormatter, getTranslations } from "next-intl/server";
import { Card, cardRowClass, EmptyRow } from "@/components/Card";
import { courseSolid } from "@/components/course-color";
import { ClockIcon } from "@/components/icons";
import type { Dashboard } from "@/lib/dashboard";
import { dueSoonDays } from "@/lib/dashboard";
import { dueChip, type DueTone } from "@/lib/due";
import { submissionTypeLabel } from "@/components/submission-type";

const toneClass: Record<DueTone, string> = {
  danger: "bg-danger-soft text-danger",
  warn: "bg-warn-soft text-warn",
  neutral: "bg-neutral-soft text-text-2",
};

export async function DueSoonList({ items, now }: { items: Dashboard["dueSoon"]; now: Date }) {
  const [t, format] = await Promise.all([getTranslations("dashboard"), getFormatter()]);

  const hours = items.reduce((total, item) => total + item.prediction.hours, 0);
  const label = (item: Dashboard["dueSoon"][number]) => {
    const { label: kind } = dueChip(item.dueAt, now);
    const time = format.dateTime(item.dueAt, { timeStyle: "short" });
    if (kind === "overdue") return t("dueSoon.overdue", { ago: format.relativeTime(item.dueAt, now) });
    if (kind === "today") return t("dueSoon.today", { time });
    if (kind === "tomorrow") return t("dueSoon.tomorrow", { time });
    return format.dateTime(item.dueAt, { weekday: "short", month: "short", day: "numeric" });
  };

  return (
    <Card
      title={t("dueSoon.title")}
      aside={
        items.length > 0 ? (
          <span className="text-[14px] text-text-3">
            {t.rich("dueSoon.total", { hours, strong: (c) => <span className="font-semibold text-text">{c}</span> })}
          </span>
        ) : undefined
      }
    >
      {items.length === 0 && <EmptyRow>{t("dueSoon.empty", { days: dueSoonDays })}</EmptyRow>}
      {items.map((item) => {
        const { tone } = dueChip(item.dueAt, now);
        const meta = [item.courseCode, item.points ? t("points", { points: item.points }) : null, submissionTypeLabel(t, item.submissionType)]
          .filter(Boolean)
          .join(" · ");
        const basis = t("basis", {
          drivers: format.list(
            item.prediction.drivers.map((d) =>
              t(`driver.${d.key}`, { value: d.key === "type" ? submissionTypeLabel(t, d.value) : d.value }),
            ),
          ),
        });
        return (
          <div key={item.id} className={cardRowClass}>
            <span className={`h-10 w-1 shrink-0 rounded-[4px] ${courseSolid(item.color)}`} />
            <span className="flex min-w-0 grow flex-col gap-[3px]">
              <a href={item.htmlUrl} className="truncate text-[16px] font-semibold text-text hover:text-teal">
                {item.title}
              </a>
              <span className="truncate text-[14px] text-text-3">{meta}</span>
            </span>
            <span className={`inline-flex h-[26px] shrink-0 items-center gap-[6px] rounded-chip px-[10px] text-[13.5px] font-semibold ${toneClass[tone]}`}>
              <ClockIcon className="h-[14px] w-[14px]" />
              {label(item)}
            </span>
            <span title={basis} className="w-[132px] shrink-0 text-right text-[14px] text-text-2">
              {t("dueSoon.about", { hours: item.prediction.hours })}
            </span>
          </div>
        );
      })}
    </Card>
  );
}
