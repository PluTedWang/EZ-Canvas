import type { ReactNode } from "react";
import { Sidebar } from "@/components/Sidebar";
import { db } from "@/lib/db";

export default async function ShellLayout({ children }: { children: ReactNode }) {
  const user = await db.user.findFirstOrThrow();
  const subtitle = [user.institution, user.program].filter(Boolean).join(" · ");
  return (
    <div className="flex min-h-full grow">
      <Sidebar user={{ name: user.name, subtitle }} />
      <main className="flex min-w-0 grow flex-col gap-[22px] px-8 pt-5 pb-7">{children}</main>
    </div>
  );
}
