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
          <a href="/" className="flex items-center gap-3 min-w-0">
            <span className="brand-word text-lg">Slipstream</span>
            <span className="hidden sm:inline text-zinc-500 text-xs">F1 Insights</span>
            <span className="hidden md:inline text-zinc-500 text-xs">· by <span className="text-zinc-300">Prateek Mulye</span></span>
          </a>

          <nav className="flex items-center gap-2">
            <a
              href="https://github.com/prateekmulye/f1-agent"
              target="_blank"
              rel="noopener noreferrer"
              className="nav-pill"
              aria-label="GitHub repository"
            >
              <svg viewBox="0 0 24 24" className="w-4 h-4" aria-hidden="true"><path fill="currentColor" d="M12 2C6.48 2 2 6.58 2 12.26c0 4.51 2.87 8.34 6.84 9.69.5.1.68-.22.68-.48 0-.24-.01-.87-.01-1.71-2.78.62-3.37-1.2-3.37-1.2-.45-1.18-1.12-1.5-1.12-1.5-.92-.64.07-.63.07-.63 1.02.07 1.56 1.07 1.56 1.07.9 1.57 2.36 1.12 2.94.86.09-.67.35-1.12.63-1.38-2.22-.26-4.55-1.14-4.55-5.07 0-1.12.39-2.03 1.03-2.75-.1-.26-.45-1.3.1-2.71 0 0 .85-.28 2.78 1.05.81-.23 1.68-.35 2.55-.35.87 0 1.74.12 2.55.35 1.93-1.33 2.78-1.05 2.78-1.05.55 1.41.2 2.45.1 2.71.64.72 1.03 1.63 1.03 2.75 0 3.94-2.33 4.81-4.56 5.07.36.32.68.94.68 1.9 0 1.37-.01 2.47-.01 2.81 0 .26.18.58.69.48A10.04 10.04 0 0 0 22 12.26C22 6.58 17.52 2 12 2Z"/></svg>
              <span className="hidden sm:inline">GitHub</span>
            </a>
            <a
              href="https://www.linkedin.com/in/prateekmulye/"
              target="_blank"
              rel="noopener noreferrer"
              className="nav-pill"
              aria-label="LinkedIn profile"
            >
              <svg viewBox="0 0 24 24" className="w-4 h-4" aria-hidden="true"><path fill="currentColor" d="M4.98 3.5a2.5 2.5 0 1 0 0 5 2.5 2.5 0 0 0 0-5ZM3 9h4v12H3V9Zm7 0h3.8v1.64h.05c.53-1 1.83-2.06 3.77-2.06 4.03 0 4.78 2.65 4.78 6.09V21h-4v-5.35c0-1.28-.03-2.92-1.78-2.92-1.78 0-2.06 1.39-2.06 2.83V21H10V9Z"/></svg>
              <span className="hidden sm:inline">LinkedIn</span>
            </a>
            <span className="chip">v0.1</span>
          </nav>
        </div>
      </div>
    </header>
  );
}