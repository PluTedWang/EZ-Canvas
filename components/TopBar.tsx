import { getFormatter, getTranslations } from "next-intl/server";
import { RefreshIcon } from "@/components/icons";

// The mockup also draws search and notifications; they return with the features behind them, so
// no control on the page does nothing in the meantime.
export async function TopBar({ status, lastSyncAt, now }: { status: string; lastSyncAt: Date | null; now: Date }) {
  const [t, format] = await Promise.all([getTranslations("topBar"), getFormatter()]);
  const ok = status !== "error";
  const syncLabel = !ok ? t("syncFailed") : lastSyncAt ? t("syncedAgo", { ago: format.relativeTime(lastSyncAt, now) }) : t("syncPending");

  return (
    <div className="flex items-center justify-end gap-4">
      <span
        className={`inline-flex h-[26px] items-center gap-[6px] rounded-chip px-[10px] text-[13.5px] font-semibold ${ok ? "bg-ok-soft text-ok" : "bg-danger-soft text-danger"}`}
      >
        <RefreshIcon className="h-[14px] w-[14px]" />
        {syncLabel}
      </span>
    </div>
  );
}
