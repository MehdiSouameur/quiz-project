import Image from "next/image";
import Link from "next/link";

export default function Home() {
  return (
    <main>
      <div className="flex justify-center items-center h-[100vh]">
        <Link href="/quiz" className="bg-[#00ac4d] text-3xl px-5 py-2 rounded-4xl font-bold">
          Start Quiz
        </Link>
      </div>
    </main>
  );
}
