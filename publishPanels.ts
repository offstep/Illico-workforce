import {
  ChatInputCommandInteraction,
  PermissionFlagsBits,
  SlashCommandBuilder,
  TextChannel,
} from "discord.js";
import { getConfigValue } from "../config/guildConfig";
import { startPanel } from "../ui/start";
import { trainingPanel } from "../ui/training";
import { quizPanel } from "../ui/quiz";

export const publishCommand = new SlashCommandBuilder()
  .setName("publier-panneaux")
  .setDescription("Publie les panneaux interactifs (commencer, formation, évaluation)")
  .setDefaultMemberPermissions(PermissionFlagsBits.Administrator);

async function post(i: ChatInputCommandInteraction, key: string, payload: object) {
  const id = await getConfigValue(key);
  const channel = id ? ((await i.guild!.channels.fetch(id)) as TextChannel | null) : null;
  if (!channel) throw new Error(`Salon introuvable (${key}). Lance d'abord /setup-illico.`);
  await channel.send(payload);
}

export async function handlePublish(i: ChatInputCommandInteraction) {
  await i.deferReply({ ephemeral: true });
  try {
    await post(i, "ch.start", startPanel());
    await post(i, "ch.training", trainingPanel());
    await post(i, "ch.quiz", quizPanel());
    await i.editReply("✅ Panneaux publiés dans 🚀・commencer, 🎓・formation et 🧪・évaluation.");
  } catch (err) {
    await i.editReply(`❌ ${(err as Error).message}`);
  }
}
