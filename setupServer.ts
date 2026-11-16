import {
  ChannelType,
  ChatInputCommandInteraction,
  Guild,
  OverwriteResolvable,
  PermissionFlagsBits as P,
  Role,
  SlashCommandBuilder,
  TextChannel,
} from "discord.js";
import { prisma } from "../db/client";

export const THEME = {
  color: 0x7c3aed, // violet ILLICO
  dark: 0x18181b,
};

export const setupCommand = new SlashCommandBuilder()
  .setName("setup-illico")
  .setDescription("Crée les rôles et salons ILLICO (idempotent)")
  .setDefaultMemberPermissions(P.Administrator);

// ───────── Helpers ─────────

async function saveConfig(key: string, value: string) {
  await prisma.guildConfig.upsert({
    where: { key },
    update: { value },
    create: { key, value },
  });
}

async function ensureRole(guild: Guild, key: string, name: string, color: number): Promise<Role> {
  const saved = await prisma.guildConfig.findUnique({ where: { key } });
  const existing =
    (saved && guild.roles.cache.get(saved.value)) ||
    guild.roles.cache.find((r) => r.name === name);
  const role = existing ?? (await guild.roles.create({ name, color, mentionable: false }));
  await saveConfig(key, role.id);
  return role;
}

async function ensureCategory(guild: Guild, name: string, overwrites: OverwriteResolvable[]) {
  const existing = guild.channels.cache.find(
    (c) => c.type === ChannelType.GuildCategory && c.name === name,
  );
  if (existing) return existing.id;
  const cat = await guild.channels.create({
    name,
    type: ChannelType.GuildCategory,
    permissionOverwrites: overwrites,
  });
  return cat.id;
}

async function ensureChannel(
  guild: Guild,
  key: string,
  name: string,
  parentId: string,
  overwrites?: OverwriteResolvable[],
): Promise<TextChannel> {
  const saved = await prisma.guildConfig.findUnique({ where: { key } });
  const existing =
    (saved && (guild.channels.cache.get(saved.value) as TextChannel | undefined)) ||
    (guild.channels.cache.find(
      (c) => c.type === ChannelType.GuildText && c.name === name && c.parentId === parentId,
    ) as TextChannel | undefined);
  const channel =
    existing ??
    (await guild.channels.create({
      name,
      type: ChannelType.GuildText,
      parent: parentId,
      permissionOverwrites: overwrites,
    }));
  await saveConfig(key, channel.id);
  return channel;
}

// ───────── Setup principal ─────────

export async function setupServer(guild: Guild) {
  await guild.roles.fetch();
  await guild.channels.fetch();

  // Rôles
  const trial = await ensureRole(guild, "role.trial", "🟡 Worker en essai", 0xeab308);
  const verified = await ensureRole(guild, "role.verified", "✅ Worker vérifié", 0x22c55e);
  const qa = await ensureRole(guild, "role.qa", "🔎 QA", 0x7c3aed);
  const manager = await ensureRole(guild, "role.manager", "🛠️ Responsable", 0x6d28d9);
  const founder = await ensureRole(guild, "role.founder", "👑 Fondateur", 0x4c1d95);

  const everyone = guild.roles.everyone.id;
  const botId = guild.members.me!.id;

  const readOnly = [P.ViewChannel, P.ReadMessageHistory];
  const staff = [qa.id, manager.id, founder.id];

  // Lecture seule : pas d'envoi de messages, les workers passent par les boutons
  const readOnlyFor = (id: string): OverwriteResolvable => ({
    id,
    allow: readOnly,
    deny: [P.SendMessages, P.AddReactions, P.CreatePublicThreads],
  });
  const botAccess: OverwriteResolvable = {
    id: botId,
    allow: [P.ViewChannel, P.SendMessages, P.EmbedLinks, P.ManageChannels, P.ManageRoles, P.ReadMessageHistory],
  };

  // Catégorie ACCUEIL : visible par tous, lecture seule
  const welcomeCat = await ensureCategory(guild, "🚀 ACCUEIL", [
    readOnlyFor(everyone),
    botAccess,
  ]);
  await ensureChannel(guild, "ch.start", "🚀・commencer", welcomeCat);
  await ensureChannel(guild, "ch.training", "🎓・formation", welcomeCat);
  await ensureChannel(guild, "ch.quiz", "🧪・évaluation", welcomeCat);

  // Catégorie TRAVAIL : réservée aux workers en essai / vérifiés + staff
  const workOverwrites: OverwriteResolvable[] = [
    { id: everyone, deny: [P.ViewChannel] },
    readOnlyFor(trial.id),
    readOnlyFor(verified.id),
    ...staff.map(readOnlyFor),
    botAccess,
  ];
  const workCat = await ensureCategory(guild, "📋 TRAVAIL", workOverwrites);
  await ensureChannel(guild, "ch.deliver", "🎫・livrer-une-mission", workCat);
  await ensureChannel(guild, "ch.support", "🎫・ouvrir-un-ticket", workCat);

  // Salons réservés aux vérifiés (V2, créés dès maintenant pour figer la structure)
  const verifiedOnly: OverwriteResolvable[] = [
    { id: everyone, deny: [P.ViewChannel] },
    { id: trial.id, deny: [P.ViewChannel] },
    readOnlyFor(verified.id),
    ...staff.map(readOnlyFor),
    botAccess,
  ];
  await ensureChannel(guild, "ch.missions", "📋・opportunités", workCat, verifiedOnly);
  await ensureChannel(guild, "ch.payments", "💳・paiements", workCat, verifiedOnly);

  // Catégorie STAFF : QA, direction, logs
  const staffOverwrites: OverwriteResolvable[] = [
    { id: everyone, deny: [P.ViewChannel] },
    ...staff.map((id) => ({
      id,
      allow: [P.ViewChannel, P.ReadMessageHistory],
      deny: [P.SendMessages],
    })),
    botAccess,
  ];
  const staffCat = await ensureCategory(guild, "🔒 STAFF", staffOverwrites);
  await ensureChannel(guild, "ch.qa", "🔎・contrôle-qualité", staffCat);
  await ensureChannel(guild, "ch.direction", "👑・direction", staffCat, [
    { id: everyone, deny: [P.ViewChannel] },
    { id: manager.id, allow: [P.ViewChannel, P.ReadMessageHistory], deny: [P.SendMessages] },
    { id: founder.id, allow: [P.ViewChannel, P.ReadMessageHistory], deny: [P.SendMessages] },
    botAccess,
  ]);
  await ensureChannel(guild, "ch.logs", "📜・logs", staffCat, [
    { id: everyone, deny: [P.ViewChannel] },
    { id: founder.id, allow: [P.ViewChannel, P.ReadMessageHistory], deny: [P.SendMessages] },
    botAccess,
  ]);

  await prisma.auditLog.create({
    data: { action: "admin.setup", targetId: guild.id },
  });
}

// ───────── Handler de la commande ─────────

export async function handleSetup(interaction: ChatInputCommandInteraction) {
  if (!interaction.guild) return;
  await interaction.deferReply({ ephemeral: true });
  try {
    await setupServer(interaction.guild);
    await interaction.editReply("✅ Serveur ILLICO configuré (rôles, salons, permissions).");
  } catch (err) {
    console.error(err);
    await interaction.editReply("❌ Erreur pendant le setup. Vérifie les permissions du bot (Gérer les rôles et salons).");
  }
}
