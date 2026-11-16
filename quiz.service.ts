import { Prisma } from "@prisma/client";
import { prisma } from "../db/client";
import { logAction } from "./audit.service";
import { PASS_PERCENT, QUIZ_QUESTIONS } from "../content/quiz";

const TOTAL = QUIZ_QUESTIONS.length;

// Reprend la tentative en cours, sinon en crée une nouvelle (tentatives numérotées).
export async function getOrCreateAttempt(userId: string) {
  const open = await prisma.quizAttempt.findFirst({
    where: { userId, finishedAt: null },
    orderBy: { startedAt: "desc" },
  });
  if (open) return open;

  const count = await prisma.quizAttempt.count({ where: { userId } });
  const attempt = await prisma.quizAttempt.create({
    data: { userId, attemptNo: count + 1, total: TOTAL },
  });
  await logAction("quiz.started", userId, { attemptNo: attempt.attemptNo });
  return attempt;
}

export type AnswerResult =
  | { kind: "invalid" }
  | { kind: "stale"; attemptId: string; index: number; finished: boolean }
  | { kind: "next"; attemptId: string; index: number }
  | { kind: "finished"; score: number; total: number; passed: boolean };

// Enregistre une réponse. Sécurisé contre les doubles clics et les anciens boutons.
export async function submitAnswer(
  attemptId: string,
  userId: string,
  questionIndex: number,
  choice: string,
): Promise<AnswerResult> {
  const attempt = await prisma.quizAttempt.findUnique({ where: { id: attemptId } });
  if (!attempt || attempt.userId !== userId) return { kind: "invalid" };

  const stale = {
    kind: "stale" as const,
    attemptId,
    index: attempt.currentIndex,
    finished: attempt.finishedAt !== null,
  };
  if (attempt.finishedAt || attempt.currentIndex !== questionIndex) return stale;

  const isCorrect = QUIZ_QUESTIONS[questionIndex]?.correct === choice;

  try {
    await prisma.$transaction([
      prisma.quizAnswer.create({ data: { attemptId, questionIndex, choice, isCorrect } }),
      prisma.quizAttempt.update({
        where: { id: attemptId },
        data: { currentIndex: { increment: 1 } },
      }),
    ]);
  } catch (err) {
    if (err instanceof Prisma.PrismaClientKnownRequestError && err.code === "P2002") return stale;
    throw err;
  }

  const next = questionIndex + 1;
  if (next < TOTAL) return { kind: "next", attemptId, index: next };

  // Dernière question : calcul du score
  const score = await prisma.quizAnswer.count({ where: { attemptId, isCorrect: true } });
  const passed = (score / TOTAL) * 100 >= PASS_PERCENT;
  await prisma.quizAttempt.update({
    where: { id: attemptId },
    data: { score, passed, finishedAt: new Date() },
  });
  await logAction(passed ? "quiz.passed" : "quiz.failed", userId, {
    attemptNo: attempt.attemptNo,
    score,
    total: TOTAL,
  });
  return { kind: "finished", score, total: TOTAL, passed };
}
