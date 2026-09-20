import { getFormatter, getTranslations } from "next-intl/server";
import { courseSolid } from "@/components/course-color";
import { submissionTypeLabel } from "@/components/submission-type";
import type { Driver } from "@/lib/predict";

export type TimeNeededRow = {
  id: string;
  title: string;
  color: number;
  predicted: number;
  done: number;
  left: number;
  drivers: Driver[];
};

export async function TimeNeededCard({ rows }: { rows: TimeNeededRow[] }) {
  const [t, format] = await Promise.all([getTranslations("calendar"), getFormatter()]);
  const left = rows.reduce((total, row) => total + row.left, 0);

  // One basis line for the card, naming every driver that moved any of these predictions.
  const driverKeys = [...new Set(rows.flatMap((row) => row.drivers.map((d) => d.key)))];
  const dashboard = await getTranslations("dashboard");
  const basis = t("timeNeeded.basis", {
    drivers: format.list(driverKeys.map((key) => t(`timeNeeded.driver.${key}`))),
  });

  return (
    <section className="flex flex-col gap-3 rounded-card border border-border bg-surface px-5 py-4">
      <div className="flex items-center justify-between gap-3">
        <h2 className="text-[16px] font-semibold">{t("timeNeeded.title")}</h2>
        <span className="text-[13.5px] text-text-3">{t("timeNeeded.left", { hours: left })}</span>
      </div>
      {rows.length === 0 && <p className="text-[14px] text-text-3">{t("timeNeeded.empty")}</p>}
      <div className="flex flex-col gap-[10px]">
        {rows.map((row) => {
          const percent = row.predicted > 0 ? Math.min(Math.round((row.done / row.predicted) * 100), 100) : 0;
          const detail = row.drivers
            .map((d) => dashboard(`driver.${d.key}`, { value: d.key === "type" ? submissionTypeLabel(dashboard, d.value) : d.value }))
            .join(", ");
          return (
            <div key={row.id} className="flex flex-col gap-[5px]">
              <div className="flex items-center gap-2 text-[14px]">
                <span className={`h-[9px] w-[9px] shrink-0 rounded-chip ${courseSolid(row.color)}`} />
                <span className="min-w-0 grow truncate font-semibold">{row.title}</span>
                <span className="shrink-0 text-text-2" title={detail}>
                  {row.done > 0 ? t("timeNeeded.leftOf", { left: row.left, predicted: row.predicted }) : t("timeNeeded.about", { hours: row.predicted })}
                </span>
              </div>
              <span className="block h-[6px] overflow-hidden rounded-chip bg-line">
                <span className={`block h-full ${courseSolid(row.color)}`} style={{ width: `${percent}%` }} />
              </span>
            </div>
          );
        })}
      </div>
      {rows.length > 0 && <p className="text-[13px] leading-[1.45] text-text-3">{basis}</p>}
    </section>
  );
}
