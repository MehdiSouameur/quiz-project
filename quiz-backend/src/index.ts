import express, { Request, Response } from 'express';
import cors from 'cors';
import quizzes from './quizzes.json' assert { type: 'json' };;


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

    res.json({
        isCorrect,
        score: curGame.score,
        gameId: curGame.gameId,
        question: curGame.questions[curGame.currentQuestionIndex + 1] || null,
    });
});

app.listen(3001, () => console.log('Quiz backend running on port 3001'));

function generateGameId(): string {
    return "game-" + Math.floor(100 + Math.random() * 900).toString(); 
}