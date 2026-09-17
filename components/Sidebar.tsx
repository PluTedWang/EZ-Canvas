import { getTranslations } from "next-intl/server";
import {
  BookIcon,
  CalendarIcon,
  ChatIcon,
  DashboardIcon,
  PeopleIcon,
  SlidersIcon,
  SparklesIcon,
} from "@/components/icons";
import { LanguageButton } from "@/components/LanguageButton";
import { NavItem } from "@/components/NavItem";
import { UserRow } from "@/components/UserRow";
import { Wordmark } from "@/components/Wordmark";

export async function Sidebar({ user }: { user: { name: string; subtitle: string } }) {
  const t = await getTranslations("nav");
  return (
    <nav className="flex w-[var(--ez-sidebar-width)] shrink-0 flex-col justify-between border-r border-divider bg-surface px-[14px] pt-6 pb-5">
      <div className="flex flex-col gap-[22px]">
        <Wordmark />
        <div className="flex flex-col gap-[2px]">
          <NavItem href="/" icon={<DashboardIcon />} label={t("dashboard")} />
          <NavItem href="/calendar" icon={<CalendarIcon />} label={t("calendar")} />
          <NavItem href="/courses" icon={<BookIcon />} label={t("courses")} />
          <NavItem href="/groups" icon={<PeopleIcon />} label={t("groups")} />
          <NavItem href="/homework" icon={<SparklesIcon />} label={t("homework")} />
          <NavItem href="/assistant" icon={<ChatIcon />} label={t("assistant")} />
        </div>
      </div>
      <div className="flex flex-col gap-[2px]">
        <NavItem href="/settings" icon={<SlidersIcon />} label={t("settings")} />
        <LanguageButton />
        <UserRow name={user.name} subtitle={user.subtitle} />
      </div>
    </nav>
  );
}
