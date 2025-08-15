export const metadata = { title: "Slipstream - F1 Race Predictor", description: "Slipstream is an Agentic predictions with explanations" };
export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body className="min-h-screen bg-carbon text-zinc-100">{children}</body>
    </html>
  );
}
