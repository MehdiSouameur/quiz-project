"use client"

import Image from "next/image";
import Link from "next/link";
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
        setQuizzes(data); // store in state
        console.log("Quizzes retrieved:", data);
      } catch (err) {
        console.error("Error fetching quizzes:", err);
      }
    };

    fetchQuizzes();
  }, []);

  const StartQuiz = (id: string) => {
    router.push(`/quiz?id=${id}`);
  };

  return (
    <main className="flex justify-center py-20 bg-gray-900 min-h-screen">
      {/* Central container */}
      <div className="flex flex-col w-full max-w-5xl p-10 text-white">
        {/* Page title */}
        <div className="flex justify-center text-7xl pb-10 font-black">
          <h1>Welcome to Quizzy</h1>
        </div>

        {/* Subtitle */}
        <div className="flex justify-center text-4xl pb-10">
          <h1>Select a quiz to get started</h1>
        </div>

        {/* Quiz grid */}
        <div className="flex justify-center">
          <div className="grid grid-cols-2 gap-6">
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
