"use client";
import Link from "next/link";
import { useRouter } from "next/navigation";

export default function Mode() {
const router = useRouter();
async function register() {
  try {
    const res = await fetch("http://localhost:3001/api/auth/register", {
      method: "POST",
      credentials: "include", // important! allows cookie to be set
    });

    const data = await res.json();
    console.log("Registered, backend returned:", data);
    router.push("/");
    // The cookie is automatically set in the browser via Set-Cookie
    // You don’t need to do anything else
  } catch (err) {
    console.error("Registration failed:", err);
  }
}

  return (
    <main className="flex flex-col h-[100vh] justify-center items-center">
      <div className="flex space-x-4 mt-6">
        <button
          className="flex items-center justify-center p-2 rounded-xl bg-blue-500 text-white font-bold hover:bg-blue-700 transition-colors"
          onClick={register}
        >
          Sign In
        </button>
      </div>
    </main>
  );
}
