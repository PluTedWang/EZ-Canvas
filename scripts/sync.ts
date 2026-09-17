// Syncs every Canvas connection now and prints the counts.
// Usage: npm run sync   (CANVAS_MOCK=1 to sync the fixtures)
import { syncDueConnections } from "../lib/jobs";
import { db } from "../lib/db";

async function main() {
  const results = await syncDueConnections(true);
  if (results.length === 0) console.log("No Canvas connections to sync.");
  for (const r of results) {
    console.log(
      `${r.connectionId}: ${r.courses} courses, ${r.assignments} assignments, ${r.materials} materials, ${r.lectures} lectures, ${r.groups} groups`,
    );
  }
  await db.$disconnect();
}

main();
