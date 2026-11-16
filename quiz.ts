// 6 questions, 1 bonne réponse chacune. Les bonnes réponses restent côté serveur
// (jamais dans les customId des boutons).

export type QuizQuestion = {
  question: string;
  options: { A: string; B: string; C: string; D: string };
  correct: "A" | "B" | "C" | "D";
};

export const PASS_PERCENT = 80;

export const QUIZ_QUESTIONS: QuizQuestion[] = [
  {
    question: "Tu reçois une nouvelle mission.\nQue dois-tu faire en premier ?",
    options: {
      A: "Commencer immédiatement",
      B: "Lire attentivement les instructions",
      C: "Modifier les instructions",
      D: "Attendre qu'on te relance",
    },
    correct: "B",
  },
  {
    question: "Une consigne n'est pas claire pour toi.\nQue fais-tu ?",
    options: {
      A: "Je devine et je continue",
      B: "Je demande en privé à un autre worker",
      C: "J'ouvre un ticket d'assistance",
      D: "Je fais à ma façon",
    },
    correct: "C",
  },
  {
    question: "Tu veux montrer une donnée de mission à un ami.\nQue fais-tu ?",
    options: {
      A: "Je ne la partage jamais en dehors d'ILLICO",
      B: "Je partage une capture d'écran floutée",
      C: "Je la partage si mon ami est discret",
      D: "Je la publie sans le nom de la mission",
    },
    correct: "A",
  },
  {
    question: "Que dois-tu faire juste avant de soumettre ta livraison ?",
    options: {
      A: "Soumettre vite pour gagner du temps",
      B: "Demander l'avis d'un autre worker",
      C: "Changer le format pour faire mieux",
      D: "Relire mon travail et vérifier le format demandé",
    },
    correct: "D",
  },
  {
    question: "Que se passe-t-il une fois ta livraison soumise ?",
    options: {
      A: "Je peux encore la modifier librement",
      B: "Elle part au contrôle qualité, je ne peux plus la modifier",
      C: "Elle est publiée dans le salon",
      D: "Elle est supprimée après 24 h",
    },
    correct: "B",
  },
  {
    question: "Le contrôle qualité te demande une correction.\nQue fais-tu ?",
    options: {
      A: "Je ne réponds pas",
      B: "Je crée une nouvelle mission",
      C: "Je lis les corrections, je corrige et je soumets à nouveau",
      D: "Je conteste dans le salon public",
    },
    correct: "C",
  },
];
