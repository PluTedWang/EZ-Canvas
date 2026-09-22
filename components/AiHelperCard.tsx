import { getTranslations } from "next-intl/server";
import { removeAiKey, saveAiKey } from "@/app/(shell)/settings/actions";
import { Button } from "@/components/Button";
import { TextField } from "@/components/TextField";
import { anthropicModels } from "@/lib/ai/anthropic";

// Only the Anthropic adapter exists today; the other providers arrive with their adapters.
export async function AiHelperCard({ keyHint, error }: { keyHint: string | null; error?: string }) {
  const t = await getTranslations("settings.ai");
  return (
    <section id="ai" className="flex flex-col rounded-card border border-border bg-surface">
      <div className="flex flex-col gap-[2px] px-5 pt-[13px] pb-[10px]">
        <h2 className="text-[18px] font-semibold">{t("title")}</h2>
        <span className="text-[14px] text-text-3">{t("intro")}</span>
      </div>
      <div className="flex flex-col gap-4 border-t border-line px-5 py-4">
        <div className="flex max-w-[280px] flex-col gap-[3px] rounded-[11px] border-2 border-teal bg-teal-soft px-[13px] py-[11px]">
          <span className="text-[15px] font-semibold">{t("anthropic")}</span>
          <span className="text-[13px] text-text-3">{keyHint !== null ? t("keyAdded", { hint: keyHint }) : t("addKey")}</span>
        </div>
        {keyHint !== null ? (
          <div className="flex flex-col gap-3">
            <p className="text-[13.5px] text-text-3">{t("model", { model: anthropicModels.writing })}</p>
            <form action={removeAiKey}>
              <Button type="submit" variant="secondary" size="small">
                {t("remove")}
              </Button>
            </form>
          </div>
        ) : (
          <form action={saveAiKey} className="flex max-w-[520px] flex-col gap-4">
            <TextField label={t("keyLabel")} help={t("keyHelp")} name="key" type="password" required autoComplete="off" />
            <div className="flex flex-col gap-2">
              <Button type="submit" size="small">
                {t("save")}
              </Button>
              {error && <p className="text-[14px] text-danger">{t(`errors.${error}`)}</p>}
            </div>
          </form>
        )}
      </div>
    </section>
  );
}
