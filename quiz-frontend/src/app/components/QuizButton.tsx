interface QuizButtonProps {
  text: string;
  onClick?: () => void;
}

export default function QuizButton({ text, onClick }: QuizButtonProps) {
  return (
    <button
      onClick={onClick}
      className="
        w-full px-5 py-2 text-3xl font-bold text-center
        border-2 border-white bg-transparent
        transition-transform duration-200
        hover:bg-white hover:text-black hover:scale-105
        active:scale-95 active:opacity-80
      "
    >
      {text}
    </button>
  );
}
