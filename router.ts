import { ButtonInteraction, Interaction, MessageFlags } from "discord.js";
import { handleOnboarding } from "./onboarding";
import { handleTraining } from "./training";
import { handleQuiz } from "./quiz";
import { handleSetup } from "../setup/setupServer";
import { handlePublish } from "../setup/publishPanels";

type ButtonHandler = (i: ButtonInteraction, args: string[]) => Promise<void>;

// customId = "module:action:arg1:arg2..."
const buttons: Record<string, ButtonHandler> = {
  onboarding: handleOnboarding,
  training: handleTraining,
  quiz: handleQuiz,
};

export async function routeInteraction(i: Interaction) {
  try {
    if (i.isChatInputCommand()) {
      if (i.commandName === "setup-illico") return await handleSetup(i);
      if (i.commandName === "publier-panneaux") return await handlePublish(i);
      return;
    }

    if (i.isButton()) {
      const [module, ...args] = i.customId.split(":");
      const handler = buttons[module];
      if (handler) await handler(i, args);
    }
  } catch (err) {
    console.error("Interaction error:", err);
    if (i.isRepliable()) {
      const msg = { content: "❌ Une erreur est survenue. Réessaie dans un instant.", flags: MessageFlags.Ephemeral } as const;
      if (i.replied || i.deferred) await i.followUp(msg).catch(() => {});
      else await i.reply(msg).catch(() => {});
    }
  }
}
