"use client";

import { useState } from "react";
import QuizButton from "@/app/components/QuizButton";
import SubmitButton from "@/app/components/SubmitButton";

export default function Play() {
  const [selectedAnswer, setSelectedAnswer] = useState<string | null>(null);

  const selectAnswer = (answer: string) => {
    setSelectedAnswer(answer);
  };

  const getButtonState = (optionLetter: string): "default" | "selected" => {
    return selectedAnswer === optionLetter ? "selected" : "default";
  };

  return (
    <main className="flex h-[100vh] justify-center items-center">
      <div className="flex flex-col items-center w-full max-w-xl">
        
        {/* 🟠 Question Title */}
        <div className="flex flex-col">
          <h1
            className="
              text-3xl font-bold text-center break-words 
              leading-snug h-[6rem] flex items-center justify-center
            "
          >
            Sample Question: What is the capital of France?
          </h1>
        </div>

        {/* 🟢 Static progress bar */}
        <div className="w-full h-3 bg-gray-300 rounded overflow-hidden mb-4 mt-4">
          <div
            id="progress-bar"
            className="h-full bg-orange-500 transition-all duration-500"
            style={{ width: "60%" }} // just static for now
          />
        </div>

        {/* 🟣 Options */}
        <div className="grid grid-cols-2 w-full gap-4">
          <QuizButton
            text="Paris"
            state={getButtonState("a")}
            onClick={() => selectAnswer("a")}
          />
          <QuizButton
            text="London"
            state={getButtonState("b")}
            onClick={() => selectAnswer("b")}
          />
          <QuizButton
            text="Berlin"
            state={getButtonState("c")}
            onClick={() => selectAnswer("c")}
          />
          <QuizButton
            text="Madrid"
            state={getButtonState("d")}
            onClick={() => selectAnswer("d")}
          />
        </div>

        {/* 🔵 Submit button */}
        <div className="flex justify-center mt-10 w-full">
          <SubmitButton
            text="Lock Answer"
            onClick={() => console.log("Answer locked")}
          />
        </div>

      </div>
    </main>
  );
}
