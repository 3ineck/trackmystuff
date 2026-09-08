import { endOfDay, format, startOfDay } from "date-fns";
import type { CalendarEvent, PlanItem, Todo } from "@prisma/client";
import { prisma } from "../prisma";
import { env } from "../env";
import { sendChannelMessage, type DiscordEmbed } from "../lib/discord";
import { occurrencesOnDay } from "../lib/eventOccurrences";

const ACCENT_COLOR = 0x22c55e;

export async function runDailySummary(now: Date = new Date()): Promise<void> {
  const channelId = env.DISCORD_NOTIFICATION_CHANNEL_ID;
  const discordUserId = env.NOTIFICATION_DISCORD_USER_ID;
  if (!env.DISCORD_BOT_TOKEN || !channelId || !discordUserId) {
    console.warn("[notifications] runDailySummary skipped: missing env vars");
    return;
  }

  try {
    const user = await prisma.user.findUnique({
      where: { discordId: discordUserId },
      select: { id: true },
    });
    if (!user) {
      console.warn(
        `[notifications] no user found with discordId=${discordUserId}; skipping`,
      );
      return;
    }

    const from = startOfDay(now);
    const to = endOfDay(now);

    const [events, todos, planItems] = await Promise.all([
      prisma.calendarEvent.findMany({ where: { userId: user.id } }),
      prisma.todo.findMany({
        where: {
          userId: user.id,
          archivedAt: null,
          dueHasTime: true,
          dueAt: { gte: from, lte: to },
        },
        orderBy: { dueAt: "asc" },
      }),
      prisma.planItem.findMany({
        where: {
          group: { userId: user.id },
          done: false,
          OR: [
            {
              AND: [
                { startsAt: { lte: to } },
                { endsAt: { gte: from } },
              ],
            },
            {
              AND: [
                { startsAt: null },
                { endsAt: { gte: from, lte: to } },
              ],
            },
            {
              AND: [
                { endsAt: null },
                { startsAt: { gte: from, lte: to } },
              ],
            },
          ],
        },
        include: { group: { select: { name: true } } },
        orderBy: [{ startsAt: "asc" }, { endsAt: "asc" }],
      }),
    ]);

    const todayOccurrences = occurrencesOnDay(events, now);

    const embed = buildEmbed(now, todayOccurrences, todos, planItems);
    await sendChannelMessage(channelId, { embeds: [embed] });
    console.log(
      `[notifications] daily summary sent (events=${todayOccurrences.length} todos=${todos.length} plans=${planItems.length})`,
    );
  } catch (err) {
    console.error("[notifications] runDailySummary failed:", err);
  }
}

type PlanItemWithGroup = PlanItem & { group: { name: string } };

function buildEmbed(
  now: Date,
  events: { event: CalendarEvent; occurrenceStart: Date }[],
  todos: Todo[],
  planItems: PlanItemWithGroup[],
): DiscordEmbed {
  const sections: string[] = [];

  if (events.length > 0) {
    const lines = events.map(({ event, occurrenceStart }) => {
      const time = format(occurrenceStart, "HH:mm");
      return `• **${time}** — ${event.title} _(${event.durationMinutes} min)_`;
    });
    sections.push(`**📆 Events**\n${lines.join("\n")}`);
  }

  if (todos.length > 0) {
    const lines = todos.map((todo) => {
      const time = todo.dueAt ? format(new Date(todo.dueAt), "HH:mm") : "";
      return `• **${time}** — ${todo.title}`;
    });
    sections.push(`**✅ Timed todos**\n${lines.join("\n")}`);
  }

  if (planItems.length > 0) {
    const lines = planItems.map((item) => {
      const range = formatRange(item.startsAt, item.endsAt);
      return `• ${item.title} _(${item.group.name})_${range ? ` · ${range}` : ""}`;
    });
    sections.push(`**🗂️ Planning**\n${lines.join("\n")}`);
  }

  const description =
    sections.length > 0
      ? sections.join("\n\n")
      : "Nothing scheduled today. 🎉";

  return {
    title: `📅 Today · ${format(now, "EEEE, MMM d")}`,
    color: ACCENT_COLOR,
    description,
  };
}

function formatRange(startsAt: Date | null, endsAt: Date | null): string | null {
  if (!startsAt && !endsAt) return null;
  const s = startsAt ? format(startsAt, "MMM d") : null;
  const e = endsAt ? format(endsAt, "MMM d") : null;
  if (s && e) return `${s} – ${e}`;
  if (s) return `from ${s}`;
  return `until ${e}`;
}
