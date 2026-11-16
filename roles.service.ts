import { Guild } from "discord.js";
import { WorkerStatus } from "@prisma/client";
import { prisma } from "../db/client";
import { getConfigValue } from "../config/guildConfig";
import { advanceStatus } from "./user.service";
import { logAction } from "./audit.service";

// Ajoute un rôle (et retire éventuellement le précédent). Retourne false si Discord refuse.
async function swapRole(
  guild: Guild | null,
  discordId: string,
  addKey: string,
  removeKey?: string,
): Promise<boolean> {
  try {
    if (!guild) throw new Error("Serveur introuvable");
    const member = await guild.members.fetch(discordId);
    const addId = await getConfigValue(addKey);
    if (!addId) throw new Error(`Rôle ${addKey} non configuré (lance /setup-illico)`);

    if (removeKey) {
      const removeId = await getConfigValue(removeKey);
      if (removeId && member.roles.cache.has(removeId)) await member.roles.remove(removeId);
    }
    await member.roles.add(addId);
    return true;
  } catch (err) {
    console.error("Role error:", err);
    return false;
  }
}

// Quiz réussi : QUIZ_PENDING → TRIAL + rôle 🟡
export async function promoteToTrial(guild: Guild | null, discordId: string, userId: string) {
  const moved = await advanceStatus(userId, [WorkerStatus.QUIZ_PENDING], WorkerStatus.TRIAL);
  if (!moved) return { moved: false, roleOk: true };

  await prisma.workerProfile.update({
    where: { userId },
    data: { trialStartedAt: new Date() },
  });
  const roleOk = await swapRole(guild, discordId, "role.trial");
  await logAction("role.assigned", userId, { role: "trial", roleOk });
  return { moved: true, roleOk };
}

// Mission d'essai validée : TRIAL → VERIFIED, rôle 🟡 retiré, rôle ✅ ajouté (utilisé à l'étape QA)
export async function promoteToVerified(guild: Guild | null, discordId: string, userId: string) {
  const moved = await advanceStatus(userId, [WorkerStatus.TRIAL], WorkerStatus.VERIFIED);
  if (!moved) return { moved: false, roleOk: true };

  await prisma.workerProfile.update({
    where: { userId },
    data: { verifiedAt: new Date() },
  });
  const roleOk = await swapRole(guild, discordId, "role.verified", "role.trial");
  await logAction("role.assigned", userId, { role: "verified", roleOk });
  return { moved: true, roleOk };
}
