import { expect, test } from "vitest";
import assignments101 from "../fixtures/canvas/assignments-101.json";
import assignments104 from "../fixtures/canvas/assignments-104.json";
import { mapAssignment } from "../lib/canvas/map";
import { hoursLeft, predictHours } from "../lib/predict";
import type { CanvasAssignment } from "../lib/canvas/types";

// The mapped assignment is what the screens hold, so predict from that shape rather than raw Canvas.
function predictFixture(raw: CanvasAssignment) {
  const mapped = mapAssignment(raw);
  return predictHours({
    submissionType: mapped.submissionType,
    points: mapped.points,
    rubricSections: Array.isArray(mapped.rubric) ? mapped.rubric.length : 0,
    descriptionLength: mapped.description?.length ?? 0,
  });
}

test("a long rubric heavy upload predicts more hours than a short one", () => {
  const [hw1, hw2] = assignments101 as unknown as CanvasAssignment[];
  expect(predictFixture(hw1).hours).toBe(5);
  expect(predictFixture(hw2).hours).toBe(6);
});

test("points drive the prediction for a Gradescope problem set", () => {
  const ps3 = (assignments104 as unknown as CanvasAssignment[])[1];
  expect(predictFixture(ps3).hours).toBe(5);
});

test("drivers name every number that moved the prediction", () => {
  const hw2 = (assignments101 as unknown as CanvasAssignment[])[1];
  expect(predictFixture(hw2).drivers).toEqual([
    { key: "type", value: "online_upload" },
    { key: "points", value: 100 },
    { key: "rubric", value: 4 },
    { key: "length", value: 781 },
  ]);
});

test("an assignment with no points, rubric or description reports only its type", () => {
  const prediction = predictHours({ submissionType: "discussion_topic", points: null, rubricSections: 0, descriptionLength: 0 });
  expect(prediction).toEqual({ hours: 0.5, drivers: [{ key: "type", value: "discussion_topic" }] });
});

test("an unknown submission type falls back to the default base", () => {
  expect(predictHours({ submissionType: "media_recording", points: 50, rubricSections: 0, descriptionLength: 0 }).hours).toBe(3);
});

test("the prediction is capped so a huge point value cannot run away", () => {
  expect(predictHours({ submissionType: "online_upload", points: 5000, rubricSections: 0, descriptionLength: 0 }).hours).toBe(20);
});

test("hours left rounds to the half hour and never goes negative", () => {
  expect(hoursLeft(6, 4)).toBe(2);
  expect(hoursLeft(6, 4.3)).toBe(1.5);
  expect(hoursLeft(6, 9)).toBe(0);
});
