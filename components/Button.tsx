import Link from "next/link";
import type { ButtonHTMLAttributes, ReactNode } from "react";

const base = "inline-flex h-11 items-center justify-center gap-2 rounded-control px-5 text-[16px] font-semibold whitespace-nowrap";
const styles = {
  primary: `${base} bg-teal text-white`,
  secondary: `${base} border border-control-border bg-surface text-text`,
};

type Variant = keyof typeof styles;

export function Button({ variant = "primary", ...props }: { variant?: Variant } & ButtonHTMLAttributes<HTMLButtonElement>) {
  return <button {...props} className={styles[variant]} />;
}

export function LinkButton({ variant = "primary", href, children }: { variant?: Variant; href: string; children: ReactNode }) {
  return (
    <Link href={href} className={styles[variant]}>
      {children}
    </Link>
  );
}
