import { getTranslations } from "next-intl/server";
import { BellIcon, SearchIcon } from "@/components/icons";

export async function TopBar() {
  const t = await getTranslations("topBar");
  return (
    <div className="flex items-center gap-4">
      <label className="flex h-[42px] max-w-[460px] grow items-center gap-[10px] rounded-control border border-border bg-surface px-[14px] text-text-3">
        <SearchIcon className="h-[18px] w-[18px] shrink-0" />
        <input
          type="search"
          placeholder={t("searchPlaceholder")}
          aria-label={t("search")}
          className="grow bg-transparent text-[15px] text-text outline-none"
        />
      </label>
      <div className="grow" />
      <button
        type="button"
        aria-label={t("notifications")}
        className="flex h-[42px] w-[42px] items-center justify-center rounded-control border border-border bg-surface text-text-2"
      >
        <BellIcon className="h-5 w-5" />
      </button>
    </div>
  );
}
