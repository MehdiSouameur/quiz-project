"use client";
import { useRouter } from "next/navigation";

const API_BASE_URL = process.env.NEXT_PUBLIC_API_BASE_URL;

export default function Mode() {
const router = useRouter();
async function register() {
  console.log("api url: " + API_BASE_URL);
  try {
    const res = await fetch(`${API_BASE_URL}/api/auth/register`, {
      method: "POST",
      credentials: "include", // important! allows cookie to be set
    });

    const data = await res.json();
    const { token, username } = data;

    console.log("Registered, backend returned:", data);

    if (token) {
      document.cookie = `token=${token}; path=/; max-age=${60 * 60 * 24 * 7}`; // 7 days
    }
    if (username) {
      document.cookie = `username=${encodeURIComponent(
        username
      )}; path=/; max-age=${60 * 60 * 24 * 7}`;
    }

    router.push("/");

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
