import { ActionRowBuilder, ButtonBuilder, ButtonStyle } from "discord.js";
import { baseEmbed, progressBar } from "./theme";
import { TRAINING_PAGES } from "../content/training";

// Panneau public affiché dans 🎓・formation
export function trainingPanel() {
  const embed = baseEmbed()
    .setTitle("🎓 FORMATION ILLICO")
    .setDescription(
      [
        "Avant de commencer tes missions, découvre :",
        "",
        "📜 Règles du serveur",
        "📚 Méthodes de travail",
        "🔐 Confidentialité",
        "🔎 Standards de qualité",
      ].join("\n"),
    );
  const row = new ActionRowBuilder<ButtonBuilder>().addComponents(
    new ButtonBuilder()
      .setCustomId("training:open")
      .setLabel("📖 Commencer la formation")
      .setStyle(ButtonStyle.Primary),
  );
  return { embeds: [embed], components: [row] };
}

// Une page de formation (privée), avec navigation
export function trainingPage(page: number) {
  const total = TRAINING_PAGES.length;
  const p = TRAINING_PAGES[page];
  const pct = Math.round(((page + 1) / total) * 100);

  const embed = baseEmbed()
    .setTitle(p.title)
    .setDescription(p.body)
    .setFooter({ text: `Page ${page + 1}/${total}  ${progressBar(pct)}` });

  const row = new ActionRowBuilder<ButtonBuilder>().addComponents(
    new ButtonBuilder()
      .setCustomId(`training:page:${page - 1}`)
      .setLabel("⬅️ Retour")
      .setStyle(ButtonStyle.Secondary)
      .setDisabled(page === 0),
  );

  if (page < total - 1) {
    row.addComponents(
      new ButtonBuilder()
        .setCustomId(`training:page:${page + 1}`)
        .setLabel("Suivant ➡️")
        .setStyle(ButtonStyle.Primary),
    );
  } else {
    row.addComponents(
      new ButtonBuilder()
        .setCustomId("quiz:start")
        .setLabel("🧪 Passer l'évaluation")
        .setStyle(ButtonStyle.Success),
    );
  }
  return { embeds: [embed], components: [row] };
}
