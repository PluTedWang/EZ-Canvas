import { getFormatter, getTimeZone, getTranslations } from "next-intl/server";
import { AssistantPromptBox } from "@/components/AssistantPromptBox";
import { LinkButton } from "@/components/Button";
import { CourseList } from "@/components/CourseList";
import { DueSoonList } from "@/components/DueSoonList";
import { CalendarIcon } from "@/components/icons";
import { MaterialList } from "@/components/MaterialList";
import { TopBar } from "@/components/TopBar";
import { dueSoonDays, loadDashboard } from "@/lib/dashboard";
import { requireUser } from "@/lib/session";
import { zonedParts } from "@/lib/week";

const timeOfDay = (hour: number) => (hour < 12 ? "morning" : hour < 18 ? "afternoon" : "evening");

export default async function DashboardPage() {
  const user = await requireUser();
  const now = new Date();
  const [t, format, timeZone, data] = await Promise.all([
    getTranslations("dashboard"),
    getFormatter(),
    getTimeZone(),
    loadDashboard(user.id),
  ]);
  const connection = user.connections[0];
  const firstName = (user.name ?? user.email).split(" ")[0];
  const strong = (chunks: React.ReactNode) => <span className="font-semibold text-text">{chunks}</span>;

  return (
    <>
      <TopBar status={connection?.status ?? "error"} lastSyncAt={connection?.lastSyncAt ?? null} now={now} />

      <div className="flex items-end justify-between gap-6">
        <div className="flex flex-col gap-[6px]">
          <h1 className="font-title text-[36px] leading-[1.1] tracking-[-0.01em]">
            {t(`greeting.${timeOfDay(zonedParts(now, timeZone).hour)}`, { name: firstName })}
          </h1>
          <p className="text-[16px] text-text-2">
            {format.dateTime(now, { weekday: "long", month: "long", day: "numeric" })} ·{" "}
            {t.rich("greeting.counts", {
              deadlines: data.counts.deadlines,
              days: dueSoonDays,
              hours: data.counts.hours,
              materials: data.counts.materials,
              strong,
            })}
          </p>
        </div>
        <LinkButton href="/calendar" variant="secondary">
          <CalendarIcon className="h-[18px] w-[18px]" />
          {t("openCalendar")}
        </LinkButton>
      </div>

      <div className="grid min-h-0 grow gap-5 [grid-template-columns:minmax(0,8fr)_minmax(0,5fr)]">
        <div className="flex min-w-0 flex-col gap-5">
          <DueSoonList items={data.dueSoon} now={now} />
          <MaterialList items={data.materials} now={now} />
        </div>
        <div className="flex min-w-0 flex-col gap-5">
          <AssistantPromptBox dueSoon={data.dueSoon} />
          <CourseList courses={data.courses} term={data.term} />
        </div>
      </div>
    </>
  );
}
