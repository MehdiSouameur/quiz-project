"use client"

import { useState, useEffect } from "react";
import QuizButton from "../components/QuizButton";

interface Option {
  id: string | number;
  text: string;
}

interface Question {
  id: number;
  title: string;
  options: Option[];
}

interface QuizData {
  gameId: string;
  currentQuestionIndex: number;
  question: Question;
  questions: Question[];
  score: number;
  isFinished: boolean;
}


export default function quiz() {
  const [quizData, setQuizData] = useState<QuizData | null>(null); // or type it properly

  const startQuiz = async () => {
    const res = await fetch('http://localhost:3001/api/quiz/start/quiz-123');
    const data = await res.json();
    setQuizData(data); // store in state
  };

  useEffect(() => {
      startQuiz(); // call once when component mounts
    }, []);
  
  if(!quizData) return <p>Loading...</p>;

  const evaluateQuestion = async(answer: string, questionId: number) => {
    console.log("Question clicked");
    console.log(questionId);
    const res = await fetch('http://localhost:3001/api/quiz/evaluate', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        gameId: quizData.gameId,
        questionId,
        answer,
      }),
    });

    const data = await res.json();
    console.log(data); // { isCorrect: true/false, score: 1, nextQuestion: {...} }
    // Update quizData with new score and next question
    setQuizData(prev => {
      if (!prev) return prev;
      return {
        ...prev,
        score: data.score,
        question: data.question || prev.question,
      };
    });

    console.log(quizData);

  }

  const updateQuestion = () => {

  }

  return (
    <main className="flex h-[100vh] justify-center items-center">
      <div className="flex flex-col justify-center items-cente">

        <div className="flex flex-col">
          <h1 className="text-3xl pb-20 font-bold text-center"> {quizData.question.title}</h1>
        </div>

        <div className="grid grid-cols-2 w-full gap-4">
        <QuizButton text={quizData.question.options[0].text}  onClick={() => evaluateQuestion('a', quizData.question.id)}></QuizButton>
        <QuizButton text={quizData.question.options[1].text}></QuizButton>
        <QuizButton text={quizData.question.options[2].text}></QuizButton>
        <QuizButton text={quizData.question.options[3].text}></QuizButton>
        </div>


      </div>
    </main>
  );
}
