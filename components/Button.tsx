"use client";

import Link from "next/link";
import { useFormStatus } from "react-dom";
import type { ButtonHTMLAttributes, ReactNode } from "react";

const base = "inline-flex shrink-0 items-center justify-center gap-2 whitespace-nowrap font-semibold disabled:opacity-60";
const sizes = {
  regular: "h-11 rounded-control px-5 text-[16px]",
  small: "h-9 rounded-[9px] px-[14px] text-[14.5px] [&>svg]:h-[15px] [&>svg]:w-[15px]",
};
const variants = {
  primary: "bg-teal text-white",
  secondary: "border border-control-border bg-surface text-text hover:border-teal",
};

type Variant = keyof typeof variants;
type Size = keyof typeof sizes;
type Props = { variant?: Variant; size?: Size };

const className = ({ variant = "primary", size = "regular" }: Props) => `${base} ${sizes[size]} ${variants[variant]}`;

// Inside a form the button disables itself while the action runs.
export function Button({ variant, size, ...props }: Props & ButtonHTMLAttributes<HTMLButtonElement>) {
  const { pending } = useFormStatus();
  return <button {...props} disabled={pending || props.disabled} className={className({ variant, size })} />;
}

export function LinkButton({ href, children, ...props }: Props & { href: string; children: ReactNode }) {
  return (
    <Link href={href} className={className(props)}>
      {children}
    </Link>
  );
}
