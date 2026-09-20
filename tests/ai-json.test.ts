import { expect, test } from "vitest";
import { asArray, asString, parseJsonObject } from "../lib/ai/json";
import { AiError } from "../lib/ai/types";

test("plain JSON is parsed", () => {
  expect(parseJsonObject('{"summary":"ok"}')).toEqual({ summary: "ok" });
});

test("a fenced block is unwrapped", () => {
  expect(parseJsonObject('```json\n{"a":1}\n```')).toEqual({ a: 1 });
  expect(parseJsonObject('```\n{"a":1}\n```')).toEqual({ a: 1 });
});

test("a sentence around the object is ignored", () => {
  expect(parseJsonObject('Sure, here it is:\n{"a":1}\nHope that helps.')).toEqual({ a: 1 });
});

test("nested braces survive", () => {
  expect(parseJsonObject('{"terms":[{"en":"traceability","zh":"可追溯性"}]}')).toEqual({
    terms: [{ en: "traceability", zh: "可追溯性" }],
  });
});

test("a reply with no JSON is rejected", () => {
  expect(() => parseJsonObject("I cannot do that.")).toThrow(AiError);
});

test("a top level array is rejected", () => {
  expect(() => parseJsonObject("[1,2,3]")).toThrow(AiError);
});

test("broken JSON is rejected rather than half read", () => {
  expect(() => parseJsonObject('{"a":1,}}')).toThrow(AiError);
});

test("field readers coerce instead of throwing", () => {
  expect(asString("  hi  ")).toBe("hi");
  expect(asString(42)).toBe("");
  expect(asString(undefined)).toBe("");
  expect(asArray([1])).toEqual([1]);
  expect(asArray("no")).toEqual([]);
});
