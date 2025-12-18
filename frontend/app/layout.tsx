import type { Metadata, Viewport } from "next";
import "./globals.css";
import Navbar from "@/components/Navbar";
import { AccessibilityProvider } from "@/contexts/AccessibilityContext";
import AzureStatus from "@/components/AzureStatus";

export const metadata: Metadata = {
  title: "ScholarShield - Financial Lifeline for FGLI Students",
  description: "Automating the bureaucracy of survival for First-Generation, Low-Income students. AI-powered tool that helps students navigate financial challenges, find grants, and negotiate tuition.",
  keywords: ["financial aid", "FGLI students", "tuition assistance", "grant applications", "student financial support"],
  authors: [{ name: "ScholarShield Team" }],
  openGraph: {
    title: "ScholarShield - Don't Let Bureaucracy Derail Your Degree",
    description: "The AI Copilot for First-Gen Students that finds grants, negotiates tuition, and explains it all to your parents.",
    type: "website",
  },
};

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  themeColor: "#2563eb",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body>
        <AccessibilityProvider>
          <a 
            href="#main-content" 
            className="sr-only focus:not-sr-only focus:absolute focus:top-4 focus:left-4 focus:z-50 focus:px-4 focus:py-2 focus:bg-blue-600 focus:text-white focus:rounded-lg"
          >
            Skip to main content
          </a>
          <Navbar />
          <main id="main-content">
            {children}
          </main>
          <AzureStatus />
        </AccessibilityProvider>
      </body>
    </html>
  );
}

