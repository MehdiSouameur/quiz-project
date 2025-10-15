"use client"

import Link from "next/link";
import { useParams } from "next/navigation";

export default function Mode() {
    const { id } = useParams();
    return (
        <main className="flex flex-col h-[100vh] justify-center items-center">
            <h1 className="text-white font-black text-3xl mb-5">Select game mode</h1>
            <div className="flex space-x-4 mt-6">
            <Link
                href={`/quiz/${id}/offline`}
                className="flex items-center justify-center p-2 rounded-xl bg-blue-500 text-white font-bold hover:bg-blue-700 transition-colors"
            >
                Offline
            </Link>
            <Link
                href={`/quiz/${id}/multiplayer`}
                className="flex items-center justify-center p-2 rounded-xl bg-lime-600 text-white font-bold hover:bg-lime-800 transition-colors"
            >
                Multiplayer
            </Link>
            </div>
        </main>
    );
}
