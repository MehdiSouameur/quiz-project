"use client"

import Link from "next/link";
import { useEffect, useState } from "react";
import { useParams, useSearchParams } from "next/navigation";

interface Answer {
  questionId: number;
  selected: string;
  correct: boolean;
}

interface GameData {
  gameId: string;
  quizId: string;
  currentQuestionIndex: number;
  questions: any[]; // you can define a Question type later if needed
  answers: Answer[];
  score: number;
  isFinished: boolean;
  createdAt: string;
}

export default function Result() {


    const [title, setTitle] = useState<string>("");

    useEffect(() => {
        const saved : string | null = localStorage.getItem("testMessage")
        if(saved){
            setTitle(saved)
        }
    }, []);


    return (
    <main className="flex h-[100vh] justify-center items-center">
        <div className="flex flex-col items-center w-full max-w-xl">
            <h1   className="
            text-3xl font-bold text-center break-words 
            leading-snug h-[6rem] flex items-center justify-center
            ">
                {title}
            </h1>

            <div>
                Correct answers:
            </div>
            
            {/* Circular Buttons */}
            <div className="flex space-x-4 mt-6">
            <Link
                href="/"
                className="flex items-center justify-center w-20 rounded-xl bg-gray-300 text-black font-bold hover:bg-gray-400 transition-colors"
            >
                Menu
            </Link>
            </div>
        </div>
    </main>
    )
}