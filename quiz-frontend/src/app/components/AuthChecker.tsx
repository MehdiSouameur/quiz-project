"use client";

import { useEffect } from "react";
import { useRouter, usePathname } from "next/navigation";

export default function AuthChecker({ children }: { children: React.ReactNode }) {
  const router = useRouter();
  const pathname = usePathname();

  useEffect(() => {

    // Exclude /login and any /quiz/:id/multiplayer route
    if (pathname === "/login" || /^\/quiz\/[^/]+\/multiplayer$/.test(pathname)) return;


    const checkAuth = async () => {
      try {
        const res = await fetch("http://localhost:3001/api/auth/check", {
          credentials: "include", // include cookies for auth
        });

        if (!res.ok) {
          router.push("/login");
          return;
        }

        const data = await res.json();
        if (!data.authenticated) {
          router.push("/login");
        }
      } catch (err) {
        console.error("Auth check failed:", err);
        router.push("/login");
      }
    };

    checkAuth();
  }, [router, pathname]);

  return <>{children}</>;
}
