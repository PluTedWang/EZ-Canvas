import { expect, test } from "vitest";
import en from "../messages/en.json";
import zhHans from "../messages/zh-Hans.json";
import { languageName } from "../lib/locales";

function keys(messages: object, prefix = ""): string[] {
  return Object.entries(messages).flatMap(([key, value]) =>
    typeof value === "object" && value !== null ? keys(value, `${prefix}${key}.`) : [`${prefix}${key}`],
  );
}

test("zh-Hans has exactly the keys of en", () => {
  expect(keys(zhHans).sort()).toEqual(keys(en).sort());
});

test("no message is empty", () => {
  for (const messages of [en, zhHans]) {
    const leaves = keys(messages).map((path) =>
      path.split(".").reduce<unknown>((node, part) => (node as Record<string, unknown>)[part], messages),
    );
    expect(leaves.every((value) => typeof value === "string" && value.trim() !== "")).toBe(true);
  }
});

test("every locale has a name the prompts can use", () => {
  expect(languageName("en")).toBe("English");
  expect(languageName("zh-Hans")).toBe("Simplified Chinese");
  expect(languageName("klingon")).toBe("English");
});
