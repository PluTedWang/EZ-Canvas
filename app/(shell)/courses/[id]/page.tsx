import { redirect } from "next/navigation";
import { getTranslations } from "next-intl/server";
import { courseSolid } from "@/components/course-color";
import { ModuleList } from "@/components/ModuleList";
import { NotesPanel } from "@/components/NotesPanel";
import { auth } from "@/lib/auth";
import { db } from "@/lib/db";
import { isLocale, type Locale } from "@/lib/locales";
import { loadCourse } from "@/lib/materials/course-page";
import { readNotes } from "@/lib/materials/notes";
import type { MaterialNotes } from "@/lib/ai/prompts/summarize-material";

export default async function CoursePage({ params, searchParams }: PageProps<"/courses/[id]">) {
  const session = await auth();
  if (!session?.user?.id) redirect("/signin");
  const [{ id }, query] = await Promise.all([params, searchParams]);

  const [t, course, user] = await Promise.all([
    getTranslations("course"),
    loadCourse(session.user.id, id),
    db.user.findUniqueOrThrow({
      where: { id: session.user.id },
      select: { explanationLanguage: true, aiKey: true },
    }),
  ]);

  const language: Locale = isLocale(query.lang)
    ? query.lang
    : isLocale(user.explanationLanguage)
      ? user.explanationLanguage
      : "en";
  const selected = course.materials.find((m) => m.id === query.file) ?? course.materials[0] ?? null;

  // Notes already stored for this language render straight away; the hash guard lives in readNotes.
  const notes = selected
    ? (readNotes(selected.notes, selected.notesHash, selected.notesHash ?? "", language) as MaterialNotes | null)
    : null;

  const link = (file: string | null, lang: Locale) => {
    const search = new URLSearchParams();
    if (file) search.set("file", file);
    if (lang !== "en") search.set("lang", lang);
    return `/courses/${course.id}${search.size > 0 ? `?${search}` : ""}`;
  };

  const done = course.assignments.filter((a) => a.submittedAt).length;
  const subtitle = [course.instructor, course.meetingTimes, t("progress", { done, total: course.assignments.length })]
    .filter(Boolean)
    .join(" · ");

  return (
    <>
      <header className="flex flex-col gap-[10px]">
        <div className="flex items-center gap-4">
          <span className={`h-[52px] w-[6px] shrink-0 rounded-[4px] ${courseSolid(course.color)}`} />
          <div className="flex min-w-0 flex-col gap-[3px]">
            <span className="text-[14px] font-semibold tracking-[0.04em] text-teal uppercase">
              {[course.code, course.term].filter(Boolean).join(" · ")}
            </span>
            <h1 className="font-title text-[30px] leading-[1.1] tracking-[-0.01em]">{course.name}</h1>
            <span className="truncate text-[14.5px] text-text-3">{subtitle}</span>
          </div>
        </div>
      </header>

      <div className="flex min-h-0 grow gap-5">
        <ModuleList materials={course.materials} selectedId={selected?.id ?? null} href={(file) => link(file, language)} />
        {selected ? (
          <NotesPanel
            material={selected}
            notes={notes}
            language={language}
            hasKey={user.aiKey !== null}
            error={typeof query.error === "string" ? query.error : undefined}
            hrefFor={(lang) => link(selected.id, lang)}
          />
        ) : (
          <section className="flex min-w-0 grow items-start rounded-card border border-border bg-surface px-[22px] py-[18px]">
            <p className="text-[15px] text-text-3">{t("noMaterials")}</p>
          </section>
        )}
      </div>
    </>
  );
}
