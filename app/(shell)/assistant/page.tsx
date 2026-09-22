import Link from "next/link";
import { redirect } from "next/navigation";
import { getFormatter, getTranslations } from "next-intl/server";
import { Button } from "@/components/Button";
import { EmailDraftCard } from "@/components/EmailDraftCard";
import { SparklesIcon } from "@/components/icons";
import type { Fact } from "@/lib/ai/prompts/assistant";
import { auth } from "@/lib/auth";
import { db } from "@/lib/db";
import { startConversation } from "./actions";

const situations = ["missedDeadline", "extension", "grade", "absence", "officeHours", "groupMember", "other"] as const;
const field = "h-10 rounded-control border border-control-border bg-surface px-3 text-[15px] text-text";

export default async function AssistantPage({ searchParams }: PageProps<"/assistant">) {
  const session = await auth();
  if (!session?.user?.id) redirect("/signin");
  const query = await searchParams;
  const situation = situations.find((s) => s === query.situation) ?? "missedDeadline";
  const error = typeof query.error === "string" ? query.error : undefined;

  const [t, format, user, courses, recent] = await Promise.all([
    getTranslations("assistant"),
    getFormatter(),
    db.user.findUniqueOrThrow({
      where: { id: session.user.id },
      select: { aiKey: true, writingLanguage: true, explanationLanguage: true },
    }),
    db.course.findMany({
      where: { userId: session.user.id, hidden: false },
      orderBy: { canvasId: "asc" },
      select: { id: true, code: true, assignments: { orderBy: { dueAt: "desc" }, select: { id: true, title: true } } },
    }),
    db.conversation.findMany({
      where: { userId: session.user.id, kind: "assistant" },
      orderBy: { createdAt: "desc" },
      take: 8,
      select: { id: true, title: true, createdAt: true, draft: { select: { openedAt: true } } },
    }),
  ]);

  const open =
    typeof query.c === "string"
      ? await db.conversation.findFirst({
          where: { id: query.c, userId: session.user.id },
          include: { messages: { orderBy: { createdAt: "asc" } }, draft: true, course: { select: { code: true } } },
        })
      : null;

  return (
    <>
      <h1 className="font-title text-[32px] tracking-[-0.01em]">{t("title")}</h1>
      <div className="flex min-h-0 grow gap-5">
        <aside className="flex w-[260px] shrink-0 flex-col gap-1 self-start">
          <span className="px-3 pb-2 text-[13px] font-semibold tracking-[0.06em] text-text-3 uppercase">{t("situations")}</span>
          {situations.map((name) => (
            <Link
              key={name}
              href={`/assistant?situation=${name}`}
              aria-current={!open && name === situation ? "true" : undefined}
              className={`flex h-10 items-center rounded-control px-3 text-[15px] ${
                !open && name === situation ? "bg-teal-soft font-semibold text-teal-deep" : "text-text hover:bg-row-hover"
              }`}
            >
              {t(`situation.${name}`)}
            </Link>
          ))}
          {recent.length > 0 && (
            <>
              <span className="px-3 pt-4 pb-2 text-[13px] font-semibold tracking-[0.06em] text-text-3 uppercase">{t("recent")}</span>
              {recent.map((item) => (
                <Link
                  key={item.id}
                  href={`/assistant?c=${item.id}`}
                  aria-current={open?.id === item.id ? "true" : undefined}
                  className={`flex flex-col gap-[2px] rounded-control px-3 py-2 ${
                    open?.id === item.id ? "bg-teal-soft" : "hover:bg-row-hover"
                  }`}
                >
                  <span className="truncate text-[14.5px] font-semibold text-text">{item.title}</span>
                  <span className="text-[13px] text-text-3">
                    {format.dateTime(item.createdAt, { month: "short", day: "numeric" })} ·{" "}
                    {item.draft?.openedAt ? t("status.opened") : t("status.draft")}
                  </span>
                </Link>
              ))}
            </>
          )}
        </aside>

        <div className="flex min-w-0 grow flex-col gap-4">
          {open ? (
            <>
              {open.messages.map((message) => {
                const sources = Array.isArray(message.sources) ? (message.sources as unknown as Fact[]) : [];
                return message.role === "user" ? (
                  <p key={message.id} className="self-end rounded-card bg-teal-soft px-4 py-3 text-[15px] text-text">
                    {message.body}
                  </p>
                ) : (
                  <div key={message.id} className="flex gap-3">
                    <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-[9px] bg-teal text-white">
                      <SparklesIcon className="h-4 w-4" />
                    </span>
                    <div className="flex min-w-0 flex-col gap-2">
                      <p lang={message.language} className="text-[15.5px] leading-[1.6]">
                        {message.body}
                      </p>
                      {sources.length > 0 && (
                        <div className="flex flex-wrap gap-2">
                          {sources.map((source) => (
                            <span
                              key={source.label}
                              title={source.text}
                              className="inline-flex h-6 items-center rounded-chip border border-border bg-surface px-[9px] text-[13px] font-semibold text-text-2"
                            >
                              {source.label}
                            </span>
                          ))}
                        </div>
                      )}
                    </div>
                  </div>
                );
              })}
              {error && <p className="text-[15px] text-danger">{t(`errors.${error}`)}</p>}
              {open.draft && (
                <EmailDraftCard
                  conversationId={open.id}
                  draft={open.draft}
                  previewLanguage={user.explanationLanguage}
                  writingLanguage={user.writingLanguage}
                />
              )}
            </>
          ) : (
            <form action={startConversation} className="flex max-w-[680px] flex-col gap-4 rounded-card border border-border bg-surface p-5">
              <input type="hidden" name="situation" value={situation} />
              <div className="flex flex-col gap-1">
                <h2 className="text-[18px] font-semibold">{t(`situation.${situation}`)}</h2>
                <p className="text-[14px] text-text-3">{t("intro")}</p>
              </div>
              <label className="flex flex-col gap-[6px]">
                <span className="text-[14px] font-semibold">{t("course")}</span>
                <select name="courseId" className={field} defaultValue="">
                  <option value="">{t("noCourse")}</option>
                  {courses.map((course) => (
                    <option key={course.id} value={course.id}>
                      {course.code}
                    </option>
                  ))}
                </select>
              </label>
              <label className="flex flex-col gap-[6px]">
                <span className="text-[14px] font-semibold">{t("assignment")}</span>
                <select name="assignmentId" className={field} defaultValue="">
                  <option value="">{t("noAssignment")}</option>
                  {courses.map((course) => (
                    <optgroup key={course.id} label={course.code}>
                      {course.assignments.map((assignment) => (
                        <option key={assignment.id} value={assignment.id}>
                          {assignment.title}
                        </option>
                      ))}
                    </optgroup>
                  ))}
                </select>
              </label>
              <label className="flex flex-col gap-[6px]">
                <span className="text-[14px] font-semibold">{t("what")}</span>
                <textarea
                  name="question"
                  required
                  rows={4}
                  defaultValue={typeof query.q === "string" ? query.q : ""}
                  placeholder={t("whatPlaceholder")}
                  className="rounded-control border border-control-border bg-prompt p-3 text-[15px] text-text outline-none"
                />
              </label>
              <div className="flex flex-col items-start gap-2">
                {user.aiKey ? (
                  <Button type="submit">{t("write")}</Button>
                ) : (
                  <Link href="/settings#ai" className="text-[15px] font-semibold text-teal">
                    {t("needKey")}
                  </Link>
                )}
                {error && <p className="text-[14.5px] text-danger">{t(`errors.${error}`)}</p>}
              </div>
            </form>
          )}
        </div>
      </div>
    </>
  );
}
