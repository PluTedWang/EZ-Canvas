export function initials(name: string) {
  return name
    .trim()
    .split(/\s+/)
    .map((word) => word[0])
    .slice(0, 2)
    .join("")
    .toUpperCase();
}

export function UserRow({ name, subtitle }: { name: string; subtitle: string }) {
  return (
    <div className="mt-2 flex items-center gap-3 border-t border-divider px-[14px] pt-[14px]">
      <span className="flex h-9 w-9 items-center justify-center rounded-chip bg-course-4 text-[13px] font-bold text-white">
        {initials(name)}
      </span>
      <span className="flex flex-col leading-[1.25]">
        <span className="text-[15px] font-semibold">{name}</span>
        <span className="text-[13px] text-text-3">{subtitle}</span>
      </span>
    </div>
  );
}
