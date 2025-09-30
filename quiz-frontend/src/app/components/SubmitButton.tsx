interface SubmitButtonProps {
  text: string;
  onClick?: () => void;
}

export default function SubmitButton({ text, onClick }: SubmitButtonProps) {
  return (
    <button
      onClick={onClick}
      className="
        w-80 h-16 px-5 py-2 text-3xl font-bold text-center
        border-2 border-white bg-[#0b389b]
        transition-transform duration-200
        hover:scale-105
        active:scale-95 active:opacity-80
        overflow-hidden text-ellipsis whitespace-nowrap
        cursor-pointer rounded-full
      "
    >
      {text}
    </button>
  );
}
