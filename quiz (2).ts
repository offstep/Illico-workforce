import { ActionRowBuilder, ButtonBuilder, ButtonStyle } from "discord.js";
import { baseEmbed, progressBar } from "./theme";
import { PASS_PERCENT, QUIZ_QUESTIONS } from "../content/quiz";

const row = (...b: ButtonBuilder[]) => new ActionRowBuilder<ButtonBuilder>().addComponents(...b);

// Panneau public affiché dans 🧪・évaluation
export function quizPanel() {
  const embed = baseEmbed()
    .setTitle("🧪 ÉVALUATION ILLICO")
    .setDescription(
      [
        `${QUIZ_QUESTIONS.length} questions · note minimale : ${PASS_PERCENT} %`,
        "",
        "Tu peux retenter l'évaluation autant de fois que nécessaire.",
        "Pense à terminer la formation avant de commencer.",
      ].join("\n"),
    );
  return {
    embeds: [embed],
    components: [
      row(
        new ButtonBuilder()
          .setCustomId("quiz:start")
          .setLabel("🧪 Passer l'évaluation")
          .setStyle(ButtonStyle.Primary),
      ),
    ],
  };
}

// Une question : options dans l'embed (lisible sur mobile), boutons A/B/C/D
export function questionScreen(attemptId: string, index: number) {
  const q = QUIZ_QUESTIONS[index];
  const total = QUIZ_QUESTIONS.length;

  const embed = baseEmbed()
    .setTitle("🧪 ÉVALUATION ILLICO")
    .setDescription(
      [
        `**Question ${index + 1} / ${total}**`,
        "",
        q.question,
        "",
        ...Object.entries(q.options).map(([k, v]) => `**${k}** — ${v}`),
      ].join("\n"),
    )
    .setFooter({ text: progressBar(Math.round((index / total) * 100)) });

  const buttons = (["A", "B", "C", "D"] as const).map((letter) =>
    new ButtonBuilder()
      .setCustomId(`quiz:answer:${attemptId}:${index}:${letter}`)
      .setLabel(letter)
      .setStyle(ButtonStyle.Secondary),
  );
  return { embeds: [embed], components: [row(...buttons)] };
}

export function passedScreen(score: number, total: number, roleOk: boolean) {
  const pct = Math.round((score / total) * 100);
  const lines = [
    `**${score} / ${total}**`,
    `**${pct} %**`,
    "",
    "✅ **ÉVALUATION RÉUSSIE**",
    "",
    "Tu passes maintenant au statut :",
    "🟡 **WORKER EN ESSAI**",
  ];
  if (!roleOk) {
    lines.push("", "⚠️ Ton rôle n'a pas pu être attribué automatiquement. Un responsable va le faire.");
  }
  return {
    embeds: [baseEmbed().setTitle("🎯 RÉSULTAT").setDescription(lines.join("\n"))],
    components: [
      row(
        new ButtonBuilder()
          .setCustomId("trial:open")
          .setLabel("📋 Voir ma mission d'essai")
          .setStyle(ButtonStyle.Success),
      ),
    ],
  };
}

export function failedScreen(score: number, total: number) {
  const pct = Math.round((score / total) * 100);
  const description = [
    `Score : **${score} / ${total}** (${pct} %)`,
    `Minimum requis : ${PASS_PERCENT} %`,
    "",
    "Revois la formation puis retente l'évaluation.",
  ].join("\n");
  return {
    embeds: [baseEmbed().setTitle("❌ ÉVALUATION NON VALIDÉE").setDescription(description)],
    components: [
      row(
        new ButtonBuilder()
          .setCustomId("training:page:0")
          .setLabel("📚 Revoir la formation")
          .setStyle(ButtonStyle.Secondary),
        new ButtonBuilder()
          .setCustomId("quiz:start")
          .setLabel("🔄 Réessayer")
          .setStyle(ButtonStyle.Primary),
      ),
    ],
  };
}

export function messageScreen(title: string, text: string, withTraining = false) {
  const comps = withTraining
    ? [
        row(
          new ButtonBuilder()
            .setCustomId("training:open")
            .setLabel("📖 Ouvrir la formation")
            .setStyle(ButtonStyle.Primary),
        ),
      ]
    : [];
  return { embeds: [baseEmbed().setTitle(title).setDescription(text)], components: comps };
}
