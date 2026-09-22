import { isLocale, type Locale } from "../locales";

// The "Natural, non-defensive" style layer from docs/PRODUCT_SPEC.md section 8.
// Three checks plus a word count, reported on every draft the student will send.

export type CheckId = "statedOnce" | "oneAsk" | "noFiller";

export type StyleCheck = {
  passed: Record<CheckId, boolean>;
  filler: string[];
  asks: number;
  apologies: number;
  reasons: number;
  words: number;
};

type Phrases = { filler: string[]; apology: string[]; reason: string[]; ask: string[] };

// Phrases the spec calls out, plus the usual openers, for each writing language. Matched in lower
// case. Chinese entries do not overlap, so one apology is never counted twice.
const phrases: Record<Locale, Phrases> = {
  en: {
    filler: [
      "i hope this email finds you well",
      "i hope you are doing well",
      "i hope this message finds you well",
      "sorry to bother you",
      "sorry for the inconvenience",
      "i would be very grateful if it were at all possible",
      "if it is not too much trouble",
      "i was just wondering",
      "i just wanted to",
      "please do not hesitate",
      "at your earliest convenience",
      "thank you in advance for your understanding",
    ],
    apology: ["i am sorry", "i'm sorry", "i apologize", "i apologise", "my apologies", "it was my fault"],
    reason: ["because", "due to", "the reason", "as a result of", "owing to"],
    ask: ["could you", "would you", "can you", "may i", "please ", "i am asking", "would it be possible", "i would like to request"],
  },
  "zh-Hans": {
    filler: ["希望您一切安好", "希望您一切都好", "打扰您了", "麻烦您了", "如果不太麻烦的话", "在您方便的时候", "提前感谢您的理解", "随时联系我"],
    apology: ["对不起", "抱歉", "不好意思", "是我的错"],
    reason: ["因为", "由于", "原因是"],
    ask: ["能否", "可否", "是否可以", "请问", "请您", "能不能", "可以吗"],
  },
};

const lower = (text: string) => text.toLowerCase();
const countOccurrences = (haystack: string, needles: string[]) =>
  needles.reduce((total, needle) => total + (haystack.split(needle).length - 1), 0);

// Latin words split on whitespace; CJK has no spaces, so each character counts as one word.
export function countWords(text: string) {
  const trimmed = text.trim();
  if (!trimmed) return 0;
  const cjk = trimmed.match(/[㐀-鿿豈-﫿぀-ヿ]/g)?.length ?? 0;
  const latin = trimmed
    .replace(/[㐀-鿿豈-﫿぀-ヿ]/g, " ")
    .split(/\s+/)
    .filter((word) => /[\p{L}\p{N}]/u.test(word)).length;
  return cjk + latin;
}

export function splitSentences(text: string) {
  return text
    // Western punctuation needs the following space; full width punctuation ends a sentence on its own.
    .split(/(?<=[.!?])\s+|(?<=[。！？])|\n+/)
    .map((sentence) => sentence.trim())
    .filter(Boolean);
}

// The language is the student's writing language; the English lists found nothing in a Chinese draft.
export function styleCheck(draft: string, language: string = "en"): StyleCheck {
  const { filler: fillerPhrases, apology, reason, ask: askMarkers } = phrases[isLocale(language) ? language : "en"];
  const body = lower(draft);
  const filler = fillerPhrases.filter((phrase) => body.includes(phrase));
  const apologies = countOccurrences(body, apology);
  const reasons = countOccurrences(body, reason);

  // An ask is a sentence that asks a question or makes a request.
  const asks = splitSentences(draft).filter((sentence) => {
    const text = lower(sentence);
    return /[?？]/.test(sentence) || askMarkers.some((marker) => text.includes(marker));
  }).length;

  return {
    passed: {
      statedOnce: apologies <= 1 && reasons <= 1,
      oneAsk: asks === 1,
      noFiller: filler.length === 0,
    },
    filler,
    asks,
    apologies,
    reasons,
    words: countWords(draft),
  };
}
