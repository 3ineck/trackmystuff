import {
  SlashCommandBuilder,
  type ChatInputCommandInteraction,
} from "discord.js";
import { createPlanGroup } from "../api";
import { friendlyError } from "../errors";

export const groupCommand = {
  data: new SlashCommandBuilder()
    .setName("group")
    .setDescription("Create a new planning group in your app account")
    .addStringOption((o) =>
      o
        .setName("name")
        .setDescription("Group name")
        .setRequired(true)
        .setMaxLength(100),
    ),

  async execute(interaction: ChatInputCommandInteraction): Promise<void> {
    const name = interaction.options.getString("name", true);
    try {
      const group = await createPlanGroup({
        discordId: interaction.user.id,
        name,
      });
      await interaction.reply({
        content: `✅ Created group: **${group.name}**`,
        ephemeral: true,
      });
    } catch (err) {
      console.error("[/group] failed:", err);
      await interaction.reply({ content: friendlyError(err), ephemeral: true });
    }
  },
};
