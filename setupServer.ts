import {
  CategoryChannel,
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
import { getConfigValue } from "../config/guildConfig";
import { Access, CategoryDef, ChannelDef, ROLES, RoleDef, STRUCTURE } from "../config/structure";
import { logAction } from "../services/audit.service";
import { baseEmbed } from "../ui/theme";

export const setupCommand = new SlashCommandBuilder()
  .setName("setup-illico")
  .setDescription("Crée la structure ILLICO : salons, rôles et permissions (relançable)")
  .setDefaultMemberPermissions(P.Administrator);

type Tally = { created: string[]; reused: string[] };

async function saveConfig(key: string, value: string) {
  await prisma.guildConfig.upsert({ where: { key }, update: { value }, create: { key, value } });
}

// ───────── Phase 1 : catégories et salons ─────────

// Pendant la création, tout est masqué : rien n'est visible avant la phase 3.
const hiddenAtCreation = (guild: Guild): OverwriteResolvable[] => [
  { id: guild.roles.everyone.id, deny: [P.ViewChannel] },
  { id: guild.members.me!.id, allow: [P.ViewChannel, P.SendMessages, P.EmbedLinks, P.ManageChannels] },
];

async function ensureCategory(guild: Guild, def: CategoryDef, tally: Tally): Promise<CategoryChannel> {
  const savedId = await getConfigValue(def.key);
  let cat = (savedId ? guild.channels.cache.get(savedId) : undefined) as CategoryChannel | undefined;
  cat ??= guild.channels.cache.find(
    (c) => c.type === ChannelType.GuildCategory && c.name === def.name,
  ) as CategoryChannel | undefined;

  if (cat) tally.reused.push(def.name);
  else {
    cat = await guild.channels.create({
      name: def.name,
      type: ChannelType.GuildCategory,
      permissionOverwrites: hiddenAtCreation(guild),
    });
    tally.created.push(def.name);
  }
  await saveConfig(def.key, cat.id);
  return cat;
}

async function ensureChannel(
  guild: Guild,
  def: ChannelDef,
  parent: CategoryChannel,
  tally: Tally,
): Promise<TextChannel> {
  const savedId = await getConfigValue(def.key);
  let ch = (savedId ? guild.channels.cache.get(savedId) : undefined) as TextChannel | undefined;
  ch ??= guild.channels.cache.find(
    (c) => c.type === ChannelType.GuildText && c.name === def.name && c.parentId === parent.id,
  ) as TextChannel | undefined;

  if (ch) {
    tally.reused.push(def.name);
    if (ch.parentId !== parent.id) await ch.setParent(parent.id, { lockPermissions: false });
  } else {
    ch = await guild.channels.create({
      name: def.name,
      type: ChannelType.GuildText,
      parent: parent.id,
      topic: def.topic,
      permissionOverwrites: hiddenAtCreation(guild),
    });
    tally.created.push(def.name);
  }
  await saveConfig(def.key, ch.id);
  return ch;
}

// ───────── Phase 2 : rôles ─────────

async function ensureRole(guild: Guild, def: RoleDef, tally: Tally): Promise<Role> {
  const savedId = await getConfigValue(def.key);
  let role = (savedId ? guild.roles.cache.get(savedId) : undefined) ?? guild.roles.cache.find((r) => r.name === def.name);

  if (role) tally.reused.push(def.name);
  else {
    role = await guild.roles.create({
      name: def.name,
      color: def.color,
      hoist: def.hoist ?? false,
      mentionable: def.mentionable ?? false,
    });
    tally.created.push(def.name);
  }
  await saveConfig(def.key, role.id);
  return role;
}

// ───────── Phase 3 : permissions ─────────

type Ctx = { everyone: string; bot: string; trial: string; verified: string; qa: string; manager: string; founder: string };

const VIEW = [P.ViewChannel, P.ReadMessageHistory];
const NO_WRITE = [
  P.SendMessages,
  P.AddReactions,
  P.CreatePublicThreads,
  P.CreatePrivateThreads,
  P.SendMessagesInThreads,
];

const readOnly = (id: string): OverwriteResolvable => ({ id, allow: VIEW, deny: NO_WRITE });
const hidden = (id: string): OverwriteResolvable => ({ id, deny: [P.ViewChannel] });

// Les workers n'écrivent jamais : tout passe par les boutons, menus et formulaires.
function overwritesFor(access: Access, c: Ctx): OverwriteResolvable[] {
  const bot: OverwriteResolvable = {
    id: c.bot,
    allow: [P.ViewChannel, P.ReadMessageHistory, P.SendMessages, P.EmbedLinks, P.ManageChannels, P.ManageRoles, P.ManageMessages],
  };
  const staff = [c.qa, c.manager, c.founder].map(readOnly);

  switch (access) {
    case "public":
      return [readOnly(c.everyone), bot];
    case "workers":
      return [hidden(c.everyone), readOnly(c.trial), readOnly(c.verified), ...staff, bot];
    case "verified":
      return [hidden(c.everyone), readOnly(c.verified), ...staff, bot];
    case "staff":
      return [hidden(c.everyone), ...staff, bot];
    case "management":
      return [hidden(c.everyone), readOnly(c.manager), readOnly(c.founder), bot];
    case "founder":
      return [hidden(c.everyone), readOnly(c.founder), bot];
  }
}

// ───────── Orchestration ─────────

export async function setupServer(guild: Guild, progress?: (msg: string) => Promise<unknown>) {
  await Promise.all([guild.roles.fetch(), guild.channels.fetch()]);
  const channels: Tally = { created: [], reused: [] };
  const roles: Tally = { created: [], reused: [] };
  const warnings: string[] = [];

  // 1. Catégories et salons
  await progress?.("⏳ **1/3** Création des catégories et salons…");
  const cats = new Map<string, CategoryChannel>();
  const chans = new Map<string, TextChannel>();
  for (const catDef of STRUCTURE) {
    const cat = await ensureCategory(guild, catDef, channels);
    cats.set(catDef.key, cat);
    for (const chDef of catDef.channels) chans.set(chDef.key, await ensureChannel(guild, chDef, cat, channels));
  }

  // 2. Rôles
  await progress?.("⏳ **2/3** Création des rôles…");
  const created = new Map<string, Role>();
  for (const roleDef of ROLES) {
    const role = await ensureRole(guild, roleDef, roles);
    created.set(roleDef.key, role);
    if (!role.editable) warnings.push(`Le rôle « ${role.name} » est au-dessus du bot : place le rôle du bot tout en haut.`);
  }

  // 3. Permissions
  await progress?.("⏳ **3/3** Application des permissions…");
  const ctx: Ctx = {
    everyone: guild.roles.everyone.id,
    bot: guild.members.me!.id,
    trial: created.get("role.trial")!.id,
    verified: created.get("role.verified")!.id,
    qa: created.get("role.qa")!.id,
    manager: created.get("role.manager")!.id,
    founder: created.get("role.founder")!.id,
  };
  for (const catDef of STRUCTURE) {
    await cats.get(catDef.key)!.permissionOverwrites.set(overwritesFor(catDef.access, ctx));
    for (const chDef of catDef.channels) {
      await chans.get(chDef.key)!.permissionOverwrites.set(overwritesFor(chDef.access ?? catDef.access, ctx));
    }
  }

  await logAction("admin.setup", undefined, {
    guildId: guild.id,
    channelsCreated: channels.created.length,
    rolesCreated: roles.created.length,
  });
  return { channels, roles, warnings };
}

// ───────── Commande /setup-illico ─────────

export async function handleSetup(i: ChatInputCommandInteraction) {
  if (!i.guild) return;
  await i.deferReply({ ephemeral: true });
  try {
    const { channels, roles, warnings } = await setupServer(i.guild, (msg) => i.editReply(msg));

    const list = (t: Tally) =>
      `🆕 ${t.created.length} créé(s) · ♻️ ${t.reused.length} existant(s)`;
    const embed = baseEmbed()
      .setTitle("✅ SERVEUR ILLICO CONFIGURÉ")
      .setDescription(
        [
          `**Salons et catégories**\n${list(channels)}`,
          `**Rôles**\n${list(roles)}`,
          "**Permissions**\nAppliquées sur toute la structure.",
          warnings.length ? `\n⚠️ ${warnings.join("\n⚠️ ")}` : "",
          "\n**Étape suivante :** lance `/publier-panneaux`.",
        ].join("\n\n"),
      );
    await i.editReply({ content: "", embeds: [embed] });
  } catch (err) {
    console.error(err);
    await i.editReply(
      "❌ Erreur pendant le setup. Vérifie que le bot a les permissions « Gérer les salons » et « Gérer les rôles » (le plus simple : Administrateur).",
    );
  }
}
