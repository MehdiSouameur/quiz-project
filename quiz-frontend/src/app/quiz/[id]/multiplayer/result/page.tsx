"use client"

import Link from "next/link";
import { useEffect, useState } from "react";
import { useParams, useSearchParams } from "next/navigation";


type WinState = "victory" | "defeat" | "tie";

interface GameFinishedPayload {
  player: string;
  player_score: number;
  opponent: string;
  opponent_score: number;
  win_state: WinState;
  quiz_title: string;
}

export default function Result() {


    const [quizTitle, setQuizTitle] = useState<string>("");
    const [player, setPlayer] = useState<string>("");
    const [playerScore, setPlayerScore] = useState<number>(0);
    const [opponent, setOpponent] = useState<string>("");
    const [opponentScore, setOpponentScore] = useState<number>(0);
    const [winState, setWinState] = useState<WinState>("tie");     

    useEffect(() => {
        const saved = localStorage.getItem("gameResult");

        if (saved) {
            const result = JSON.parse(saved);

            console.log("Loaded result:", result);

            setQuizTitle(result.quiz_title);
            setPlayer(result.player);
            setPlayerScore(result.player_score);
            setOpponent(result.opponent);
            setOpponentScore(result.opponent_score);
            setWinState(result.win_state);
        }
    }, []);

    
    return (
        <main className="flex min-h-screen justify-center items-center px-4 sm:px-6 py-8 sm:py-10">
            <div className="flex flex-col items-center w-full max-w-md sm:max-w-lg md:max-w-xl">

                {/* ✅ Quiz title */}
                <h1
                className="
                    text-center font-bold break-words
                    leading-snug
                    text-2xl sm:text-3xl md:text-4xl
                    min-h-[3.5rem] sm:min-h-[4rem]
                    flex items-center justify-center
                "
                >
                {quizTitle}
                </h1>

                {/* ✅ Win/Lose/Tie */}
                <div className="text-lg sm:text-2xl font-bold mt-3 sm:mt-4">
                {winState === "victory" && <span className="text-green-400">Victory!</span>}
                {winState === "defeat" && <span className="text-red-400">Defeat</span>}
                {winState === "tie" && <span className="text-yellow-400">Tie</span>}
                </div>

                {/* ✅ Debug block */}
                <div className="w-full bg-gray-800 text-white px-4 py-4 sm:px-6 sm:py-6 rounded-lg mt-6">
                <h2 className="text-lg sm:text-xl font-bold text-center mb-3 sm:mb-4">
                    Match Result
                </h2>

                <div className="space-y-1.5 sm:space-y-2 text-sm sm:text-base">
                    <p><strong>You:</strong> {player}</p>
                    <p><strong>Your Score:</strong> {playerScore}</p>
                    <br />
                    <p><strong>Opponent:</strong> {opponent}</p>
                    <p><strong>Opponent Score:</strong> {opponentScore}</p>
                </div>
                </div>

                {/* ✅ Back to menu */}
                <div className="flex mt-6 sm:mt-8 w-full justify-center">
                <Link
                    href="/"
                    className="
                    flex items-center justify-center
                    w-full max-w-[8rem]
                    px-4 py-2
                    rounded-xl bg-gray-300 text-black font-bold
                    text-sm sm:text-base
                    hover:bg-gray-400 transition-colors
                    "
                >
                    Menu
                </Link>
                </div>

            </div>
        </main>

    );    
}