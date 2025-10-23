import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import AuthChecker from "./components/AuthChecker";
import "./globals.css";

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body>
          <AuthChecker>{children}</AuthChecker>           
      </body>
    </html>
  );
}
