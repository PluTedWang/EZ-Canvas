import { expect, test } from "vitest";
import { parseAssignment, parseQuestions } from "../lib/ai/prompts/parse-assignment";
import { AiError } from "../lib/ai/types";

const reply = JSON.stringify({
  questions: [
    { label: "1", title: "Draw the context diagram", points: 20, wording: "Draw a system context diagram for the parking garage." },
    { label: "3b", title: "List non-functional requirements", points: 15, wording: "List five non-functional requirements." },
  ],
});

test("a well formed reply becomes questions", () => {
  expect(parseQuestions(reply)).toEqual([
    { label: "1", title: "Draw the context diagram", points: 20, wording: "Draw a system context diagram for the parking garage." },
    { label: "3b", title: "List non-functional requirements", points: 15, wording: "List five non-functional requirements." },
  ]);
});

test("missing points become null rather than zero", () => {
  const questions = parseQuestions('{"questions":[{"label":"1","title":"Do the thing"}]}');
  expect(questions[0].points).toBeNull();
  expect(questions[0].wording).toBe("");
});

test("a non numeric points value is treated as missing", () => {
  expect(parseQuestions('{"questions":[{"label":"1","title":"x","points":"twenty"}]}')[0].points).toBeNull();
  expect(parseQuestions('{"questions":[{"label":"1","title":"x","points":null}]}')[0].points).toBeNull();
});

test("a question with neither a label nor a title is dropped", () => {
  expect(parseQuestions('{"questions":[{"points":5},{"label":"2","title":"Kept"}]}')).toEqual([
    { label: "2", title: "Kept", points: null, wording: "" },
  ]);
});

test("a label without a title is still kept", () => {
  expect(parseQuestions('{"questions":[{"label":"Part A"}]}')).toEqual([{ label: "Part A", title: "", points: null, wording: "" }]);
});

test("the list is capped so one reply cannot flood the pane", () => {
  const many = { questions: Array.from({ length: 40 }, (_, i) => ({ label: String(i), title: "x" })) };
  expect(parseQuestions(JSON.stringify(many))).toHaveLength(20);
});

test("an assignment with no questions gives an empty list, not an error", () => {
  expect(parseQuestions('{"questions":[]}')).toEqual([]);
  expect(parseQuestions("{}")).toEqual([]);
});

test("a reply that is not JSON is rejected", () => {
  expect(() => parseQuestions("There are three questions.")).toThrow(AiError);
});

test("the description and the attachment text are both sent, truncated together", async () => {
  let sent = "";
  const provider = {
    complete: async (input: { messages: { content: string }[] }) => {
      sent = input.messages[0].content;
      return reply;
    },
  };
  await parseAssignment(provider, {
    title: "HW 2",
    description: "Answer all parts.",
    attachmentText: "y".repeat(50000),
  });
  expect(sent).toContain("HW 2");
  expect(sent).toContain("Answer all parts.");
  expect(sent.length).toBe(40000);
});
