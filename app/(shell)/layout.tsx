import { redirect } from "next/navigation";
import type { ReactNode } from "react";
import { Sidebar } from "@/components/Sidebar";
import { auth } from "@/lib/auth";
import { db } from "@/lib/db";

export default async function ShellLayout({ children }: { children: ReactNode }) {
  const session = await auth();
  if (!session?.user?.id) redirect("/signin");
  const user = await db.user.findUniqueOrThrow({
    where: { id: session.user.id },
    include: { connections: { where: { type: "canvas" } } },
  });
  if (user.connections.length === 0) redirect("/onboarding");
  const subtitle = [user.institution, user.program].filter(Boolean).join(" · ");
  return (
    <div className="flex min-h-full grow">
      <Sidebar user={{ name: user.name ?? user.email, subtitle }} />
      <main className="flex min-w-0 grow flex-col gap-[22px] px-8 pt-5 pb-7">{children}</main>
    </div>
  );
}
