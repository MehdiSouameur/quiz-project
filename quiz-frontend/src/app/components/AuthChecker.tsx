"use client";

import { useEffect } from "react";
import { useRouter, usePathname } from "next/navigation";
import path from "path";

const API_BASE_URL = process.env.NEXT_PUBLIC_API_BASE_URL;

export default function AuthChecker({ children }: { children: React.ReactNode }) {
  const router = useRouter();
  const pathname = usePathname();

  useEffect(() => {
    if (!pathname) return; // nothing to do until we know the path

    console.log("Authenticating, pathname:", pathname);

    // Exclude /login and any /quiz/:id/multiplayer route
    if (
      pathname === "/login" ||
      /^\/quiz\/[^/]+\/multiplayer(\/.*)?$/.test(pathname) ||
      /^\/quiz\/[^/]+\/multiplayerV2(\/.*)?$/.test(pathname)
    ) {
      console.log("ignore auth for multi");
      return;
    }



    const checkAuth = async () => {
      try {
        const res = await fetch(`${API_BASE_URL}/api/auth/check`, {
          credentials: "include", // include cookies for auth
        });

        if (!res.ok) {
          router.push("/login");
          console.log("RES NOT OK REROUTE")
          return;
        }

        const data = await res.json();
        if (!data.authenticated) {
            console.log("Data NO AUTH REROUTE")
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
