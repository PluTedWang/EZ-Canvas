import { getFormatter, getTranslations } from "next-intl/server";

export type TodayEntry = { id: string; when: Date; tomorrow: boolean; title: string; detail: string | null; past: boolean };

export async function TodayPanel({ now, entries }: { now: Date; entries: TodayEntry[] }) {
  const [t, format] = await Promise.all([getTranslations("calendar"), getFormatter()]);
  return (
    <section className="flex flex-col gap-[14px] rounded-card border border-border bg-surface px-5 py-[18px]">
      <div className="flex flex-col gap-[2px]">
        <span className="text-[13.5px] font-semibold tracking-[0.04em] text-teal uppercase">{t("today.label")}</span>
        <h2 className="font-title text-[24px]">{format.dateTime(now, { weekday: "long", month: "long", day: "numeric" })}</h2>
      </div>
      {entries.length === 0 && <p className="text-[14px] text-text-3">{t("today.empty")}</p>}
      <div className="flex flex-col gap-[10px]">
        {entries.map((entry) => (
          <div key={entry.id} className="flex items-start gap-3">
            <span
              className={`w-[54px] shrink-0 pt-[2px] text-[13.5px] ${entry.tomorrow ? "font-semibold text-warn" : "text-text-3"}`}
            >
              {entry.tomorrow ? t("today.tomorrow") : format.dateTime(entry.when, { hour: "numeric", minute: "2-digit" })}
            </span>
            <span className="flex min-w-0 flex-col gap-[2px]">
              <span className={`text-[15px] font-semibold ${entry.past ? "text-text-3 line-through" : ""}`}>{entry.title}</span>
              {entry.detail && <span className="text-[13.5px] text-text-3">{entry.detail}</span>}
            </span>
          </div>
        ))}
      </div>
    </section>
  );
}
