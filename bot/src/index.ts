import {
  Client,
  Events,
  GatewayIntentBits,
  REST,
  Routes,
} from "discord.js";
import { env } from "./env";
import { commands } from "./commands";

async function registerGuildCommands(): Promise<void> {
  const rest = new REST({ version: "10" }).setToken(env.DISCORD_BOT_TOKEN);
  const body = Object.values(commands).map((c) => c.data.toJSON());
  await rest.put(
    Routes.applicationGuildCommands(env.DISCORD_CLIENT_ID, env.DISCORD_GUILD_ID),
    { body },
  );
  console.log(`[bot] registered ${body.length} guild command(s)`);
}

const client = new Client({ intents: [GatewayIntentBits.Guilds] });

client.once(Events.ClientReady, (c) => {
  console.log(`[bot] logged in as ${c.user.tag}`);
});

client.on(Events.InteractionCreate, async (interaction) => {
  if (interaction.isAutocomplete()) {
    const handler = commands[interaction.commandName];
    if (!handler?.autocomplete) {
      await interaction.respond([]).catch(() => {});
      return;
    }
    try {
      await handler.autocomplete(interaction);
    } catch (err) {
      console.error(
        `[bot] autocomplete error in /${interaction.commandName}:`,
        err,
      );
      await interaction.respond([]).catch(() => {});
    }
    return;
  }

  if (!interaction.isChatInputCommand()) return;
  const handler = commands[interaction.commandName];
  if (!handler) {
    await interaction.reply({
      content: `Unknown command \`/${interaction.commandName}\`.`,
      ephemeral: true,
    });
    return;
  }
  try {
    await handler.execute(interaction);
  } catch (err) {
    console.error(`[bot] unhandled error in /${interaction.commandName}:`, err);
    const message = "Something broke while handling that command.";
    if (interaction.deferred || interaction.replied) {
      await interaction.followUp({ content: message, ephemeral: true }).catch(() => {});
    } else {
      await interaction.reply({ content: message, ephemeral: true }).catch(() => {});
    }
  }
});

for (const sig of ["SIGINT", "SIGTERM"] as const) {
  process.on(sig, () => {
    console.log(`[bot] ${sig} received, shutting down`);
    void client.destroy().finally(() => process.exit(0));
  });
}

async function main(): Promise<void> {
  await registerGuildCommands();
  await client.login(env.DISCORD_BOT_TOKEN);
}

main().catch((err) => {
  console.error("[bot] fatal:", err);
  process.exit(1);
});
