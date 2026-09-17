// Pulls the four policy lines EZCanvas needs out of a Canvas syllabus, by sentence matching.

const entities: Record<string, string> = { amp: "&", lt: "<", gt: ">", quot: '"', "#39": "'", nbsp: " " };

export function htmlToText(html: string) {
  return html
    .replace(/<(br|\/p|\/li|\/h\d|\/div|\/tr)[^>]*>/gi, "\n")
    .replace(/<[^>]+>/g, " ")
    .replace(/&(amp|lt|gt|quot|#39|nbsp);/g, (_, name) => entities[name])
    .replace(/[ \t]+/g, " ")
    .replace(/\s*\n\s*/g, "\n")
    .trim();
}

const minWords = 4;
const maxSentences = 3;
const timeOrDay = /\b\d{1,2}(:\d{2})?\s*(am|pm)\b|\b(mon|tue|wed|thu|fri|sat|sun)[a-z]*\b/i;

const rules = {
  latePolicy: { match: /\b(late|extension|penalt)/i },
  aiPolicy: { match: /\bAI\b|\b(generative|ChatGPT|language model|artificial intelligence)\b/ },
  officeHours: { match: /\boffice hours?\b/i },
  meetingTimes: { match: /\b(lecture|class|meets?|studio|section|seminar|lab)/i, also: timeOrDay },
};

export type SyllabusPolicies = { [K in keyof typeof rules]: string | null };

function sentences(text: string) {
  return text
    .split(/(?<=[.!?])\s+|\n+/)
    .map((s) => s.trim())
    .filter((s) => s.split(/\s+/).length >= minWords);
}

export function parseSyllabus(html: string | null | undefined): SyllabusPolicies {
  const parts = html ? sentences(htmlToText(html)) : [];
  const pick = (rule: { match: RegExp; also?: RegExp }) => {
    const hits = parts.filter((s) => rule.match.test(s) && (!rule.also || rule.also.test(s)));
    return hits.length ? hits.slice(0, maxSentences).join(" ") : null;
  };
  return {
    latePolicy: pick(rules.latePolicy),
    aiPolicy: pick(rules.aiPolicy),
    officeHours: pick(rules.officeHours),
    meetingTimes: pick(rules.meetingTimes),
  };
}
