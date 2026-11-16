import { ActionRowBuilder, ButtonBuilder, ButtonStyle } from "discord.js";
import { baseEmbed } from "./theme";
import { RULES_TEXT } from "../content/training";

// Panneau public affiché dans 🚀・commencer
export function startPanel() {
  const embed = baseEmbed()
    .setTitle("🚀 BIENVENUE CHEZ ILLICO")
    .setDescription(
      [
        "Bienvenue dans ton espace de travail.",
        "",
        "**Apprendre → Évaluer → Tester → Produire → Livrer → Progresser**",
        "",
        "**Ton parcours**",
        "🔒 Règles",
        "📚 Formation",
        "🧪 Évaluation",
        "🟡 Mission d'essai",
        "✅ Validation",
      ].join("\n"),
    );
  const row = new ActionRowBuilder<ButtonBuilder>().addComponents(
    new ButtonBuilder()
      .setCustomId("onboarding:start")
      .setLabel("🚀 COMMENCER")
      .setStyle(ButtonStyle.Primary),
  );
  return { embeds: [embed], components: [row] };
}

// Écran des règles (privé), avec acceptation obligatoire
export function rulesScreen() {
  const embed = baseEmbed()
    .setTitle("📜 RÈGLES ILLICO")
    .setDescription(`${RULES_TEXT}\n\nEn continuant, tu acceptes ces règles.`);
  const row = new ActionRowBuilder<ButtonBuilder>().addComponents(
    new ButtonBuilder()
      .setCustomId("onboarding:accept")
      .setLabel("✅ J'accepte et je continue")
      .setStyle(ButtonStyle.Success),
  );
  return { embeds: [embed], components: [row] };
}
