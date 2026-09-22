import { syncCanvas } from "./canvas/sync";
import { db } from "./db";

export const syncIntervalMs = 15 * 60 * 1000;
const firstRunDelayMs = 5 * 1000;

// Syncs every Canvas connection that has not synced within the interval, or all of them when forced.
export async function syncDueConnections(force = false) {
  const cutoff = new Date(Date.now() - syncIntervalMs);
  const connections = await db.connection.findMany({
    where: { type: "canvas", ...(force ? {} : { OR: [{ lastSyncAt: null }, { lastSyncAt: { lt: cutoff } }] }) },
  });
  const results = [];
  for (const connection of connections) {
    try {
      const counts = await syncCanvas(connection.id);
      if (counts) results.push({ connectionId: connection.id, ...counts });
    } catch (error) {
      console.error(`Canvas sync failed for connection ${connection.id}`, error);
    }
  }
  return results;
}

const timers = globalThis as { syncTimer?: NodeJS.Timeout };

export function startSyncTimer() {
  if (timers.syncTimer) return;
  const run = () => syncDueConnections().catch(console.error);
  timers.syncTimer = setInterval(run, syncIntervalMs);
  setTimeout(run, firstRunDelayMs);
}
