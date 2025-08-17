"use client";

/**
 * NavBar – sticky top navigation bar used across the app.
 * Uses utility classes defined in globals.css (nav-surface, container-page, brand-word, chip).
 */
export default function NavBar() {
  return (
    <header className="nav-surface">
      <div className="container-page">
        <div className="h-14 flex items-center justify-between">
          <a href="/" className="flex items-center gap-2 min-w-0">
            <span className="brand-word text-lg">Slipstream</span>
            <span className="hidden sm:inline text-zinc-500 text-xs">F1 Insights</span>
          </a>

          <div className="flex items-center gap-2">
            <span className="chip">v0.1</span>
          </div>
        </div>
      </div>
    </header>
  );
}