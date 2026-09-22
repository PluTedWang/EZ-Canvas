import { getTranslations } from "next-intl/server";
import { changeTone, handOff } from "@/app/(shell)/assistant/actions";
import { Button } from "@/components/Button";
import { CheckIcon, ExternalLinkIcon, MailIcon } from "@/components/icons";
import { tones, type Tone } from "@/lib/ai/prompts/assistant";
import { styleCheck, type CheckId } from "@/lib/writing/style-check";

const checkOrder: CheckId[] = ["statedOnce", "oneAsk", "noFiller"];

export async function EmailDraftCard({
  conversationId,
  draft,
  previewLanguage,
  writingLanguage,
}: {
  conversationId: string;
  draft: { tone: string; to: string; subject: string; body: string; translation: string | null; openedAt: Date | null };
  previewLanguage: string | null;
  writingLanguage: string;
}) {
  const t = await getTranslations("assistant.draft");
  const result = styleCheck(draft.body);

  return (
    <section className="flex flex-col overflow-hidden rounded-card border border-border bg-surface">
      <div className="flex flex-wrap items-center gap-3 border-b border-line px-4 py-3">
        <MailIcon className="h-[18px] w-[18px] text-teal" />
        <span className="text-[15px] font-semibold">{t("title")}</span>
        <div className="flex gap-2">
          {tones.map((tone) => (
            <form action={changeTone} key={tone}>
              <input type="hidden" name="conversationId" value={conversationId} />
              <input type="hidden" name="tone" value={tone} />
              {/* Button disables itself while the rewrite runs, so a double click does not pay twice. */}
              <Button type="submit" size="chip" variant={draft.tone === tone ? "selected" : "choice"} aria-pressed={draft.tone === tone}>
                {t(`tone.${tone as Tone}`)}
              </Button>
            </form>
          ))}
        </div>
        <span className="inline-flex h-6 items-center rounded-chip bg-teal-soft px-[9px] text-[13px] font-semibold text-teal">
          {t("style")}
        </span>
      </div>

      <div className={`grid gap-0 ${draft.translation ? "grid-cols-2" : "grid-cols-1"}`}>
        <div className="flex flex-col gap-2 px-4 py-[14px]">
          <p className="text-[13px] font-semibold text-text-3">{t("subject", { subject: draft.subject })}</p>
          <p lang={writingLanguage} className="text-[14.5px] leading-[1.6] whitespace-pre-wrap">
            {draft.body}
          </p>
        </div>
        {draft.translation && (
          <div className="flex flex-col gap-2 border-l border-line bg-ground px-4 py-[14px]">
            <p className="text-[13px] font-semibold text-text-3">{t("preview")}</p>
            <p lang={previewLanguage ?? undefined} className="text-[14.5px] leading-[1.6] whitespace-pre-wrap text-text-2">
              {draft.translation}
            </p>
          </div>
        )}
      </div>

      <div className="flex flex-wrap items-center gap-[14px] border-t border-line bg-surface-soft px-4 py-2 text-[13px] text-text-2">
        <span className="font-semibold text-text">{t("check.title")}</span>
        {checkOrder.map((id) => (
          <span key={id} className={`inline-flex items-center gap-[5px] ${result.passed[id] ? "" : "text-warn"}`}>
            {result.passed[id] ? (
              <CheckIcon strokeWidth="2.5" className="h-3 w-3 text-ok" />
            ) : (
              <span aria-hidden className="inline-block h-3 w-3 rounded-chip border-2 border-warn" />
            )}
            {t(`check.${id}${result.passed[id] ? "" : "Failed"}`)}
          </span>
        ))}
        <span className="ml-auto">{t("check.words", { words: result.words })}</span>
      </div>

      <form action={handOff} className="flex flex-wrap items-center gap-2 border-t border-line px-4 py-[10px]">
        <input type="hidden" name="conversationId" value={conversationId} />
        <label className="flex items-center gap-2 text-[13.5px] text-text-2">
          {t("to")}
          <input
            type="email"
            name="to"
            required
            defaultValue={draft.to}
            placeholder={t("toPlaceholder")}
            className="h-9 w-[260px] rounded-control border border-control-border bg-surface px-3 text-[14px] text-text outline-none"
          />
        </label>
        <Button type="submit" size="small" name="via" value="gmail">
          <ExternalLinkIcon className="h-[15px] w-[15px]" />
          {t("gmail")}
        </Button>
        <Button type="submit" size="small" variant="secondary" name="via" value="mailto">
          {t("mailApp")}
        </Button>
        <span className="ml-auto text-[13px] text-text-3">{draft.openedAt ? t("opened") : t("neverSent")}</span>
      </form>
    </section>
  );
}
