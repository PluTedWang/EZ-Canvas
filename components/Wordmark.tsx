import Link from "next/link";
import { CheckIcon } from "@/components/icons";

export function Wordmark() {
  return (
    <Link href="/" className="flex items-center gap-[10px] px-[10px] py-1 text-text">
      <span className="flex h-[34px] w-[34px] items-center justify-center rounded-[10px] bg-teal text-white">
        <CheckIcon strokeWidth="2.5" className="h-[18px] w-[18px]" />
      </span>
      <span className="text-[21px] font-bold tracking-[-0.02em]">EZCanvas</span>
    </Link>
  );
}
