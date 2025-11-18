import { useRef, useEffect, useState } from "react";

interface QuizButtonProps {
  text: string;
  onClick?: () => void;
  state?: "default" | "selected" | "correct" | "incorrect" | "locked" | "opponent_answered_incorrect" | "opponent_answered_correct" |"double_incorrect";
}


export default function QuizButton({ text, onClick, state = "default" }: QuizButtonProps) {
  const textRef = useRef<HTMLSpanElement>(null);
  const [isOverflow, setIsOverflow] = useState(false);

  useEffect(() => {
    const el = textRef.current;
    if (el) {
      setIsOverflow(el.scrollWidth > el.clientWidth);
    }
  }, [text]);

  const baseClasses = `
    w-50 sm:w-70
    min-h-12 sm:min-h-14 md:min-h-16
    px-3 sm:px-4 md:px-5
    border-2 border-white
    transition-transform duration-200
    flex items-center justify-center
    overflow-hidden text-ellipsis
  `;


  let stateClasses = "";

  switch (state) {
    case "selected":
      stateClasses = "bg-white text-black scale-105";
      break;
    case "correct":
      stateClasses = "bg-green-600 text-white border-green-600 scale-105";
      break;
    case "incorrect":
      stateClasses = "bg-red-600 text-white border-red-600 opacity-60 scale-90";
      break;
    case "opponent_answered_incorrect":
      stateClasses = "bg-yellow-600 text-white border-white opacity-60 scale-90";
      break;
    case "opponent_answered_correct":
      stateClasses = "bg-green-600 text-white border-green-600 scale-105";
      break;
    case "double_incorrect":
      stateClasses = `
        bg-gradient-to-r from-red-600 to-yellow-400
        text-white border-red-600 scale-90 opacity-80
      `;
      break;        
    case "locked":
      // 🔒 Keep same base color, just tone it down and freeze interactions
      stateClasses = "bg-transparent text-white opacity-60 scale-90 cursor-default";
      break;
    default:
      stateClasses = "bg-transparent cursor-pointer text-white hover:bg-white hover:text-black hover:scale-105 active:scale-95";
  }


  return (
    <button
      onClick={onClick}
      className={`${baseClasses} ${stateClasses} relative`}  // ✅ relative
    >
      <span
        ref={textRef}
        className={`block truncate ${
          isOverflow
            ? "text-xs sm:text-base md:text-md"
            : "text-md sm:text-lg md:text-xl"
        }`}
      >
        {text}
      </span>

      {state === "opponent_answered_correct" && (
        <span className="absolute top-2 right-2 w-5 h-5 bg-yellow-400 rounded-full shadow-md"></span>
      )}
    </button>
  );

}
