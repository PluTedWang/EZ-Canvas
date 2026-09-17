import { expect, test } from "vitest";
import { institutionFromHost, normalizeBaseUrl } from "../lib/canvas/host";

test("normalizeBaseUrl accepts hosts, urls and paths and returns the origin", () => {
  expect(normalizeBaseUrl("canvas.cornell.edu")).toBe("https://canvas.cornell.edu");
  expect(normalizeBaseUrl(" https://cornell.instructure.com/courses/1 ")).toBe("https://cornell.instructure.com");
  expect(normalizeBaseUrl("http://localhost:3100/")).toBe("http://localhost:3100");
  expect(normalizeBaseUrl("")).toBeNull();
  expect(normalizeBaseUrl("not a url")).toBeNull();
});

test("institutionFromHost picks the school label", () => {
  expect(institutionFromHost("https://canvas.cornell.edu")).toBe("Cornell");
  expect(institutionFromHost("https://cornell.instructure.com")).toBe("Cornell");
  expect(institutionFromHost("https://canvas.instructure.com")).toBe("Instructure");
  expect(institutionFromHost("https://lms.example.org")).toBe("Lms");
});
