import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "Slipstream - F1 Race Predictor",
  description: "Slipstream is an Agentic predictions with explanations"
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body className={`min-h-screen bg-carbon text-zinc-100 ${geistSans.variable} ${geistMono.variable}`}>
        {children}
      </body>
    </html>
  );
}