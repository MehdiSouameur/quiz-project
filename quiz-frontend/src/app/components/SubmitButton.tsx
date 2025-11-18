interface SubmitButtonProps {
  text: string;
  onClick?: () => void;
  disabled?: boolean;
}

export default function SubmitButton({ text, onClick, disabled }: SubmitButtonProps) {
  return (
    <button
      onClick={disabled ? undefined : onClick}
      disabled={disabled}
      className={`
        w-50 sm:w-80
        h-12 sm:h-14 md:h-16
        px-4 sm:px-5
        text-lg sm:text-xl md:text-2xl font-bold text-center
        border-2 border-white
        overflow-hidden text-ellipsis whitespace-nowrap
        transition-transform duration-200
        ${disabled
          ? "bg-gray-400 text-gray-200 cursor-not-allowed opacity-70"
          : "bg-[#0b389b] hover:scale-105 active:scale-95 active:opacity-80 cursor-pointer text-white"
        }
      `}
    >
      {text}
    </button>
  );
}