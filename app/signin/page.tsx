import { getTranslations } from "next-intl/server";
import { Button } from "@/components/Button";
import { TextField } from "@/components/TextField";
import { Wordmark } from "@/components/Wordmark";
import { signIn } from "@/lib/auth";

async function sendLink(formData: FormData) {
  "use server";
  await signIn("resend", { email: formData.get("email"), redirectTo: "/" });
}

export default async function SignInPage({ searchParams }: PageProps<"/signin">) {
  const { provider, error } = await searchParams;
  const sent = provider !== undefined;
  const t = await getTranslations("signIn");
  return (
    <main className="flex grow flex-col items-center justify-center gap-7 px-8">
      <Wordmark />
      <form
        action={sendLink}
        className="flex w-full max-w-[420px] flex-col gap-5 rounded-card border border-border bg-surface p-7"
      >
        <div className="flex flex-col gap-2">
          <h1 className="font-title text-[30px] leading-[1.15] tracking-[-0.01em]">{t("title")}</h1>
          <p className="text-[15px] leading-[1.55] text-text-2">{t("intro")}</p>
        </div>
        <TextField label={t("email")} type="email" name="email" required autoComplete="email" />
        <Button type="submit">{t("send")}</Button>
        {sent && <p className="text-[14.5px] leading-[1.5] text-ok">{t("sent")}</p>}
        {error && <p className="text-[14.5px] leading-[1.5] text-danger">{t("error")}</p>}
      </form>
    </main>
  );
}
