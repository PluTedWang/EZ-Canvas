import { getFormatter, getTranslations } from "next-intl/server";
import { acceptBlocks } from "@/app/(shell)/calendar/actions";
import { Button } from "@/components/Button";
import { SparklesIcon } from "@/components/icons";
import type { StudyBlock } from "@/lib/study-blocks";

const hourMs = 60 * 60 * 1000;

export async function WeekPlanCard({ blocks, weekStart, openHours }: { blocks: StudyBlock[]; weekStart: Date; openHours: number }) {
  const [t, format] = await Promise.all([getTranslations("calendar"), getFormatter()]);
  const hours = blocks.reduce((total, b) => total + (b.end.getTime() - b.start.getTime()) / hourMs, 0);
  const first = blocks[0];

  // The rationale states what the planner actually did, so it stays true without an AI call.
  const rationale =
    blocks.length > 0
      ? t("plan.rationale", { blocks: blocks.length, hours, first: first.title, day: format.dateTime(first.start, { weekday: "long" }) })
      : openHours > 0
        ? t("plan.noRoom", { hours: openHours })
        : t("plan.nothing");

  return (
    <section className="flex flex-col gap-[10px] rounded-card border border-teal-border bg-surface px-5 py-4">
      <div className="flex items-center gap-[10px]">
        <span className="flex h-7 w-7 items-center justify-center rounded-lg bg-teal text-white">
          <SparklesIcon className="h-[15px] w-[15px]" />
        </span>
        <h2 className="text-[16px] font-semibold">{t("plan.title")}</h2>
      </div>
      <p className="text-[14.5px] leading-[1.5]">{rationale}</p>
      {blocks.length > 0 && (
        <form action={acceptBlocks} className="flex flex-col">
          <input type="hidden" name="week" value={weekStart.toISOString()} />
          <Button type="submit" size="small">
            {t("plan.add")}
          </Button>
        </form>
      )}
    </section>
  );
}
