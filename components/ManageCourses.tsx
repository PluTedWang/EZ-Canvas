import { getTranslations } from "next-intl/server";
import { saveCourseVisibility } from "@/app/(shell)/settings/actions";
import { Button, LinkButton } from "@/components/Button";

type Course = { id: string; code: string; name: string; hidden: boolean };

// Checklist under the Canvas row: checked courses show in EZCanvas, unchecked ones are hidden.
export async function ManageCourses({ courses }: { courses: Course[] }) {
  const t = await getTranslations("settings.connections.manage");
  return (
    <form action={saveCourseVisibility} className="flex flex-col gap-3 border-t border-line px-5 py-4">
      <p className="text-[14px] text-text-3">{t("intro")}</p>
      <ul className="flex flex-col gap-2">
        {courses.map((course) => (
          <li key={course.id}>
            <label className="flex items-center gap-3 text-[15px]">
              <input
                type="checkbox"
                name="shown"
                value={course.id}
                defaultChecked={!course.hidden}
                className="h-[18px] w-[18px] accent-teal"
              />
              <span className="font-semibold">{course.code}</span>
              <span className="text-text-2">{course.name}</span>
            </label>
          </li>
        ))}
      </ul>
      <div className="flex gap-2">
        <Button type="submit" size="small">
          {t("save")}
        </Button>
        <LinkButton href="/settings" variant="secondary" size="small">
          {t("cancel")}
        </LinkButton>
      </div>
    </form>
  );
}
