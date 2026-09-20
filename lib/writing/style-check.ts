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

// Phrases the spec calls out, plus the usual openers. Matched case insensitively on word boundaries.
const fillerPhrases = [
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
];

const apologyPhrases = ["i am sorry", "i'm sorry", "i apologize", "i apologise", "my apologies", "it was my fault"];
const reasonMarkers = ["because", "due to", "the reason", "as a result of", "owing to"];
const askMarkers = ["could you", "would you", "can you", "may i", "please ", "i am asking", "would it be possible", "i would like to request"];

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

export function styleCheck(draft: string): StyleCheck {
  const body = lower(draft);
  const filler = fillerPhrases.filter((phrase) => body.includes(phrase));
  const apologies = countOccurrences(body, apologyPhrases);
  const reasons = countOccurrences(body, reasonMarkers);

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
