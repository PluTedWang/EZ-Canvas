import { expect, test } from "vitest";
import { initials } from "../components/UserRow";

test("initials take the first letter of the first two words", () => {
  expect(initials("Ted Wang")).toBe("TW");
  expect(initials("Mina Kim Lee")).toBe("MK");
  expect(initials("  diego  ")).toBe("D");
  expect(initials("ted@example.edu")).toBe("T");
});
