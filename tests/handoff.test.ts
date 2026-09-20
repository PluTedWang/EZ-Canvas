import { expect, test } from "vitest";
import { gmailUrl, mailtoUrl } from "../lib/email/handoff";

const draft = {
  to: "a.rivera@cornell.edu",
  subject: "Problem Set 2 · late submission",
  body: "Dear Professor Rivera,\n\nI missed the deadline.\n\nTed",
};

test("a mailto link carries the address, subject and body", () => {
  const url = mailtoUrl(draft);
  expect(url.startsWith("mailto:a.rivera%40cornell.edu?")).toBe(true);
  const query = new URLSearchParams(url.split("?")[1]);
  expect(query.get("subject")).toBe(draft.subject);
  expect(query.get("body")).toBe(draft.body);
});

test("newlines survive as percent encoding, never as a plus", () => {
  const url = mailtoUrl(draft);
  expect(url).not.toContain("+");
  expect(url).toContain("%0A");
});

test("a Gmail compose link keeps the same three fields", () => {
  const url = new URL(gmailUrl(draft));
  expect(url.origin + url.pathname).toBe("https://mail.google.com/mail/");
  expect(url.searchParams.get("to")).toBe(draft.to);
  expect(url.searchParams.get("su")).toBe(draft.subject);
  expect(url.searchParams.get("body")).toBe(draft.body);
  expect(url.searchParams.get("view")).toBe("cm");
});

test("an ampersand in the subject does not split the query", () => {
  const tricky = { ...draft, subject: "Grades & feedback" };
  expect(new URL(gmailUrl(tricky)).searchParams.get("su")).toBe("Grades & feedback");
  expect(new URLSearchParams(mailtoUrl(tricky).split("?")[1]).get("subject")).toBe("Grades & feedback");
});

test("a Chinese body round trips", () => {
  const chinese = { ...draft, body: "尊敬的教授：\n我错过了截止时间。" };
  expect(new URL(gmailUrl(chinese)).searchParams.get("body")).toBe(chinese.body);
  expect(new URLSearchParams(mailtoUrl(chinese).split("?")[1]).get("body")).toBe(chinese.body);
});

test("an empty subject and body give a bare mailto", () => {
  expect(mailtoUrl({ to: "x@y.edu", subject: "", body: "" })).toBe("mailto:x%40y.edu");
});
