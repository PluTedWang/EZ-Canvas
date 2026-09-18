import type { ReactNode } from "react";
import { CheckIcon } from "@/components/icons";

// One service row in Settings > Connections: status tile, title, meta line and action buttons.
export function ConnectionRow({ ok, title, meta, actions }: { ok: boolean; title: string; meta: string; actions: ReactNode }) {
  const tile = ok ? "bg-ok-soft text-ok" : "bg-danger-soft text-danger";
  return (
    <div className="flex items-center gap-4 px-5 py-3">
      <span className={`flex h-9 w-9 shrink-0 items-center justify-center rounded-control ${tile}`}>
        <CheckIcon strokeWidth="2.25" className="h-4 w-4" />
      </span>
      <div className="flex min-w-0 grow flex-col gap-[1px]">
        <span className="text-[15.5px] font-semibold">{title}</span>
        <span className="text-[13.5px] text-text-3">{meta}</span>
      </div>
      {actions}
    </div>
  );
}
