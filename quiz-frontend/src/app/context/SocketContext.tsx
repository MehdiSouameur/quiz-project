"use client";

import { createContext, useContext, useEffect, useState } from "react";
import { io, Socket } from "socket.io-client";

const API_BASE_URL = process.env.NEXT_PUBLIC_API_BASE_URL;

interface SocketContextValue {
  socket: Socket | null;
  isConnecting: boolean;
  username_cookie: string | null;
  token: string | null;
}

const SocketContext = createContext<SocketContextValue>({
  socket: null,
  isConnecting: true,
  username_cookie: null,
  token: null,
});

// A helper to safely read cookies
function getCookie(name: string): string | null {
  return (
    document.cookie
      .split("; ")
      .find((row) => row.startsWith(name + "="))
      ?.split("=")[1] || null
  );
}

export const SocketProvider = ({ children }: { children: React.ReactNode }) => {
  const [socket, setSocket] = useState<Socket | null>(null);
  const [isConnecting, setIsConnecting] = useState(true);
  const [username, setUsername] = useState<string | null>(null);
  const [token, setToken] = useState<string | null>(null);

  async function register() {
    try {
      const res = await fetch(`${API_BASE_URL}/api/auth/register`, {
        method: "POST",
        credentials: "include",
      });
      const data = await res.json();
      console.log("Registered:", data);
    } catch (err) {
      console.error("Registration failed:", err);
    }
  }

  useEffect(() => {
    const init = async () => {
      // 🔹 Step 1: Ensure cookies exist
      let name = getCookie("username");
      let tk = getCookie("token");

      if (!name || !tk) {
        console.log("No username/token found, registering user...");
        await register();
        // Recheck cookies
        name = getCookie("username");
        tk = getCookie("token");
      }

      setUsername(name);
      setToken(tk);

      // 🔹 Step 2: Connect socket only AFTER user is registered
      const s = io(`${API_BASE_URL}/lobby`, {
        auth: { token: tk }, // optional — passes auth token if you use it server-side
      });

      s.on("connect", () => {
        console.log("✅ Socket connected:", s.id);
        setIsConnecting(false);
      });

      setSocket(s);

      // 🔹 Step 3: Cleanup on unmount
      return () => {
        s.disconnect();
        setSocket(null);
        setIsConnecting(true);
      };
    };

    init();
  }, []);

  return (
    <SocketContext.Provider value={{ socket, isConnecting, username_cookie: username, token }}>
      {children}
    </SocketContext.Provider>
  );
};

export const useSocket = () => useContext(SocketContext);
