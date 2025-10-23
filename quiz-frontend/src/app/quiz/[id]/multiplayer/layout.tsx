"use client";

import { SocketProvider } from "@/app/context/SocketContext";

export default function MultiplayerLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return <SocketProvider>{children}</SocketProvider>;
}
