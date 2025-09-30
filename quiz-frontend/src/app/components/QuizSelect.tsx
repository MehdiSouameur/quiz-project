import React from "react";

interface QuizSelectProps {
  id?: string;
  title?: string;
  description?: string;
  onClick?: () => void;
}

export default function QuizSelect({
  title = "Quiz Title",
  description = "This is a short description of the quiz.",
  onClick,
}: QuizSelectProps) {
  return (
    <div
      onClick={onClick}
      className="cursor-pointer flex flex-col w-full border border-white rounded-lg bg-transparent overflow-hidden 
                 transform transition-all duration-200 hover:scale-105 hover:shadow-lg"
    >
      {/* Title */}
      <div className="h-10 flex justify-center items-center border-b border-white text-white font-bold text-lg">
        {title}
      </div>

      {/* Description */}
      <div className="h-40 flex justify-center items-center border-b border-white text-white text-center px-2">
        {description}
      </div>

      {/* Bottom area (button style) */}
      <div className="h-12 w-full bg-blue-600 text-white flex justify-center items-center font-semibold text-lg">
        Start Quiz
      </div>
    </div>
  );
}
