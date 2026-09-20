import { redirect } from "next/navigation";
import { getFormatter, getTranslations } from "next-intl/server";
import { Button, LinkButton } from "@/components/Button";
import { ConnectionRow } from "@/components/ConnectionRow";
import { RefreshIcon } from "@/components/icons";
import { ManageCourses } from "@/components/ManageCourses";
import { auth } from "@/lib/auth";
import { db } from "@/lib/db";
import { syncIntervalMs } from "@/lib/jobs";
import { syncNow } from "./actions";

export default async function SettingsPage({ searchParams }: PageProps<"/settings">) {
  const session = await auth();
  if (!session?.user?.id) redirect("/signin");
  const { manage } = await searchParams;
  const [t, format, user, courses] = await Promise.all([
    getTranslations("settings"),
    getFormatter(),
    db.user.findUniqueOrThrow({
      where: { id: session.user.id },
      include: { connections: { where: { type: "canvas" } } },
    }),
    db.course.findMany({
      where: { userId: session.user.id },
      orderBy: { canvasId: "asc" },
      select: { id: true, code: true, name: true, hidden: true },
    }),
  ]);
  const connection = user.connections[0];
  if (!connection) redirect("/onboarding");

  const meta = [
    t("connections.canvas.signedInAs", { name: user.name ?? user.email }),
    t("connections.canvas.tokenAdded", { date: format.dateTime(connection.createdAt, { dateStyle: "medium" }) }),
    t("connections.canvas.syncsEvery", { minutes: syncIntervalMs / 60000 }),
    t("connections.canvas.courses", { count: courses.length, hidden: courses.filter((c) => c.hidden).length }),
    ...(connection.status === "error" ? [t("connections.canvas.syncFailed")] : []),
  ].join(" · ");

  return (
    <>
      <h1 className="font-title text-[32px] tracking-[-0.01em]">{t("title")}</h1>
      <div className="flex grow gap-6">
        <nav aria-label={t("title")} className="flex w-[196px] shrink-0 flex-col gap-1">
          <a
            href="#connections"
            className="flex h-10 items-center rounded-[9px] border border-border bg-surface px-3 text-[15px] font-semibold"
          >
            {t("connections.title")}
          </a>
        </nav>
        <section
          id="connections"
          className="flex min-w-0 grow flex-col self-start rounded-card border border-border bg-surface"
        >
          <ConnectionRow
            ok={connection.status !== "error"}
            title={`Canvas · ${new URL(connection.baseUrl).host}`}
            meta={meta}
            actions={
              <>
                <LinkButton href="/settings?manage=courses" variant="secondary" size="small">
                  {t("connections.canvas.manageCourses")}
                </LinkButton>
                <form action={syncNow}>
                  <Button type="submit" variant="secondary" size="small">
                    <RefreshIcon />
                    {t("connections.syncNow")}
                  </Button>
                </form>
              </>
            }
          />
          {manage === "courses" && <ManageCourses courses={courses} />}
        </section>
      </div>
    </>
  );
}
