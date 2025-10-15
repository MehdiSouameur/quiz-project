import { Router, Request, Response } from "express";
import fs from "fs";
import path from "path";
import { Quiz, GameSession } from "../models/game.js";
import { generateGameId } from "../utils/helpers.js"

const router = Router();

// Load quizzes
const __dirname = path.resolve();
const quizzes: Quiz[] = JSON.parse(fs.readFileSync(path.join(__dirname, "src/quizzes.json"), "utf-8"));

let curGame: GameSession | null = null;

router.get("/retrieve", (req: Request, res: Response) => {
  const quizList = quizzes.map(q => ({ quizId: q.quizId, name: q.name, description: q.description }));
  res.json(quizList);
});

router.get("/:quizId/information", (req: Request, res: Response) => {
  if (!curGame || curGame.quizId !== req.params.quizId) return res.status(404).json({ error: "Game not found" });
  res.json(curGame);
});

router.get("/start/:quizId", (req: Request, res: Response) => {
  const quiz = quizzes.find(q => q.quizId === req.params.quizId);
  if (!quiz) return res.status(404).json({ error: "Quiz not found" });

  curGame = {
    gameId: generateGameId(),
    quizId: quiz.quizId,
    currentQuestionIndex: 0,
    questions: quiz.questions,
    answers: [],
    score: 0,
    isFinished: false,
    createdAt: new Date().toISOString(),
  };

  res.json({ gameId: curGame.gameId, question: curGame.questions[0] });
});

router.post("/evaluate", (req: Request, res: Response) => {
  if (!curGame || curGame.gameId !== req.body.gameId) return res.status(404).json({ error: "Game not found" });

  const question = curGame.questions.find(q => q.id === req.body.questionId);
  if (!question) return res.status(404).json({ error: "Question not found" });

  const isCorrect = question.answer === req.body.answer;
  if (isCorrect) curGame.score++;
  curGame.answers.push({ questionId: question.id, selected: req.body.answer, correct: isCorrect });
  curGame.currentQuestionIndex += 1;

  res.json({
    answer: question.answer,
    score: curGame.score,
    gameId: curGame.gameId,
    question: curGame.questions[curGame.currentQuestionIndex] || null,
  });
});

export default router;
