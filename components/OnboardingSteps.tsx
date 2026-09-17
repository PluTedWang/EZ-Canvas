import { getTranslations } from "next-intl/server";
import { CheckIcon } from "@/components/icons";
import { Wordmark } from "@/components/Wordmark";

type State = "done" | "current" | "upcoming";

function Marker({ state, number }: { state: State; number: number }) {
  if (state === "done") {
    return (
      <span className="flex h-7 w-7 items-center justify-center rounded-chip bg-ok text-white">
        <CheckIcon strokeWidth="2.25" className="h-4 w-4" />
      </span>
    );
  }
  const style =
    state === "current"
      ? "bg-teal text-white"
      : "border-[1.5px] border-control-border text-text-3";
  return (
    <span className={`flex h-7 w-7 items-center justify-center rounded-chip text-[14px] font-bold ${style}`}>
      {number}
    </span>
  );
}

export async function OnboardingSteps({ current, details }: { current: 1 | 2 | 3; details: string[] }) {
  const t = await getTranslations("onboarding");
  const steps = [t("steps.connect"), t("steps.language"), t("steps.ai")];
  return (
    <aside className="flex w-[480px] shrink-0 flex-col justify-between border-r border-border bg-track px-14 pt-14 pb-12">
      <div className="flex flex-col gap-10">
        <Wordmark />
        <div className="flex flex-col gap-[14px]">
          <h1 className="font-title text-[44px] leading-[1.08] tracking-[-0.01em]">{t("headline")}</h1>
          <p className="text-[17px] leading-[1.55] text-text-2">{t("intro")}</p>
        </div>
        <ol className="flex flex-col gap-[6px]">
          {steps.map((label, index) => {
            const number = index + 1;
            const state: State = number < current ? "done" : number === current ? "current" : "upcoming";
            return (
              <li
                key={label}
                aria-current={state === "current" ? "step" : undefined}
                className={`flex h-12 items-center gap-[14px] rounded-control px-3 ${state === "current" ? "bg-surface shadow-1" : ""}`}
              >
                <Marker state={state} number={number} />
                <span className="flex flex-col">
                  <span className={`text-[16px] font-semibold ${state === "upcoming" ? "text-text-2" : ""}`}>{label}</span>
                  <span className="text-[13.5px] text-text-3">{details[index]}</span>
                </span>
              </li>
            );
          })}
        </ol>
      </div>
      <p className="text-[13.5px] leading-[1.5] text-text-3">{t("privacy")}</p>
    </aside>
  );
}
