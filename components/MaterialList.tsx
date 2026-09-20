import { getFormatter, getTranslations } from "next-intl/server";
import { Card, cardRowClass, EmptyRow } from "@/components/Card";
import { courseSoft } from "@/components/course-color";
import { AlertIcon, BookOpenIcon, FileIcon, LinkIcon } from "@/components/icons";
import type { Dashboard } from "@/lib/dashboard";

const typeIcon = { file: FileIcon, page: BookOpenIcon, announcement: AlertIcon, link: LinkIcon };
const iconFor = (type: string) => typeIcon[type as keyof typeof typeIcon] ?? FileIcon;

export async function MaterialList({ items, now }: { items: Dashboard["materials"]; now: Date }) {
  const [t, format] = await Promise.all([getTranslations("dashboard"), getFormatter()]);
  return (
    <Card title={t("materials.title")} grow>
      {items.length === 0 && <EmptyRow>{t("materials.empty")}</EmptyRow>}
      {items.map((item) => {
        const Icon = iconFor(item.type);
        const posted = item.postedAt ?? item.firstSeenAt;
        const meta = [item.courseCode, format.relativeTime(posted, now)].filter(Boolean).join(" · ");
        return (
          <div key={item.id} className={cardRowClass}>
            <span className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-control ${courseSoft(item.color)}`}>
              <Icon className="h-5 w-5" />
            </span>
            <span className="flex min-w-0 grow flex-col gap-[3px]">
              <a href={item.url} className="truncate text-[16px] font-semibold text-text hover:text-teal">
                {item.title}
              </a>
              <span className="truncate text-[14px] text-text-3">{meta}</span>
            </span>
            <span className="inline-flex h-[26px] shrink-0 items-center rounded-chip bg-teal-soft px-[10px] text-[13.5px] font-semibold text-teal">
              {t(`materials.type.${item.type in typeIcon ? item.type : "file"}`)}
            </span>
          </div>
        );
      })}
    </Card>
  );
}
