import type { InputHTMLAttributes } from "react";

export function TextField({
  label,
  help,
  ...input
}: { label: string; help?: string } & InputHTMLAttributes<HTMLInputElement>) {
  return (
    <label className="flex flex-col gap-2 text-[14px] font-semibold text-text-2">
      {label}
      <input
        {...input}
        className="h-11 rounded-control border border-control-border bg-surface px-3 text-[15px] font-normal text-text outline-none"
      />
      {help && <span className="text-[13.5px] font-normal leading-[1.5] text-text-3">{help}</span>}
    </label>
  );
}
