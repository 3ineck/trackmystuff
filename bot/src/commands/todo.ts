import {
  SlashCommandBuilder,
  type ChatInputCommandInteraction,
} from "discord.js";
import { createTodo } from "../api";
import { friendlyError } from "../errors";

const DATE_RE = /^\d{4}-\d{2}-\d{2}$/;

export const todoCommand = {
  data: new SlashCommandBuilder()
    .setName("todo")
    .setDescription("Create a todo in your app account")
    .addStringOption((o) =>
      o
        .setName("title")
        .setDescription("Todo title")
        .setRequired(true)
        .setMaxLength(200),
    )
    .addStringOption((o) =>
      o
        .setName("description")
        .setDescription("Optional description")
        .setMaxLength(2000),
    )
    .addStringOption((o) =>
      o
        .setName("date")
        .setDescription("Optional due date (YYYY-MM-DD)")
        .setMinLength(10)
        .setMaxLength(10),
    ),

  async execute(interaction: ChatInputCommandInteraction): Promise<void> {
    const title = interaction.options.getString("title", true);
    const description = interaction.options.getString("description") ?? undefined;
    const rawDate = interaction.options.getString("date") ?? undefined;

    let dueAt: string | undefined;
    if (rawDate) {
      if (!DATE_RE.test(rawDate)) {
        await interaction.reply({
          content: "❌ `date` must be `YYYY-MM-DD` (e.g. `2026-09-08`).",
          ephemeral: true,
        });
        return;
      }
      const parsed = new Date(`${rawDate}T00:00:00.000Z`);
      if (Number.isNaN(parsed.getTime())) {
        await interaction.reply({
          content: `❌ \`${rawDate}\` is not a real date.`,
          ephemeral: true,
        });
        return;
      }
      dueAt = parsed.toISOString();
    }

    try {
      const created = await createTodo({
        discordId: interaction.user.id,
        title,
        description: description ?? null,
        dueAt: dueAt ?? null,
      });
      const suffix = created.dueAt ? ` · due ${rawDate}` : "";
      await interaction.reply({
        content: `✅ Created todo: **${created.title}**${suffix}`,
        ephemeral: true,
      });
    } catch (err) {
      const msg = friendlyError(err);
      console.error("[/todo] failed:", err);
      await interaction.reply({ content: msg, ephemeral: true });
    }
  },
};

