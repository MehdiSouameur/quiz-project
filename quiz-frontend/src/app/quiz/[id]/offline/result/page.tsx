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

    const { id } = useParams<{ id: string }>();
    const searchParams = useSearchParams();
    const gameId = searchParams.get("gameId");

    // Array of booleans, each representing whether an answer was correct
    const [answerBools, setAnswerBools] = useState<boolean[]>([]);

    useEffect(() => {
        if (gameId) {
        fetch(`http://localhost:3001/api/quiz/${id}/information?gameId=${gameId}`)
            .then((res) => res.json())
            .then((data: GameData) => {
            console.log("Game data:", data);

            if (Array.isArray(data.answers)) {
                const boolArray = data.answers.map((ans) => ans.correct);
                setAnswerBools(boolArray);
                console.log("Boolean answers:", boolArray);
            }
            })
            .catch((err) => console.error("Failed to fetch game data:", err));
        }
    }, [id, gameId]);

    const correctCount = answerBools.filter(Boolean).length;
    const totalCount = answerBools.length;

    return (
    <main className="flex h-[100vh] justify-center items-center">
        <div className="flex flex-col items-center w-full max-w-xl">
            <h1   className="
            text-3xl font-bold text-center break-words 
            leading-snug h-[6rem] flex items-center justify-center
            "> You finished the quiz, nice one!
            </h1>

            <div>
                Correct answers: {correctCount}/{totalCount}
            </div>
            
            {/* Circular Buttons */}
            <div className="flex space-x-4 mt-6">
            <Link
                href={`/quiz/${id}`}
                className="flex items-center justify-center w-20 p-2 rounded-xl bg-blue-500 text-white font-bold hover:bg-blue-600 transition-colors"
            >
                Restart
            </Link>

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