// Runs once when the Next.js server starts; the timer keeps Canvas data fresh.
export async function register() {
  if (process.env.NEXT_RUNTIME === "nodejs") {
    const { startSyncTimer } = await import("./lib/jobs");
    startSyncTimer();
  }
}
