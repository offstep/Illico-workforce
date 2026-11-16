import { ButtonInteraction, MessageFlags } from "discord.js";
import { WorkerStatus } from "@prisma/client";
import { prisma } from "../db/client";
import { getOrCreateWorker, advanceStatus } from "../services/user.service";
import { logAction } from "../services/audit.service";
import { rulesScreen } from "../ui/start";
import { trainingPage } from "../ui/training";

// onboarding:start → règles (ou directement la formation si déjà acceptées)
// onboarding:accept → enregistre l'acceptation et ouvre la formation
export async function handleOnboarding(i: ButtonInteraction, args: string[]) {
  const user = await getOrCreateWorker(i.user);
  const action = args[0];

  if (action === "start") {
    if (user.profile?.rulesAccepted) {
      await i.reply({
        ...trainingPage(user.training?.currentPage ?? 0),
        flags: MessageFlags.Ephemeral,
      });
    } else {
      await logAction("onboarding.started", user.id);
      await i.reply({ ...rulesScreen(), flags: MessageFlags.Ephemeral });
    }
    return;
  }

  if (action === "accept") {
    await prisma.workerProfile.update({
      where: { userId: user.id },
      data: { rulesAccepted: true },
    });
    const moved = await advanceStatus(user.id, [WorkerStatus.NEW], WorkerStatus.TRAINING);
    if (moved) await logAction("onboarding.rules_accepted", user.id);
    await i.update(trainingPage(0));
  }
}
