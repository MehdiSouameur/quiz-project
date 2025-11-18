"use client";

import QuizSelect from "./components/QuizSelect";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";

export default function Home() {
  const router = useRouter();
  const [quizzes, setQuizzes] = useState<any[]>([]);

  useEffect(() => {
    const fetchQuizzes = async () => {
      try {
        const res = await fetch("http://localhost:3001/api/quiz/retrieve");
        const data = await res.json();
        setQuizzes(data);
        console.log("Quizzes retrieved:", data);
      } catch (err) {
        console.error("Error fetching quizzes:", err);
      }
    };

    fetchQuizzes();
  }, []);

  const StartQuiz = (id: string) => {
    router.push(`/quiz/${id}/mode`);
  };

  return (
    <main className="min-h-screen bg-gray-900 flex justify-center items-center px-4 py-10">
      <div className="w-full max-w-5xl text-white flex flex-col items-center">
        
        <h1 className="text-center font-black text-3xl sm:text-4xl md:text-5xl lg:text-6xl pb-6">
          Welcome to Quizzy
        </h1>

        <h2 className="text-center text-lg sm:text-2xl md:text-3xl pb-6">
          Select a quiz to get started
        </h2>

        <div className="flex justify-center w-full">
          <div className="grid gap-4 sm:gap-6 grid-cols-1 sm:grid-cols-2 lg:grid-cols-3">
            {quizzes.map((quiz) => (
              <QuizSelect
                key={quiz.quizId}
                id={quiz.quizId}
                title={quiz.name}
                description={quiz.description}
                onClick={() => StartQuiz(quiz.quizId)}
              />
            ))}
          </div>
        </div>


      </div>
    </main>

  );
}
