"use server";

import { redirect } from "next/navigation";
import { requireProvider } from "@/lib/ai";
import { draftForSituation, tones, type Tone } from "@/lib/ai/prompts/assistant";
import { translate } from "@/lib/ai/prompts/translate";
import { AiError } from "@/lib/ai/types";
import { buildFacts, loadContext } from "@/lib/assistant/facts";
import { gmailUrl, mailtoUrl } from "@/lib/email/handoff";
import { auth } from "@/lib/auth";
import { db } from "@/lib/db";
import { languageName } from "@/lib/locales";

async function userId() {
  const session = await auth();
  if (!session?.user?.id) redirect("/signin");
  return session.user.id;
}

const isTone = (value: string): value is Tone => tones.includes(value as Tone);
// Dates reach the email as the student reads them: their own zone, named, so the professor can check it.
const factDate = (timeZone: string) => {
  const format = new Intl.DateTimeFormat("en-US", {
    timeZone,
    weekday: "long",
    month: "long",
    day: "numeric",
    year: "numeric",
    hour: "numeric",
    minute: "2-digit",
    timeZoneName: "short",
  });
  return (date: Date) => format.format(date);
};

// Writes the advice and the email, grounded only in the Canvas facts gathered here.
async function writeDraft(id: string, situation: string, question: string, tone: Tone, courseId: string | null, assignmentId: string | null) {
  const [user, provider, context] = await Promise.all([
    db.user.findUniqueOrThrow({ where: { id }, select: { name: true, email: true, writingLanguage: true, explanationLanguage: true, timeZone: true } }),
    requireProvider(id),
    loadContext(id, courseId, assignmentId),
  ]);
  const facts = buildFacts(context.course, context.assignment, factDate(user.timeZone));
  const draft = await draftForSituation(provider, {
    situation,
    question,
    facts,
    tone,
    writingLanguage: languageName(user.writingLanguage),
    studentName: user.name ?? user.email,
  });
  // The preview only exists when the student reads in a different language from the one they write in.
  const translation =
    user.explanationLanguage !== user.writingLanguage && draft.body
      ? await translate(provider, draft.body, languageName(user.explanationLanguage))
      : null;
  return { draft, facts, translation, user, context };
}

export async function startConversation(formData: FormData) {
  const id = await userId();
  const situation = String(formData.get("situation") ?? "other");
  const question = String(formData.get("question") ?? "").trim();
  const courseId = String(formData.get("courseId") ?? "") || null;
  const assignmentId = String(formData.get("assignmentId") ?? "") || null;
  if (!question) redirect(`/assistant?situation=${situation}&error=missing`);

  let result;
  try {
    result = await writeDraft(id, situation, question, "formal", courseId, assignmentId);
  } catch (error) {
    redirect(`/assistant?situation=${situation}&error=${error instanceof AiError ? error.kind : "request"}`);
  }

  const conversation = await db.conversation.create({
    data: {
      userId: id,
      kind: "assistant",
      situation,
      courseId: result.context.course?.id ?? null,
      assignmentId: result.context.assignment?.id ?? null,
      title: result.draft.subject || question.slice(0, 60),
      messages: {
        create: [
          { role: "user", body: question, language: result.user.writingLanguage },
          { role: "assistant", body: result.draft.advice, language: result.user.explanationLanguage, sources: result.facts },
        ],
      },
      draft: {
        create: {
          tone: "formal",
          to: "",
          subject: result.draft.subject,
          body: result.draft.body,
          translation: result.translation,
        },
      },
    },
  });
  redirect(`/assistant?c=${conversation.id}`);
}

export async function changeTone(formData: FormData) {
  const id = await userId();
  const conversationId = String(formData.get("conversationId") ?? "");
  const tone = String(formData.get("tone") ?? "");
  if (!isTone(tone)) redirect("/assistant");

  const conversation = await db.conversation.findFirstOrThrow({
    where: { id: conversationId, userId: id },
    include: { messages: { where: { role: "user" }, take: 1 }, draft: true },
  });
  const back = `/assistant?c=${conversation.id}`;

  let result;
  try {
    result = await writeDraft(id, conversation.situation ?? "other", conversation.messages[0]?.body ?? "", tone, conversation.courseId, conversation.assignmentId);
  } catch (error) {
    redirect(`${back}&error=${error instanceof AiError ? error.kind : "request"}`);
  }
  await db.emailDraft.update({
    where: { conversationId: conversation.id },
    data: { tone, subject: result.draft.subject, body: result.draft.body, translation: result.translation },
  });
  redirect(back);
}

// Hands the finished draft to the student's own mail client and records that it left EZCanvas.
// EZCanvas never sends the mail; the student presses send themselves.
export async function handOff(formData: FormData) {
  const id = await userId();
  const conversationId = String(formData.get("conversationId") ?? "");
  const to = String(formData.get("to") ?? "").trim();
  const conversation = await db.conversation.findFirstOrThrow({
    where: { id: conversationId, userId: id },
    include: { draft: true },
  });
  const back = `/assistant?c=${conversation.id}`;
  if (!conversation.draft) redirect(back);
  if (!to) redirect(`${back}&error=noEmail`);

  await db.emailDraft.update({ where: { conversationId: conversation.id }, data: { to, openedAt: new Date() } });
  const mail = { to, subject: conversation.draft.subject, body: conversation.draft.body };
  redirect(String(formData.get("via")) === "gmail" ? gmailUrl(mail) : mailtoUrl(mail));
}
