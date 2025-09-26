"use client";
import Link from "next/link";

export default function Footer() {
  const currentYear = new Date().getFullYear();

  const footerLinks = {
    Product: [
      { name: "Dashboard", href: "/" },
      { name: "Predictions", href: "/predictions" },
      { name: "AI Agent", href: "/agent" },
      { name: "Live Data", href: "/live" }
    ],
    Resources: [
      { name: "GitHub Repository", href: "https://github.com/prateekmulye/f1-agent" },
      { name: "OpenF1 API", href: "https://openf1.org" },
      { name: "Formula 1", href: "https://formula1.com" },
      { name: "FIA", href: "https://fia.com" }
    ],
    Legal: [
      { name: "Privacy Policy", href: "#" },
      { name: "Terms of Service", href: "#" },
      { name: "Cookies", href: "#" },
      { name: "Disclaimer", href: "#" }
    ]
  };

  return (
    <footer className="relative mt-20 border-t border-zinc-800 bg-zinc-950">
      {/* Racing flag pattern */}
      <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-transparent via-red-500 to-transparent"></div>

      <div className="container-page py-16">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8 mb-12">
          {/* Brand Section */}
          <div className="lg:col-span-1">
            <Link href="/" className="flex items-center gap-3 mb-6 group">
              <div className="relative">
                <div className="w-10 h-10 rounded-lg gradient-f1-red flex items-center justify-center shadow-lg group-hover:scale-110 transition-transform">
                  <span className="text-white font-bold">S</span>
                </div>
                <div className="absolute -top-1 -right-1 w-3 h-3 bg-yellow-400 rounded-full animate-pulse"></div>
              </div>
              <div>
                <div className="brand-word text-xl font-bold">Slipstream</div>
                <div className="text-zinc-500 text-sm">F1 Race Intelligence</div>
              </div>
            </Link>
            <p className="text-zinc-400 text-sm leading-relaxed mb-6">
              Advanced AI-powered Formula 1 predictions and insights. Experience the future of motorsport analytics.
            </p>
            <div className="flex space-x-4">
              <a
                href="https://github.com/prateekmulye/f1-agent"
                target="_blank"
                rel="noopener noreferrer"
                className="w-10 h-10 rounded-lg bg-zinc-800 border border-zinc-700 flex items-center justify-center hover:border-zinc-600 hover:bg-zinc-700 transition-colors group"
              >
                <svg className="w-5 h-5 text-zinc-400 group-hover:text-white" fill="currentColor" viewBox="0 0 24 24">
                  <path d="M12 2C6.48 2 2 6.58 2 12.26c0 4.51 2.87 8.34 6.84 9.69.5.1.68-.22.68-.48 0-.24-.01-.87-.01-1.71-2.78.62-3.37-1.2-3.37-1.2-.45-1.18-1.12-1.5-1.12-1.5-.92-.64.07-.63.07-.63 1.02.07 1.56 1.07 1.56 1.07.9 1.57 2.36 1.12 2.94.86.09-.67.35-1.12.63-1.38-2.22-.26-4.55-1.14-4.55-5.07 0-1.12.39-2.03 1.03-2.75-.1-.26-.45-1.3.1-2.71 0 0 .85-.28 2.78 1.05.81-.23 1.68-.35 2.55-.35.87 0 1.74.12 2.55.35 1.93-1.33 2.78-1.05 2.78-1.05.55 1.41.2 2.45.1 2.71.64.72 1.03 1.63 1.03 2.75 0 3.94-2.33 4.81-4.56 5.07.36.32.68.94.68 1.9 0 1.37-.01 2.47-.01 2.81 0 .26.18.58.69.48A10.04 10.04 0 0 0 22 12.26C22 6.58 17.52 2 12 2Z"/>
                </svg>
              </a>
              <a
                href="https://www.linkedin.com/in/prateekmulye/"
                target="_blank"
                rel="noopener noreferrer"
                className="w-10 h-10 rounded-lg bg-zinc-800 border border-zinc-700 flex items-center justify-center hover:border-zinc-600 hover:bg-zinc-700 transition-colors group"
              >
                <svg className="w-5 h-5 text-zinc-400 group-hover:text-white" fill="currentColor" viewBox="0 0 24 24">
                  <path d="M4.98 3.5a2.5 2.5 0 1 0 0 5 2.5 2.5 0 0 0 0-5ZM3 9h4v12H3V9Zm7 0h3.8v1.64h.05c.53-1 1.83-2.06 3.77-2.06 4.03 0 4.78 2.65 4.78 6.09V21h-4v-5.35c0-1.28-.03-2.92-1.78-2.92-1.78 0-2.06 1.39-2.06 2.83V21H10V9Z"/>
                </svg>
              </a>
            </div>
          </div>

          {/* Footer Links */}
          {Object.entries(footerLinks).map(([category, links]) => (
            <div key={category}>
              <h4 className="font-semibold text-white mb-4">{category}</h4>
              <ul className="space-y-2">
                {links.map((link) => (
                  <li key={link.name}>
                    <Link
                      href={link.href}
                      className="text-zinc-400 hover:text-white transition-colors text-sm"
                      target={link.href.startsWith('http') ? '_blank' : undefined}
                      rel={link.href.startsWith('http') ? 'noopener noreferrer' : undefined}
                    >
                      {link.name}
                    </Link>
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>

        {/* Bottom Bar */}
        <div className="pt-8 border-t border-zinc-800 flex flex-col md:flex-row justify-between items-center gap-4">
          <div className="text-sm text-zinc-500">
            © {currentYear} Slipstream. Built by{" "}
            <a
              href="https://www.linkedin.com/in/prateekmulye/"
              target="_blank"
              rel="noopener noreferrer"
              className="text-zinc-300 hover:text-white transition-colors"
            >
              Prateek Mulye
            </a>
          </div>

          <div className="flex items-center gap-4 text-xs text-zinc-500">
            <div className="flex items-center gap-1">
              <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></div>
              <span>All systems operational</span>
            </div>
            <div className="hidden md:block">•</div>
            <div>Powered by Next.js & OpenF1 API</div>
          </div>
        </div>

        {/* F1 Theme Decoration */}
        <div className="mt-8 flex justify-center">
          <div className="flex items-center gap-2 text-zinc-600 text-xs">
            <span>🏁</span>
            <span>Built for Formula 1 enthusiasts</span>
            <span>🏁</span>
          </div>
        </div>
      </div>
    </footer>
  );
}