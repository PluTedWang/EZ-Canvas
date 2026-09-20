// Canvas submission types the app has copy for; anything else shows the raw Canvas value.
const known = ["online_upload", "external_tool", "on_paper", "online_quiz", "online_text_entry", "discussion_topic"];

export function submissionTypeLabel(t: (key: string) => string, submissionType: string) {
  const primary = submissionType.split(",")[0];
  return known.includes(primary) ? t(`submissionType.${primary}`) : primary;
}
