import type { Metadata } from 'next';
import F1ThemeProvider from '@/providers/ThemeProvider';
import PulseOnLoad from "@/components/PulseOnLoad";
import { Analytics } from "@vercel/analytics/next";
import '@/styles/globals.css';

export const metadata: Metadata = {
  title: 'Slipstream - Formula 1 AI Intelligence Platform',
  description: 'Advanced F1 predictions, race analysis, and championship insights powered by AI. Get real-time predictions and expert analysis for the 2025 F1 season.',
  keywords: ['Formula 1', 'F1', 'AI', 'predictions', 'race analysis', 'championship', 'Slipstream', '2025 season'],
  authors: [{ name: 'Slipstream F1 AI' }],
  openGraph: {
    title: 'Slipstream - Formula 1 AI Intelligence Platform',
    description: 'Advanced F1 predictions, race analysis, and championship insights powered by AI. Get real-time predictions and expert analysis for the 2025 F1 season.',
    type: 'website',
    locale: 'en_US',
    siteName: 'Slipstream',
  },
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <head>
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
        <link
          href="https://fonts.googleapis.com/css2?family=Inter:wght@300;400;500;600;700;800;900&display=swap"
          rel="stylesheet"
        />
        <meta name="viewport" content="width=device-width, initial-scale=1" />
      </head>
      <body suppressHydrationWarning data-gramm="false">
        <F1ThemeProvider>
          <PulseOnLoad />
          {children}
          <Analytics />
        </F1ThemeProvider>
      </body>
    </html>
  );
}
