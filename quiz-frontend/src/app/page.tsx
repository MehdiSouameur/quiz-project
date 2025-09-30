import Image from "next/image";
import Link from "next/link";
import QuizSelect from "./components/QuizSelect";

export default function Home() {
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
            <QuizSelect id="quiz1" />
            <QuizSelect id="quiz2" />
            <QuizSelect id="quiz3" />
            <QuizSelect id="quiz4" />
          </div>
        </div>

        {/* Start button */}
        <div className="flex justify-center pt-10">
          <Link
            href="/quiz"
            className="bg-[#00ac4d] text-3xl px-8 py-3 rounded-3xl font-bold hover:bg-green-700 transition-colors"
          >
            Start Quiz
          </Link>
        </div>
      </div>
    </main>
  );
}
