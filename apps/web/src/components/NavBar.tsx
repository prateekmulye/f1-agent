/**
 * NavBar
 *
 * Sticky header with project title and external links (icons on the right).
 */
export default function NavBar() {
  return (
    <header className="sticky top-0 z-20 bg-f1-carbon/70 backdrop-blur border-b border-zinc-800">
      <nav
        className="max-w-6xl mx-auto px-4 py-3 flex items-center justify-between"
        aria-label="Global"
      >
        <div className="flex items-center gap-3">
          <div className="w-6 h-6 rounded-sm bg-f1-red" aria-hidden />
          <span className="font-semibold text-white">
            Slipstream – F1 Race Predictor
          </span>
        </div>

        <div className="flex items-center gap-2">
          {/* GitHub */}
          <a
            href="https://github.com/prateekmulye/f1-agent"
            target="_blank"
            rel="noreferrer"
            title="Open GitHub"
            className="group inline-flex items-center gap-2 rounded-md px-2.5 py-1.5
                       bg-zinc-900/50 border border-zinc-800 text-zinc-300
                       hover:text-white hover:border-zinc-700 transition"
          >
            <svg
              viewBox="0 0 24 24"
              aria-hidden="true"
              className="w-4 h-4 text-zinc-300 group-hover:text-white"
              fill="currentColor"
            >
              <path d="M12 2c-5.53 0-10 4.47-10 10 0 4.42 2.87 8.166 6.84 9.49.5.09.68-.217.68-.483 0-.237-.01-.868-.015-1.703-2.782.603-3.369-1.342-3.369-1.342-.454-1.153-1.11-1.461-1.11-1.461-.908-.62.069-.607.069-.607 1.004.07 1.532 1.032 1.532 1.032.892 1.528 2.341 1.087 2.91.832.09-.646.35-1.086.636-1.337-2.22-.252-4.555-1.11-4.555-4.938 0-1.09.39-1.984 1.03-2.682-.103-.253-.447-1.27.098-2.647 0 0 .84-.269 2.75 1.026A9.564 9.564 0 0 1 12 6.844a9.6 9.6 0 0 1 2.504.337c1.909-1.295 2.748-1.026 2.748-1.026.546 1.377.202 2.394.1 2.647.64.698 1.028 1.592 1.028 2.682 0 3.836-2.338 4.683-4.566 4.932.359.309.678.921.678 1.856 0 1.339-.012 2.419-.012 2.749 0 .268.18.58.688.481A10.01 10.01 0 0 0 22 12c0-5.53-4.47-10-10-10z"/>
            </svg>
            <span className="hidden sm:inline">GitHub</span>
          </a>

          {/* LinkedIn */}
          <a
            href="https://www.linkedin.com/in/prateekmulye/"
            target="_blank"
            rel="noreferrer"
            title="Open LinkedIn"
            className="group inline-flex items-center gap-2 rounded-md px-2.5 py-1.5
                       bg-zinc-900/50 border border-zinc-800 text-zinc-300
                       hover:text-white hover:border-zinc-700 transition"
          >
            <svg
              viewBox="0 0 24 24"
              aria-hidden="true"
              className="w-4 h-4 text-zinc-300 group-hover:text-white"
              fill="currentColor"
            >
              <path d="M20.447 20.452H17.21v-5.569c0-1.328-.026-3.037-1.852-3.037-1.853 0-2.136 1.445-2.136 2.939v5.667H9.086V9h3.112v1.561h.045c.434-.82 1.494-1.686 3.073-1.686 3.29 0 3.895 2.165 3.895 4.977v6.6zM5.337 7.433a1.804 1.804 0 11-.003-3.608 1.804 1.804 0 01.003 3.608zM6.813 20.452H3.861V9h2.952v11.452z"/>
            </svg>
            <span className="hidden sm:inline">LinkedIn</span>
          </a>
        </div>
      </nav>
    </header>
  );
}