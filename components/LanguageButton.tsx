import { getTranslations } from "next-intl/server";
import { GlobeIcon } from "@/components/icons";
import { navItemClass } from "@/components/nav-item-class";
import { toggleLocale } from "@/lib/set-locale";

export async function LanguageButton() {
  const t = await getTranslations("locale");
  return (
    <form action={toggleLocale}>
      <button type="submit" className={`${navItemClass} w-full text-left`}>
        <GlobeIcon />
        <span className="grow">{t("language")}</span>
        <span className="text-[14px] font-semibold text-teal">{t("name")}</span>
      </button>
    </form>
  );
}
