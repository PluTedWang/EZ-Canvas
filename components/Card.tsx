import type { ReactNode } from "react";

// The white section card used across the dashboard and calendar: a header row, then rows separated by lines.
export function Card({ title, aside, children, grow }: { title: string; aside?: ReactNode; children: ReactNode; grow?: boolean }) {
  return (
    <section className={`flex flex-col rounded-card border border-border bg-surface ${grow ? "grow" : ""}`}>
      <div className="flex items-center justify-between gap-4 px-5 pt-[18px] pb-3">
        <h2 className="text-[18px] font-semibold">{title}</h2>
        {aside}
      </div>
      {children}
    </section>
  );
}

export const cardRowClass = "flex items-center gap-[14px] border-t border-line px-5 py-[14px]";

export function EmptyRow({ children }: { children: ReactNode }) {
  return <p className={`${cardRowClass} text-[15px] text-text-3`}>{children}</p>;
}
