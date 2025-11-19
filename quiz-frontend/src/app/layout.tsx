"use client";

import AuthChecker from "./components/AuthChecker";
import "./globals.css";

export const dynamic = "force-dynamic";

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {W
  return (
    <html lang="en">
      <body>
          <AuthChecker>{children}</AuthChecker>           
      </body>
    </html>
  );
}
