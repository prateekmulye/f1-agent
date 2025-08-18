/**
 * RootLayout
 *
 * Defines the html/body shell, global fonts, and site-wide theme classes.
 */
import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";
import PulseOnLoad from "@/components/PulseOnLoad";

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
  description: "Slipstream is an Agentic predictions with explanations",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" className={`${geistSans.variable} ${geistMono.variable}`} suppressHydrationWarning>
      {/* suppressHydrationWarning prevents noisy mismatches when browser extensions inject attributes on <body> */}
      <body className="min-h-screen bg-carbon text-zinc-100" suppressHydrationWarning data-gramm={"false"}>
  {/* Trigger pulse once per browser session to keep data warm */}
  <PulseOnLoad />
  {children}
      </body>
    </html>
  );
}
