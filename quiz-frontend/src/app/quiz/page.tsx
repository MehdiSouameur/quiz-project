"use client"

import { useState, useEffect } from "react";
import QuizButton from "../components/QuizButton";

export default function quiz() {
  const [quizData, setQuizData] = useState<any>(null); // or type it properly

  const startQuiz = async () => {
    const res = await fetch('http://localhost:3001/api/quiz/quiz-123');
    const data = await res.json();
    setQuizData(data); // store in state
  };

  useEffect(() => {
      startQuiz(); // call once when component mounts
    }, []);
  
  if(!quizData) return <p>Loading...</p>;

  return (
    <main className="flex h-[100vh] justify-center items-center">
      <div className="flex flex-col justify-center items-cente">

        <div className="flex flex-col">
          <h1 className="text-3xl pb-20 font-bold text-center"> {quizData.title}</h1>
        </div>

        <div className="grid grid-cols-2 w-full gap-4">
        <QuizButton text={quizData.options[0].text}></QuizButton>
        <QuizButton text={quizData.options[0].text}></QuizButton>
        <QuizButton text={quizData.options[0].text}></QuizButton>
        <QuizButton text={quizData.options[0].text}></QuizButton>
        </div>


      </div>
    </main>
  );
}
