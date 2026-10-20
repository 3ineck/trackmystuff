import { Router } from "express";
import { requireAuth } from "../auth/middleware";
import { env } from "../env";
import { runDailySummary } from "../notifications/dailySummary";

export const notificationsRouter = Router();

notificationsRouter.use(requireAuth);

notificationsRouter.post("/test", async (req, res) => {
  // The summary posts NOTIFICATION_DISCORD_USER_ID's data to a shared channel,
  // so only that user may trigger it.
  if (!env.NOTIFICATION_DISCORD_USER_ID || req.user!.discordId !== env.NOTIFICATION_DISCORD_USER_ID) {
    res.status(403).json({ error: "forbidden" });
    return;
  }
  try {
    await runDailySummary();
    res.json({ ok: true });
  } catch (err) {
    console.error("/notifications/test failed:", err);
    res.status(500).json({ error: "notification_failed" });
  }
});
