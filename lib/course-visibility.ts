// Which course rows need their hidden flag flipped after the student saves Manage courses.
export function visibilityUpdates(courses: { id: string; hidden: boolean }[], shownIds: string[]) {
  const shown = new Set(shownIds);
  return courses
    .filter((course) => course.hidden === shown.has(course.id))
    .map((course) => ({ id: course.id, hidden: !shown.has(course.id) }));
}
