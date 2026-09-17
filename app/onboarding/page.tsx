import { redirect } from "next/navigation";
import { getTranslations } from "next-intl/server";
import { Button, LinkButton } from "@/components/Button";
import { OnboardingSteps } from "@/components/OnboardingSteps";
import { TextField } from "@/components/TextField";
import { auth } from "@/lib/auth";
import { db } from "@/lib/db";
import { connectCanvas } from "./actions";

export default async function OnboardingPage({ searchParams }: PageProps<"/onboarding">) {
  const session = await auth();
  if (!session?.user?.id) redirect("/signin");
  const { error } = await searchParams;
  const t = await getTranslations("onboarding");

  const [user, connection] = await Promise.all([
    db.user.findUniqueOrThrow({ where: { id: session.user.id } }),
    db.connection.findUnique({ where: { userId_type: { userId: session.user.id, type: "canvas" } } }),
  ]);
  const host = connection ? new URL(connection.baseUrl).host : null;
  const connectedLine = host ? t("connect.connectedAs", { name: user.name ?? user.email, host }) : t("steps.connectSub");

  return (
    <div className="flex min-h-full grow">
      <OnboardingSteps current={connection ? 2 : 1} details={[connectedLine, t("steps.languageSub"), t("steps.aiSub")]} />
      <main className="flex grow flex-col justify-between px-24 pt-[72px] pb-12">
        <div className="flex max-w-[620px] flex-col gap-7">
          <div className="flex flex-col gap-2">
            <span className="text-[14px] font-semibold uppercase tracking-[0.06em] text-teal">{t("step", { n: 1, total: 3 })}</span>
            <h2 className="font-title text-[36px] leading-[1.15] tracking-[-0.01em]">{t("connect.title")}</h2>
            <p className="text-[16px] leading-[1.55] text-text-2">{t("connect.intro")}</p>
          </div>
          {connection ? (
            <p className="rounded-control border border-teal-border bg-teal-tint px-4 py-3 text-[15px] leading-[1.5] text-teal-deep">
              {connectedLine}
            </p>
          ) : (
            <form action={connectCanvas} className="flex flex-col gap-5">
              <TextField
                label={t("connect.url")}
                name="baseUrl"
                type="text"
                required
                defaultValue={process.env.CANVAS_DEFAULT_BASE_URL ?? ""}
                autoComplete="url"
              />
              <TextField
                label={t("connect.token")}
                help={t("connect.tokenHelp")}
                name="token"
                type="password"
                required
                autoComplete="off"
              />
              <div className="flex flex-col gap-3">
                <Button type="submit">{t("connect.submit")}</Button>
                {error && <p className="text-[14.5px] leading-[1.5] text-danger">{t(`connect.errors.${error === "missing" ? "missing" : "token"}`)}</p>}
              </div>
            </form>
          )}
        </div>
        <div className="flex max-w-[620px] justify-end">
          {connection && <LinkButton href="/">{t("connect.continue")}</LinkButton>}
        </div>
      </main>
    </div>
  );
}
