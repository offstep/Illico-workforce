import "dotenv/config";
import { Client, Events, GatewayIntentBits } from "discord.js";
import { routeInteraction } from "./interactions/router";
import { setupCommand } from "./setup/setupServer";
import { publishCommand } from "./setup/publishPanels";
import { bindAuditClient } from "./services/audit.service";

const client = new Client({ intents: [GatewayIntentBits.Guilds] });

client.once(Events.ClientReady, async (c) => {
  bindAuditClient(c);

  // Enregistrement des commandes admin sur le serveur ILLICO
  const guild = await c.guilds.fetch(process.env.GUILD_ID!);
  await guild.commands.set([setupCommand.toJSON(), publishCommand.toJSON()]);

  console.log(`✅ ILLICO Bot connecté : ${c.user.tag}`);
});

client.on(Events.InteractionCreate, routeInteraction);

client.login(process.env.DISCORD_TOKEN);
