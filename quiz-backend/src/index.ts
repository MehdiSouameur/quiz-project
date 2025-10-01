import express, { Request, Response } from 'express';
import cors from 'cors';
import quizzes from './quizzes.json' assert { type: 'json' };;
import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";


const app = express();
app.use(express.json());
app.use(cors());



interface Option { id: string; text: string; }
interface Question { id: number; title: string; options: Option[]; answer: string }
interface Quiz { quizId: string; name: string; questions: Question[]; }

interface GameSession {
  gameId: string;
  quizId: string;
  playerId?: string;
  currentQuestionIndex: number;
  questions: Question[];
  answers: { questionId: number; selected: string; correct: boolean }[];
  score: number;
  isFinished: boolean;
  createdAt: string;
  finishedAt?: string;
}

let curGame: GameSession | null = null;

const allQuizzes: Quiz[] = quizzes;
// Only needed in ES modules
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

app.get('/api/quiz/retrieve', (req: Request, res: Response) => {
  try {
    console.log("Retrieving all quizzess...")
    // Read the JSON file
    const filePath = path.join(__dirname, "quizzes.json"); // adjust path
    const rawData = fs.readFileSync(filePath, 'utf-8');
    const quizzes = JSON.parse(rawData);

    // Map to only quizId, name, description
    const quizList = quizzes.map((q: any) => ({
      quizId: q.quizId,
      name: q.name,
      description: q.description
    }));

    console.log(quizList);

    res.json(quizList);
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: "Failed to retrieve quizzes" });
  }
});

app.get('/api/quiz/start/:quizId', (req: Request, res: Response) => {
    const { quizId } = req.params
    console.log("Request received to start ", quizId);
    const quiz = allQuizzes.find(q => q.quizId === quizId);
    if (!quiz) return res.status(404).json({ error: 'Quiz not found' });


    const jsonQuestions: Question[] = quiz.questions.map((q) => ({
        id: q.id,
        title: q.title,
        options: q.options.map((opt) => ({
            id: opt.id,
            text: opt.text,
        })),
        answer: q.answer
    }));

    curGame = {
        gameId: generateGameId(),
        quizId: quizId,
        currentQuestionIndex: 0,
        questions: jsonQuestions,
        answers: [],
        score: 0,
        isFinished: false,
        createdAt: new Date().toISOString(),
    }
    console.log(curGame)

    return res.json({
    gameId: curGame.gameId,
    question: curGame.questions[0],
    });
});

app.post('/api/quiz/evaluate', (req: Request, res: Response) => {
    const { gameId, questionId, answer } = req.body

    console.log("evaluating for " + gameId)
    if (gameId != curGame?.gameId || !curGame) return res.status(404).json({ error: 'Game not found' });
    console.log("Game found, evaluations started")
    console.log("Searching Question: " + questionId)
    const question = curGame?.questions.find(q => q.id === questionId);
    if (!question) {
        return res.status(404).json({ error: 'Question not found' });
    }

    const isCorrect = question.answer === answer;
    if (isCorrect) curGame.score++;
    curGame.answers.push({ questionId: questionId, selected: answer, correct: isCorrect });

    console.log(curGame)
    curGame.currentQuestionIndex += 1
    res.json({
        answer: question.answer,
        score: curGame.score,
        gameId: curGame.gameId,
        question: curGame.questions[curGame.currentQuestionIndex] || null,
    });
});

app.listen(3001, () => console.log('Quiz backend running on port 3001'));

function generateGameId(): string {
    return "game-" + Math.floor(100 + Math.random() * 900).toString(); 
}