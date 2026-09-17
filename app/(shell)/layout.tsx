import type { ReactNode } from "react";
import { Sidebar } from "@/components/Sidebar";
import user from "@/fixtures/user.json";

export default function ShellLayout({ children }: { children: ReactNode }) {
  return (
    <div className="flex min-h-full grow">
      <Sidebar user={{ name: user.name, subtitle: `${user.institution} · ${user.program}` }} />
      <main className="flex min-w-0 grow flex-col gap-[22px] px-8 pt-5 pb-7">{children}</main>
    </div>
  );
}
