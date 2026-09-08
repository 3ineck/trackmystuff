import { Router } from "express";
import { requireAuth } from "../auth/middleware";
import { runDailySummary } from "../notifications/dailySummary";

export const notificationsRouter = Router();

notificationsRouter.use(requireAuth);

notificationsRouter.post("/test", async (_req, res) => {
  try {
    await runDailySummary();
    res.json({ ok: true });
  } catch (err) {
    console.error("/notifications/test failed:", err);
    res.status(500).json({
      error: "notification_failed",
      message: err instanceof Error ? err.message : String(err),
    });
  }
});
