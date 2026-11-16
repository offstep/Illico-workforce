import { ButtonInteraction, MessageFlags } from "discord.js";

// Temporaire : remplacé par la mission d'essai à l'étape suivante.
export async function handleTrial(i: ButtonInteraction, _args: string[]) {
  await i.reply({
    content: "📋 Ta mission d'essai arrive très bientôt.",
    flags: MessageFlags.Ephemeral,
  });
}
