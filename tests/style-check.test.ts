import { expect, test } from "vitest";
import { countWords, splitSentences, styleCheck } from "../lib/writing/style-check";

// The sample from the spec: the missed deadline email, rewritten in the natural style.
const good = [
  "Dear Professor Chen,",
  "I missed the Problem Set 2 deadline on Tuesday 15 September. I was ill on the 14th and 15th.",
  "The work is finished and I can submit it on Gradescope today. Could you apply the illness policy from the syllabus to the late penalty?",
  "Thank you,",
  "Ted Wang",
].join("\n");

const padded = [
  "Dear Professor Chen,",
  "I hope this email finds you well. I am so sorry to bother you with this.",
  "I missed the Problem Set 2 deadline because I was ill. I could not finish it due to my illness.",
  "I am sorry for this. I apologize again for the trouble.",
  "Could you please consider waiving the penalty? Would you be able to let me know?",
].join("\n");

test("a natural draft passes all three checks", () => {
  const result = styleCheck(good);
  expect(result.passed).toEqual({ statedOnce: true, oneAsk: true, noFiller: true });
});

test("a padded draft fails all three checks", () => {
  const result = styleCheck(padded);
  expect(result.passed).toEqual({ statedOnce: false, oneAsk: false, noFiller: false });
});

test("the filler check names the phrases it found", () => {
  const result = styleCheck("I hope this email finds you well. Sorry to bother you. Could you help?");
  expect(result.filler).toEqual(["i hope this email finds you well", "sorry to bother you"]);
  expect(result.passed.noFiller).toBe(false);
});

test("stacked apologies fail the stated once check, a single one passes", () => {
  expect(styleCheck("I am sorry I missed it. Could you help?").passed.statedOnce).toBe(true);
  expect(styleCheck("I am sorry I missed it. I apologize for the trouble. Could you help?").passed.statedOnce).toBe(false);
});

test("repeating the reason fails the stated once check", () => {
  expect(styleCheck("I missed it because I was ill. I could not work due to the illness. Could you help?").passed.statedOnce).toBe(false);
});

test("no ask and two asks both fail; exactly one passes", () => {
  expect(styleCheck("I missed the deadline. The work is done.").asks).toBe(0);
  expect(styleCheck("I missed the deadline. Could you apply the illness policy?").passed.oneAsk).toBe(true);
  expect(styleCheck("Could you apply the policy? Would you also confirm the new date?").passed.oneAsk).toBe(false);
});

test("a question mark alone counts as an ask", () => {
  expect(styleCheck("The work is done. What should I do next?").asks).toBe(1);
});

test("word count handles English, Chinese and a mix", () => {
  expect(countWords("The work is finished.")).toBe(4);
  expect(countWords("作业已经完成")).toBe(6);
  expect(countWords("Problem Set 2 作业")).toBe(5);
  expect(countWords("   ")).toBe(0);
});

test("punctuation alone is not counted as a word", () => {
  expect(countWords("Hi, there --- ok!")).toBe(3);
});

test("sentences split on both western and full width punctuation", () => {
  expect(splitSentences("One. Two! Three?")).toEqual(["One.", "Two!", "Three?"]);
  expect(splitSentences("第一句。第二句？")).toEqual(["第一句。", "第二句？"]);
  expect(splitSentences("Line one\nLine two")).toEqual(["Line one", "Line two"]);
});

test("two questions in a Chinese draft count as two asks", () => {
  expect(styleCheck("请问能否减少扣分？另外，能否延期到周五？").asks).toBe(2);
});

test("a Chinese draft is checked the same way as an English one", () => {
  const result = styleCheck("我错过了截止时间。作业已经完成，今天可以提交。请问能否减少迟交扣分？");
  expect(result.passed.oneAsk).toBe(true);
  expect(result.passed.noFiller).toBe(true);
  expect(result.words).toBeGreaterThan(20);
});
