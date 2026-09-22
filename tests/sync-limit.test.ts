import { expect, test } from "vitest";
import { eachLimited } from "../lib/canvas/sync";

const tick = () => new Promise((resolve) => setTimeout(resolve, 1));

test("eachLimited keeps at most the limit in flight and returns results in order", async () => {
  let inFlight = 0;
  let peak = 0;
  const results = await eachLimited([5, 1, 4, 2, 3], 2, async (n) => {
    inFlight += 1;
    peak = Math.max(peak, inFlight);
    for (let i = 0; i < n; i += 1) await tick();
    inFlight -= 1;
    return n * 10;
  });
  expect(results).toEqual([50, 10, 40, 20, 30]);
  expect(peak).toBe(2);
});

test("eachLimited handles an empty list and a limit above the item count", async () => {
  expect(await eachLimited([], 3, async (n: number) => n)).toEqual([]);
  expect(await eachLimited([1], 3, async (n) => n + 1)).toEqual([2]);
});
