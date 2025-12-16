import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "ScholarShield - Financial Lifeline for FGLI Students",
  description: "Automating the bureaucracy of survival for First-Generation, Low-Income students",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}

