import Link from "next/link";
import { getFormatter, getTranslations } from "next-intl/server";
import { AlertIcon, BookOpenIcon, ChevronDownIcon, FileIcon, LinkIcon } from "@/components/icons";
import { groupByModule, hasNotes, type CourseMaterial } from "@/lib/materials/course-page";

const typeIcon = { file: FileIcon, page: BookOpenIcon, announcement: AlertIcon, link: LinkIcon };
const iconFor = (type: string) => typeIcon[type as keyof typeof typeIcon] ?? FileIcon;

export async function ModuleList({
  materials,
  selectedId,
  href,
}: {
  materials: CourseMaterial[];
  selectedId: string | null;
  href: (materialId: string) => string;
}) {
  const [t, format] = await Promise.all([getTranslations("course"), getFormatter()]);
  const summarized = materials.filter(hasNotes).length;

  return (
    <section className="flex w-[420px] shrink-0 flex-col self-start overflow-hidden rounded-card border border-border bg-surface">
      <div className="flex items-center justify-between gap-3 px-4 pt-[14px] pb-[10px]">
        <h2 className="text-[16px] font-semibold">{t("modules")}</h2>
        <span className="text-[13.5px] text-text-3">{t("fileCount", { files: materials.length, summarized })}</span>
      </div>
      <div className="flex flex-col gap-[2px] px-2 pb-2">
        {materials.length === 0 && <p className="px-2 py-3 text-[14px] text-text-3">{t("noMaterials")}</p>}
        {groupByModule(materials).map((group) => (
          <div key={group.name || "ungrouped"} className="flex flex-col gap-[2px]">
            <div className="flex items-center gap-2 px-2 pt-2 pb-1 text-[13.5px] font-semibold text-text-2">
              <ChevronDownIcon className="h-[14px] w-[14px]" />
              {group.name || t("otherFiles")}
              <span className="font-medium text-text-3">{t("groupCount", { count: group.items.length })}</span>
            </div>
            {group.items.map((material) => {
              const Icon = iconFor(material.type);
              const meta = hasNotes(material)
                ? t("status.summarized")
                : material.unsupported
                  ? t("status.unsupported")
                  : t("status.notYet");
              return (
                <Link
                  key={material.id}
                  href={href(material.id)}
                  aria-current={material.id === selectedId ? "true" : undefined}
                  className={`flex items-center gap-3 rounded-control px-[14px] py-[10px] text-text ${
                    material.id === selectedId ? "bg-teal-soft" : "hover:bg-row-hover"
                  }`}
                >
                  <span className="flex h-[34px] w-[34px] shrink-0 items-center justify-center rounded-[9px] border border-border bg-surface text-teal">
                    <Icon className="h-[17px] w-[17px]" />
                  </span>
                  <span className="flex min-w-0 grow flex-col gap-[2px]">
                    <span className="truncate text-[15px] font-semibold">{material.title}</span>
                    <span className="truncate text-[13px] text-text-3">
                      {[meta, format.relativeTime(material.notesAt ?? material.firstSeenAt)].join(" · ")}
                    </span>
                  </span>
                </Link>
              );
            })}
          </div>
        ))}
      </div>
    </section>
  );
}
