"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import type { ReactNode } from "react";
import { activeNavItemClass, navItemClass } from "@/components/nav-item-class";

export function NavItem({ href, icon, label }: { href: string; icon: ReactNode; label: string }) {
  const pathname = usePathname();
  const active = href === "/" ? pathname === "/" : pathname.startsWith(href);
  return (
    <Link
      href={href}
      aria-current={active ? "page" : undefined}
      className={active ? `${navItemClass} ${activeNavItemClass}` : navItemClass}
    >
      {icon}
      {label}
    </Link>
  );
}
