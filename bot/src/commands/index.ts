import type {
  AutocompleteInteraction,
  ChatInputCommandInteraction,
  SlashCommandOptionsOnlyBuilder,
} from "discord.js";
import { todoCommand } from "./todo";
import { groupCommand } from "./group";
import { planningCommand } from "./planning";

export interface BotCommand {
  data: SlashCommandOptionsOnlyBuilder;
  execute: (interaction: ChatInputCommandInteraction) => Promise<void>;
  autocomplete?: (interaction: AutocompleteInteraction) => Promise<void>;
}

export const commands: Record<string, BotCommand> = {
  todo: todoCommand,
  group: groupCommand,
  planning: planningCommand,
};
