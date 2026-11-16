import { ButtonInteraction, MessageFlags } from "discord.js";
import { WorkerStatus } from "@prisma/client";
import { getOrCreateWorker } from "../services/user.service";
import { getOrCreateAttempt, submitAnswer } from "../services/quiz.service";
import { promoteToTrial } from "../services/roles.service";
import { failedScreen, messageScreen, passedScreen, questionScreen } from "../ui/quiz";

// Depuis un message privé on met à jour, depuis un panneau public on répond en privé.
async function show(i: ButtonInteraction, payload: object) {
  if (i.message.flags.has(MessageFlags.Ephemeral)) await i.update(payload);
  else await i.reply({ ...payload, flags: MessageFlags.Ephemeral });
}

// quiz:start
// quiz:answer:attemptId:index:choix
export async function handleQuiz(i: ButtonInteraction, args: string[]) {
  const user = await getOrCreateWorker(i.user);
  const status = user.profile?.status ?? WorkerStatus.NEW;

  if (args[0] === "start") {
    if (status === WorkerStatus.TRIAL || status === WorkerStatus.VERIFIED) {
      return show(i, messageScreen("✅ ÉVALUATION DÉJÀ VALIDÉE", "Tu as déjà réussi l'évaluation."));
    }
    if (status === WorkerStatus.SUSPENDED) {
      return show(i, messageScreen("⛔ ACCÈS SUSPENDU", "Contacte l'assistance pour plus d'informations."));
    }
    if (status !== WorkerStatus.QUIZ_PENDING) {
      return show(
        i,
        messageScreen("📚 FORMATION REQUISE", "Termine d'abord la formation pour accéder à l'évaluation.", true),
      );
    }
    const attempt = await getOrCreateAttempt(user.id);
    return show(i, questionScreen(attempt.id, attempt.currentIndex));
  }

  if (args[0] === "answer") {
    const [, attemptId, index, choice] = args;
    const result = await submitAnswer(attemptId, user.id, Number(index), choice);

    switch (result.kind) {
      case "invalid":
        return void (await i.deferUpdate());
      case "stale":
        // Ancien bouton ou double clic : on réaffiche l'état réel
        if (result.finished) return void (await i.deferUpdate());
        return void (await i.update(questionScreen(result.attemptId, result.index)));
      case "next":
        return void (await i.update(questionScreen(result.attemptId, result.index)));
      case "finished": {
        if (!result.passed) return void (await i.update(failedScreen(result.score, result.total)));
        const { roleOk } = await promoteToTrial(i.guild, i.user.id, user.id);
        return void (await i.update(passedScreen(result.score, result.total, roleOk)));
      }
    }
  }
}
