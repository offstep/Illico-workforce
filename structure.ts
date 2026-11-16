// Structure du serveur ILLICO : modifiable ici, /setup-illico applique le tout.
// Les clés (ch.*, cat.*, role.*) sont enregistrées en base et utilisées par le reste du bot.

export type Access = "public" | "workers" | "verified" | "staff" | "management" | "founder";

export type ChannelDef = { key: string; name: string; topic?: string; access?: Access };
export type CategoryDef = { key: string; name: string; access: Access; channels: ChannelDef[] };
export type RoleDef = { key: string; name: string; color: number; hoist?: boolean; mentionable?: boolean };

export const ROLES: RoleDef[] = [
  { key: "role.founder", name: "👑 Fondateur", color: 0x4c1d95, hoist: true },
  { key: "role.manager", name: "🛠️ Responsable", color: 0x6d28d9, hoist: true },
  { key: "role.qa", name: "🔎 QA", color: 0x7c3aed, hoist: true, mentionable: true },
  { key: "role.verified", name: "✅ Worker vérifié", color: 0x22c55e },
  { key: "role.trial", name: "🟡 Worker en essai", color: 0xeab308 },
];

/*
 Niveaux d'accès :
 public     → tout le monde voit, lecture seule
 workers    → workers en essai + vérifiés + staff
 verified   → workers vérifiés + staff
 staff      → QA + responsables + fondateur
 management → responsables + fondateur
 founder    → fondateur uniquement
*/
export const STRUCTURE: CategoryDef[] = [
  {
    key: "cat.welcome",
    name: "📌 ACCUEIL",
    access: "public",
    channels: [
      { key: "ch.welcome", name: "👋・bienvenue", topic: "Bienvenue chez ILLICO" },
      { key: "ch.rules", name: "📜・règles", topic: "Les règles du serveur" },
      { key: "ch.start", name: "🚀・commencer", topic: "Clique sur COMMENCER pour démarrer ton parcours" },
    ],
  },
  {
    key: "cat.training",
    name: "🎓 FORMATION",
    access: "public",
    channels: [
      { key: "ch.training", name: "🎓・formation", topic: "Apprends les méthodes de travail ILLICO" },
      { key: "ch.quiz", name: "🧪・évaluation", topic: "Passe l'évaluation pour débloquer ta mission d'essai" },
    ],
  },
  {
    key: "cat.work",
    name: "💼 TRAVAIL",
    access: "workers",
    channels: [
      { key: "ch.deliver", name: "🎫・livrer-une-mission", topic: "Crée ta livraison privée" },
      { key: "ch.missions", name: "📋・opportunités", topic: "Missions disponibles", access: "verified" },
      { key: "ch.payments", name: "💳・paiements", topic: "Ton espace paiements", access: "verified" },
    ],
  },
  {
    key: "cat.support",
    name: "🆘 ASSISTANCE",
    access: "public",
    channels: [{ key: "ch.support", name: "🎫・ouvrir-un-ticket", topic: "Besoin d'aide ? Ouvre un ticket" }],
  },
  {
    key: "cat.staff",
    name: "🔒 STAFF",
    access: "staff",
    channels: [
      { key: "ch.qa", name: "🔎・contrôle-qualité", topic: "Livraisons à contrôler" },
      { key: "ch.direction", name: "👑・direction", topic: "Panneau de direction", access: "management" },
      { key: "ch.logs", name: "📜・logs", topic: "Journal d'activité du bot", access: "founder" },
    ],
  },
];
