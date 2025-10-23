"use client";

import { createContext, useContext, useEffect, useState } from "react";
import { io, Socket } from "socket.io-client";

interface SocketContextValue {
  socket: Socket | null;
  isConnecting: boolean;
}

const SocketContext = createContext<SocketContextValue>({
  socket: null,
  isConnecting: true,
});


export const SocketProvider = ({ children }: { children: React.ReactNode }) => {
  const [socket, setSocket] = useState<Socket | null>(null);
  const [isConnecting, setIsConnecting] = useState(true);

  useEffect(() => {
    const s = io("http://localhost:3001");
    setSocket(s);

    s.on("connect", () => {
      console.log("✅ Connected:", s.id);
      setIsConnecting(false);
    });

    return () => {
      s.disconnect();
      setSocket(null);
      setIsConnecting(true);
    };
  }, []);

  return (
    <SocketContext.Provider value={{ socket, isConnecting }}>
      {children}
    </SocketContext.Provider>
  );
};


export const useSocket = () => useContext(SocketContext);
