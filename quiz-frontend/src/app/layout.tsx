import type { Metadata } from "next";
import AuthChecker from "./components/AuthChecker";
import "./globals.css";


export const metadata: Metadata = {
  title: "Quizzy",
  description: "Fun quiz action",
};


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
