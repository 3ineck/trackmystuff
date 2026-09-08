// Manual test harness for the daily summary. Run with:
//   docker compose exec backend npx tsx src/notifications/test-run.ts
// Bypasses HTTP auth so you don't need a session cookie.
import { runDailySummary } from "./dailySummary";

runDailySummary()
  .then(() => {
    console.log("test-run: done");
    process.exit(0);
  })
  .catch((err) => {
    console.error("test-run: unexpected error:", err);
    process.exit(1);
  });
