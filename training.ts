import { ButtonInteraction, MessageFlags } from "discord.js";
import { getOrCreateWorker } from "../services/user.service";
import { goToPage } from "../services/training.service";
import { rulesScreen } from "../ui/start";
import { trainingPage } from "../ui/training";

// training:open → ouvre la formation depuis le panneau public
// training:page:N → navigation entre les pages
export async function handleTraining(i: ButtonInteraction, args: string[]) {
  const user = await getOrCreateWorker(i.user);

  if (!user.profile?.rulesAccepted) {
    await i.reply({ ...rulesScreen(), flags: MessageFlags.Ephemeral });
    return;
  }

  if (args[0] === "open") {
    await i.reply({
      ...trainingPage(user.training?.currentPage ?? 0),
      flags: MessageFlags.Ephemeral,
    });
    return;
  }

  if (args[0] === "page") {
    const page = await goToPage(user.id, Number(args[1]));
    await i.update(trainingPage(page));
  }
}
