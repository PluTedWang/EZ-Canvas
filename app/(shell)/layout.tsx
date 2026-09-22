import { redirect } from "next/navigation";
import type { ReactNode } from "react";
import { Sidebar } from "@/components/Sidebar";
import { TimeZoneSync } from "@/components/TimeZoneSync";
import { requireUser } from "@/lib/session";

export default async function ShellLayout({ children }: { children: ReactNode }) {
  const user = await requireUser();
  if (user.connections.length === 0) redirect("/onboarding");
  const subtitle = [user.institution, user.program].filter(Boolean).join(" · ");
  return (
    <div className="flex min-h-full grow">
      <TimeZoneSync saved={user.timeZone} />
      <Sidebar user={{ name: user.name ?? user.email, subtitle }} />
      <main className="flex min-w-0 grow flex-col gap-[22px] px-8 pt-5 pb-7">{children}</main>
    </div>
  );
}
