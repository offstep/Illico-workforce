// Contenu à adapter par la Direction. Garder chaque page courte (lisible sur mobile).

export const RULES_TEXT = [
  "• Respect et courtoisie envers tous les membres.",
  "• Les consignes d'une mission sont obligatoires, jamais modifiables.",
  "• Aucune donnée de mission ne doit être partagée ou publiée.",
  "• Un travail copié, bâclé ou frauduleux entraîne une exclusion.",
  "• Toute question passe par l'assistance, pas par des messages privés.",
].join("\n");

export const TRAINING_PAGES: { title: string; body: string }[] = [
  {
    title: "📜 Règles du serveur",
    body: RULES_TEXT,
  },
  {
    title: "📚 Méthodes de travail",
    body: [
      "1. Lis **toutes** les instructions avant de commencer.",
      "2. Travaille sans te précipiter, la qualité passe avant la vitesse.",
      "3. Relis ton travail avant de le soumettre.",
      "4. Respecte le format de livraison demandé.",
      "5. En cas de doute, ouvre un ticket d'assistance.",
    ].join("\n"),
  },
  {
    title: "🔐 Confidentialité",
    body: [
      "• Les données des missions sont confidentielles.",
      "• Ne partage aucune capture d'écran ni aucun fichier hors d'ILLICO.",
      "• Ne parle jamais de tes missions publiquement.",
      "• Une fuite de données entraîne une exclusion immédiate.",
    ].join("\n"),
  },
  {
    title: "🔎 Standards de qualité",
    body: [
      "Chaque livraison est notée sur 4 critères :",
      "• **Exactitude** : les réponses sont justes",
      "• **Complétude** : rien n'est oublié",
      "• **Consignes** : tout est respecté",
      "• **Format** : la livraison est au bon format",
      "",
      "Objectif : une note supérieure à 80 %.",
    ].join("\n"),
  },
];
