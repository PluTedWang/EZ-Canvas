import { getFormatter, getTranslations } from "next-intl/server";
import { BellIcon, RefreshIcon, SearchIcon } from "@/components/icons";

export async function TopBar({ status, lastSyncAt, now }: { status: string; lastSyncAt: Date | null; now: Date }) {
  const [t, format] = await Promise.all([getTranslations("topBar"), getFormatter()]);
  const ok = status !== "error";
  const syncLabel = !ok ? t("syncFailed") : lastSyncAt ? t("syncedAgo", { ago: format.relativeTime(lastSyncAt, now) }) : t("syncPending");

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
      <span
        className={`inline-flex h-[26px] items-center gap-[6px] rounded-chip px-[10px] text-[13.5px] font-semibold ${ok ? "bg-ok-soft text-ok" : "bg-danger-soft text-danger"}`}
      >
        <RefreshIcon className="h-[14px] w-[14px]" />
        {syncLabel}
      </span>
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
