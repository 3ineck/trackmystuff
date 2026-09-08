import cron from "node-cron";
import { env } from "../env";
import { runDailySummary } from "./dailySummary";

export function startNotificationScheduler(): void {
  if (
    !env.DISCORD_BOT_TOKEN ||
    !env.DISCORD_NOTIFICATION_CHANNEL_ID ||
    !env.NOTIFICATION_DISCORD_USER_ID
  ) {
    console.log("[notifications] disabled (missing env vars)");
    return;
  }
  if (!cron.validate(env.NOTIFICATION_CRON)) {
    console.error(
      `[notifications] invalid NOTIFICATION_CRON='${env.NOTIFICATION_CRON}'; scheduler not started`,
    );
    return;
  }
  cron.schedule(
    env.NOTIFICATION_CRON,
    () => {
      void runDailySummary();
    },
    { timezone: env.NOTIFICATION_TZ },
  );
  console.log(
    `[notifications] scheduled '${env.NOTIFICATION_CRON}' (${env.NOTIFICATION_TZ})`,
  );
}
