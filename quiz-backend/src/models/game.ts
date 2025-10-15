export interface Option {
  id: string;
  text: string;
}

export interface Question {
  id: number;
  title: string;
  options: Option[];
  answer: string;
}

export interface Quiz {
  quizId: string;
  name: string;
  description: string;
  questions: Question[];
}

export interface GameSession {
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

export interface MultiplayerRoom {
  gameId: string;
  quizId: string;
  players: string[];
}
