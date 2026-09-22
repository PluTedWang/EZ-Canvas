import { courseColorCount } from "@/lib/course-color";

// Course colors are assigned at sync time as 1 to courseColorCount; Tailwind needs the class names
// spelled out, one per color.
const solid = ["bg-course-1", "bg-course-2", "bg-course-3", "bg-course-4"];
const soft = [
  "bg-course-1-soft text-course-1",
  "bg-course-2-soft text-course-2",
  "bg-course-3-soft text-course-3",
  "bg-course-4-soft text-course-4",
];

const pick = (classes: string[], color: number) => classes[(color - 1) % courseColorCount] ?? classes[0];

// Solid backs the deadline bar, the course tile and the progress fill; soft backs the material icon tiles.
export const courseSolid = (color: number) => pick(solid, color);
export const courseSoft = (color: number) => pick(soft, color);
