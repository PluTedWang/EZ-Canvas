import { getTranslations } from "next-intl/server";

// Google and Apple both subscribe to the same feed URL, so one link each is enough.
export async function ExportPanel({ feedUrl }: { feedUrl: string }) {
  const t = await getTranslations("calendar.export");
  const webcal = feedUrl.replace(/^https?:/, "webcal:");
  const google = `https://calendar.google.com/calendar/r?cid=${encodeURIComponent(feedUrl)}`;
  const link = "text-[14.5px] font-semibold text-teal hover:text-teal-deep";

  return (
    <section className="flex flex-col gap-3 rounded-card border border-border bg-surface px-5 py-4">
      <div className="flex flex-col gap-1">
        <h2 className="text-[16px] font-semibold">{t("title")}</h2>
        <p className="text-[13.5px] leading-[1.45] text-text-3">{t("intro")}</p>
      </div>
      <label className="flex flex-col gap-[6px]">
        <span className="text-[13px] font-semibold text-text-2">{t("feedLabel")}</span>
        <input
          type="text"
          readOnly
          value={feedUrl}
          className="h-[38px] rounded-control border border-control-border bg-prompt px-3 text-[13.5px] text-text outline-none"
        />
      </label>
      <div className="flex flex-wrap gap-4">
        <a className={link} href={google} target="_blank" rel="noreferrer">
          {t("google")}
        </a>
        <a className={link} href={webcal}>
          {t("apple")}
        </a>
        <a className={link} href={feedUrl} download="ezcanvas.ics">
          {t("download")}
        </a>
      </div>
      <p className="text-[13px] leading-[1.45] text-text-3">{t("localhostNote")}</p>
    </section>
  );
}
