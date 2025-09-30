interface QuizButtonProps {
  text: string;
  onClick?: () => void;
  state?: "default" | "selected" | "correct" | "incorrect";
}

export default function QuizButton({ text, onClick, state = "default" }: QuizButtonProps) {
  const baseClasses = `
    w-80 h-16 px-5 py-2 text-3xl font-bold text-center
    border-2 border-white
    transition-transform duration-200
    hover:scale-105
    active:scale-95 active:opacity-80
    overflow-hidden text-ellipsis whitespace-nowrap
    cursor-pointer
  `;

  let stateClasses = "";

  switch (state) {
    case "selected":
      stateClasses = "bg-white text-black hover:bg-white hover:text-black";
      break;
    case "correct":
      stateClasses = "bg-green-600 text-white border-green-600";
      break;
    case "incorrect":
      stateClasses = "bg-red-600 text-white border-red-600";
      break;
    default:
      stateClasses = "bg-transparent text-white hover:bg-white hover:text-black";
  }

  return (
    <button onClick={onClick} className={`${baseClasses} ${stateClasses}`}>
      {text}
    </button>
  );
}
