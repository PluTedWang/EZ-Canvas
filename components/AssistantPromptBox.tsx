import { getTranslations } from "next-intl/server";
import { ArrowRightIcon, SparklesIcon } from "@/components/icons";
import type { Dashboard } from "@/lib/dashboard";

// "HW 2: Requirements & Use Cases" reads as "HW 2" on a chip.
const shortTitle = (title: string) => title.split(/[:·]/)[0].trim();

// Suggestions come from this week's own deadlines, so they name work the student actually has.
function suggestions(t: (key: string, values?: Record<string, string>) => string, dueSoon: Dashboard["dueSoon"]) {
  const [first, second] = dueSoon;
  return [
    first && second
      ? t("assistant.planTwo", { first: shortTitle(first.title), second: shortTitle(second.title) })
      : t("assistant.planWeek"),
    first ? t("assistant.explain", { title: shortTitle(first.title) }) : t("assistant.whatToStudy"),
    t("assistant.extension"),
  ];
}

export async function AssistantPromptBox({ dueSoon }: { dueSoon: Dashboard["dueSoon"] }) {
  const t = await getTranslations("dashboard");
  return (
    <form action="/assistant" method="get" className="flex flex-col gap-[14px] rounded-card border border-border bg-surface px-5 py-[18px]">
      <div className="flex items-center gap-[10px]">
        <span className="flex h-[30px] w-[30px] items-center justify-center rounded-[9px] bg-teal text-white">
          <SparklesIcon className="h-[17px] w-[17px]" />
        </span>
        <h2 className="text-[18px] font-semibold">{t("assistant.title")}</h2>
      </div>
      <div className="flex h-[46px] items-center gap-[10px] rounded-nav border border-control-border bg-prompt pr-2 pl-[14px]">
        <input
          type="text"
          name="q"
          placeholder={t("assistant.placeholder")}
          aria-label={t("assistant.label")}
          className="grow bg-transparent text-[15.5px] text-text outline-none"
        />
        <button
          type="submit"
          aria-label={t("assistant.send")}
          className="flex h-[34px] w-[34px] shrink-0 items-center justify-center rounded-[9px] bg-teal text-white"
        >
          <ArrowRightIcon className="h-4 w-4" />
        </button>
      </div>
      <div className="flex flex-wrap gap-2">
        {suggestions(t, dueSoon).map((suggestion) => (
          <button
            key={suggestion}
            type="submit"
            name="q"
            value={suggestion}
            className="inline-flex h-[34px] items-center rounded-chip border border-control-border bg-surface px-[14px] text-[14.5px] font-medium whitespace-nowrap hover:border-teal hover:text-teal"
          >
            {suggestion}
          </button>
        ))}
      </div>
    </form>
  );
}
