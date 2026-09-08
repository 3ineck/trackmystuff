import {
  SlashCommandBuilder,
  type AutocompleteInteraction,
  type ChatInputCommandInteraction,
} from "discord.js";
import { createPlanItem, listPlanGroups } from "../api";
import { friendlyError } from "../errors";

const DATE_RE = /^\d{4}-\d{2}-\d{2}$/;

export const planningCommand = {
  data: new SlashCommandBuilder()
    .setName("planning")
    .setDescription("Create a planning item in one of your groups")
    .addStringOption((o) =>
      o
        .setName("title")
        .setDescription("Item title")
        .setRequired(true)
        .setMaxLength(200),
    )
    .addStringOption((o) =>
      o
        .setName("group")
        .setDescription("Which group to add it to")
        .setRequired(true)
        .setAutocomplete(true),
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
        .setDescription("Optional date (YYYY-MM-DD)")
        .setMinLength(10)
        .setMaxLength(10),
    ),

  async execute(interaction: ChatInputCommandInteraction): Promise<void> {
    const title = interaction.options.getString("title", true);
    const groupId = interaction.options.getString("group", true);
    const description = interaction.options.getString("description") ?? undefined;
    const rawDate = interaction.options.getString("date") ?? undefined;

    if (rawDate && !DATE_RE.test(rawDate)) {
      await interaction.reply({
        content: "❌ `date` must be `YYYY-MM-DD` (e.g. `2026-09-08`).",
        ephemeral: true,
      });
      return;
    }
    // Autocomplete gives us the group's cuid; if the user typed something free-form
    // we won't get a valid ID and the backend will 404 with group_not_found.

    try {
      const item = await createPlanItem({
        discordId: interaction.user.id,
        groupId,
        title,
        description: description ?? null,
        date: rawDate ?? null,
      });
      const suffix = rawDate ? ` · ${rawDate}` : "";
      await interaction.reply({
        content: `✅ Added to **${item.groupName}**: **${item.title}**${suffix}`,
        ephemeral: true,
      });
    } catch (err) {
      console.error("[/planning] failed:", err);
      await interaction.reply({ content: friendlyError(err), ephemeral: true });
    }
  },

  async autocomplete(interaction: AutocompleteInteraction): Promise<void> {
    const focused = interaction.options.getFocused(true);
    if (focused.name !== "group") {
      await interaction.respond([]);
      return;
    }
    try {
      const groups = await listPlanGroups(interaction.user.id);
      const query = focused.value.toLowerCase();
      const filtered = groups
        .filter((g) => g.name.toLowerCase().includes(query))
        .slice(0, 25)
        .map((g) => ({ name: g.name, value: g.id }));
      await interaction.respond(filtered);
    } catch (err) {
      console.error("[/planning autocomplete] failed:", err);
      await interaction.respond([]);
    }
  },
};
