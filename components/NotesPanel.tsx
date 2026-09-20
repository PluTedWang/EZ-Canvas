import Link from "next/link";
import { getTranslations } from "next-intl/server";
import { generateNotes } from "@/app/(shell)/courses/actions";
import { Button } from "@/components/Button";
import { ExternalLinkIcon } from "@/components/icons";
import type { MaterialNotes } from "@/lib/ai/prompts/summarize-material";
import type { CourseMaterial } from "@/lib/materials/course-page";
import { locales, type Locale } from "@/lib/locales";

const segment = "h-[30px] rounded-[7px] px-3 text-[14px] font-semibold whitespace-nowrap";

export async function NotesPanel({
  material,
  notes,
  language,
  hasKey,
  error,
  hrefFor,
}: {
  material: CourseMaterial;
  notes: MaterialNotes | null;
  language: Locale;
  hasKey: boolean;
  error?: string;
  hrefFor: (language: Locale) => string;
}) {
  const [t, tLocale] = await Promise.all([getTranslations("course"), getTranslations("locale")]);
  const quizCount = notes?.points.filter((point) => point.quiz).length ?? 0;

  return (
    <section className="flex min-w-0 grow flex-col self-start overflow-hidden rounded-card border border-border bg-surface">
      <div className="flex items-center gap-[14px] border-b border-line px-[22px] pt-4 pb-[14px]">
        <div className="flex min-w-0 grow flex-col gap-[3px]">
          <h2 className="truncate text-[19px] font-semibold">{material.title}</h2>
          <span className="text-[14px] text-text-3">
            {notes ? t("notesFrom", { count: notes.points.length }) : t("notYetSummarized")}
          </span>
        </div>
        <div className="flex gap-[2px] rounded-[9px] bg-track p-[3px]">
          {locales.map((code) => (
            <Link
              key={code}
              href={hrefFor(code)}
              lang={code}
              aria-current={code === language ? "true" : undefined}
              className={`${segment} flex items-center ${code === language ? "bg-surface text-text shadow-1" : "text-text-2"}`}
            >
              {tLocale(code === "en" ? "english" : "chinese")}
            </Link>
          ))}
        </div>
        <a
          href={material.url}
          target="_blank"
          rel="noreferrer"
          className="inline-flex h-9 shrink-0 items-center gap-2 rounded-[9px] border border-control-border bg-surface px-[14px] text-[14.5px] font-semibold text-text hover:border-teal"
        >
          <ExternalLinkIcon className="h-[15px] w-[15px]" />
          {t("openOriginal")}
        </a>
      </div>

      <div className="flex flex-col gap-[18px] px-[22px] py-[18px]">
        {material.unsupported && <p className="text-[15px] text-text-2">{t("unsupported", { kind: material.unsupported })}</p>}
        {error && <p className="text-[15px] text-danger">{t(`errors.${error}`)}</p>}

        {!notes && !material.unsupported && (
          <div className="flex flex-col items-start gap-3">
            <p className="text-[15px] text-text-2">{hasKey ? t("generateIntro") : t("needKey")}</p>
            {hasKey ? (
              <form action={generateNotes}>
                <input type="hidden" name="materialId" value={material.id} />
                <input type="hidden" name="language" value={language} />
                <Button type="submit" size="small">
                  {t("generate")}
                </Button>
              </form>
            ) : (
              <Link href="/settings#ai" className="text-[15px] font-semibold text-teal">
                {t("openSettings")}
              </Link>
            )}
          </div>
        )}

        {notes && (
          <>
            <div className="flex flex-col gap-[10px]">
              <div className="flex items-center gap-[10px]">
                <h3 className="text-[14px] font-semibold tracking-[0.06em] text-text-3 uppercase">{t("covers")}</h3>
                {quizCount > 0 && (
                  <span className="inline-flex h-6 items-center rounded-chip bg-course-2-soft px-[9px] text-[13px] font-semibold text-course-2">
                    {t("quizFlagged", { count: quizCount })}
                  </span>
                )}
              </div>
              {notes.points.map((point, index) => (
                <div key={point.text} className="flex items-start gap-3 text-[15.5px] leading-[1.5]">
                  <span className="mt-[1px] flex h-[22px] w-[22px] shrink-0 items-center justify-center rounded-chip bg-teal-soft text-[13px] font-bold text-teal">
                    {index + 1}
                  </span>
                  <span lang={language}>
                    {point.text}
                    {point.quiz && (
                      <span
                        title={point.evidence ?? undefined}
                        className="ml-1 inline-flex h-6 items-center rounded-chip bg-course-2-soft px-[9px] text-[13px] font-semibold text-course-2"
                      >
                        {t("quiz")}
                      </span>
                    )}
                  </span>
                </div>
              ))}
            </div>

            {notes.terms.length > 0 && (
              <div className="flex flex-col gap-[10px]">
                <h3 className="text-[14px] font-semibold tracking-[0.06em] text-text-3 uppercase">{t("keyTerms")}</h3>
                <div className="grid grid-cols-3 gap-[10px]">
                  {notes.terms.map((term) => (
                    <div key={term.term} className="flex flex-col gap-[3px] rounded-control border border-line bg-ground px-3 py-[10px]">
                      <span className="text-[15px] font-semibold">{term.term}</span>
                      {term.translation && (
                        <span lang={language} className="text-[14px] font-medium text-teal">
                          {term.translation}
                        </span>
                      )}
                      <span lang={language} className="text-[13.5px] leading-[1.4] text-text-2">
                        {term.definition}
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </>
        )}
      </div>
    </section>
  );
}
