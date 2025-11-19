"use client"

import Link from "next/link";
import { useEffect, useState } from "react";
import { useParams, useSearchParams } from "next/navigation";

const API_BASE_URL = process.env.NEXT_PUBLIC_API_BASE_URL || "http://localhost:3001";

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
        fetch(`${API_BASE_URL}/api/quiz/${id}/information?gameId=${gameId}`)
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
        <main className="flex min-h-screen justify-center items-center px-10 py-10">
            <div className="flex flex-col items-center w-full max-w-lg md:max-w-xl space-y-4">
                
                {/* Title */}
                <h1
                className="
                    text-center font-bold break-words leading-tight
                    text-xl sm:text-2xl md:text-3xl
                    min-h-[4rem] flex items-center justify-center
                "
                >
                You finished the quiz, nice one!
                </h1>

                {/* Score */}
                <div className="text-base sm:text-lg md:text-xl text-center">
                Correct answers: {correctCount}/{totalCount}
                </div>
                
                {/* Buttons */}
                <div className="flex flex-row sm:flex-row gap-3 sm:gap-4 mt-4">
                    <Link
                        href={`/quiz/${id}`}
                        className="
                        flex items-center justify-center
                        px-4 py-2
                        rounded-xl
                        bg-blue-500 text-white font-bold
                        text-sm sm:text-base
                        hover:bg-blue-600
                        transition-colors
                        "
                    >
                        Restart
                    </Link>

                    <Link
                        href="/"
                        className="
                        flex items-center justify-center
                        px-4 py-2
                        rounded-xl
                        bg-gray-300 text-black font-bold
                        text-sm sm:text-base
                        hover:bg-gray-400
                        transition-colors
                        "
                    >
                        Menu
                    </Link>
                </div>

            </div>
        </main>

    )
}