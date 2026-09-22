// Courses take the design's course colors in order, 1 to courseColorCount, then wrap around.
// components/course-color.ts spells out one Tailwind class per color.
export const courseColorCount = 4;

export const nextCourseColor = (existingCourses: number) => (existingCourses % courseColorCount) + 1;
