"use client";
import { useState, useEffect } from "react";
import { usePathname } from "next/navigation";
import Link from "next/link";

interface NavbarProps {
  onMenuToggle?: (isOpen: boolean) => void;
}

export default function ModernNavbar({ onMenuToggle }: NavbarProps) {
  const [isScrolled, setIsScrolled] = useState(false);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const pathname = usePathname();

  useEffect(() => {
    const handleScroll = () => {
      setIsScrolled(window.scrollY > 20);
    };

    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  const navigationItems = [
    { name: 'Home', href: '/', icon: '🏠' },
    { name: 'Results', href: '/results', icon: '🏁' },
    { name: 'Standings', href: '/standings', icon: '🏆' },
    { name: 'Predictions', href: '/predictions', icon: '📊' },
    { name: 'AI Chat', href: '/chat', icon: '🤖' },
  ];

  const isActive = (href: string) => {
    if (href === '/' && pathname === '/') return true;
    if (href !== '/' && pathname?.startsWith(href)) return true;
    return false;
  };

  const toggleMobileMenu = () => {
    const newState = !isMobileMenuOpen;
    setIsMobileMenuOpen(newState);
    onMenuToggle?.(newState);
  };

  return (
    <>
      <nav className={`glass-nav fixed top-0 left-0 right-0 z-50 transition-all duration-300 ${
        isScrolled ? 'py-3' : 'py-4'
      }`}>
        <div className="container-fluid">
          <div className="flex items-center justify-between">
            {/* Brand Logo */}
            <Link href="/" className="flex items-center space-x-3 group">
              <div className="relative">
                <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-red-600 to-red-700 flex items-center justify-center shadow-lg group-hover:shadow-red-500/25 transition-all duration-300">
                  <span className="text-white font-bold text-lg">F1</span>
                </div>
                <div className="absolute -top-1 -right-1 w-3 h-3 bg-yellow-400 rounded-full animate-pulse"></div>
              </div>
              <div>
                <h1 className="text-xl font-bold f1-gradient-text">SLIPSTREAM</h1>
                <p className="text-xs text-gray-400 -mt-1">AI Race Intelligence</p>
              </div>
            </Link>

            {/* Desktop Navigation */}
            <div className="hidden lg:flex items-center space-x-1">
              {navigationItems.map((item) => (
                <Link
                  key={item.href}
                  href={item.href}
                  className={`glass-button px-4 py-2 text-sm font-medium transition-all duration-200 flex items-center space-x-2 ${
                    isActive(item.href)
                      ? 'bg-red-600 border-red-500 text-white shadow-lg shadow-red-500/25'
                      : 'hover:border-red-400'
                  }`}
                >
                  <span className="text-base">{item.icon}</span>
                  <span>{item.name}</span>
                </Link>
              ))}
            </div>

            {/* Desktop Action Buttons */}
            <div className="hidden lg:flex items-center space-x-3">
              <a
                href="https://github.com/prateekmulye/f1-agent"
                target="_blank"
                rel="noopener noreferrer"
                className="glass-button p-3 hover:border-gray-400 group"
                aria-label="GitHub"
              >
                <svg className="w-5 h-5 group-hover:scale-110 transition-transform" fill="currentColor" viewBox="0 0 24 24">
                  <path d="M12 0c-6.626 0-12 5.373-12 12 0 5.302 3.438 9.8 8.207 11.387.599.111.793-.261.793-.577v-2.234c-3.338.726-4.033-1.416-4.033-1.416-.546-1.387-1.333-1.756-1.333-1.756-1.089-.745.083-.729.083-.729 1.205.084 1.839 1.237 1.839 1.237 1.07 1.834 2.807 1.304 3.492.997.107-.775.418-1.305.762-1.604-2.665-.305-5.467-1.334-5.467-5.931 0-1.311.469-2.381 1.236-3.221-.124-.303-.535-1.524.117-3.176 0 0 1.008-.322 3.301 1.23.957-.266 1.983-.399 3.003-.404 1.02.005 2.047.138 3.006.404 2.291-1.552 3.297-1.23 3.297-1.23.653 1.653.242 2.874.118 3.176.77.84 1.235 1.911 1.235 3.221 0 4.609-2.807 5.624-5.479 5.921.43.372.823 1.102.823 2.222v3.293c0 .319.192.694.801.576 4.765-1.589 8.199-6.086 8.199-11.386 0-6.627-5.373-12-12-12z"/>
                </svg>
              </a>
              <div className="px-3 py-2 bg-green-500/20 border border-green-500/30 rounded-xl text-green-400 text-xs font-medium">
                LIVE
              </div>
            </div>

            {/* Mobile Menu Button */}
            <button
              onClick={toggleMobileMenu}
              className="lg:hidden glass-button p-3"
              aria-label="Toggle mobile menu"
            >
              <div className="w-5 h-5 relative">
                <span className={`absolute w-full h-0.5 bg-current transition-all duration-300 ${
                  isMobileMenuOpen ? 'top-2 rotate-45' : 'top-1'
                }`} />
                <span className={`absolute w-full h-0.5 bg-current top-2 transition-all duration-300 ${
                  isMobileMenuOpen ? 'opacity-0' : 'opacity-100'
                }`} />
                <span className={`absolute w-full h-0.5 bg-current transition-all duration-300 ${
                  isMobileMenuOpen ? 'top-2 -rotate-45' : 'top-3'
                }`} />
              </div>
            </button>
          </div>
        </div>

        {/* Mobile Menu Overlay */}
        {isMobileMenuOpen && (
          <div className="lg:hidden absolute top-full left-0 right-0 glass-nav border-t border-white/10">
            <div className="container-fluid py-6">
              <div className="space-y-4">
                {navigationItems.map((item, index) => (
                  <Link
                    key={item.href}
                    href={item.href}
                    onClick={() => setIsMobileMenuOpen(false)}
                    className={`flex items-center space-x-3 p-4 rounded-xl transition-all duration-200 ${
                      isActive(item.href)
                        ? 'bg-red-600/20 border border-red-500/30 text-red-400'
                        : 'hover:bg-white/5'
                    }`}
                    style={{ animationDelay: `${index * 0.1}s` }}
                  >
                    <span className="text-xl">{item.icon}</span>
                    <span className="font-medium">{item.name}</span>
                  </Link>
                ))}

                <div className="pt-4 border-t border-white/10">
                  <a
                    href="https://github.com/prateekmulye/f1-agent"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex items-center space-x-3 p-4 rounded-xl hover:bg-white/5 transition-all duration-200"
                  >
                    <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24">
                      <path d="M12 0c-6.626 0-12 5.373-12 12 0 5.302 3.438 9.8 8.207 11.387.599.111.793-.261.793-.577v-2.234c-3.338.726-4.033-1.416-4.033-1.416-.546-1.387-1.333-1.756-1.333-1.756-1.089-.745.083-.729.083-.729 1.205.084 1.839 1.237 1.839 1.237 1.07 1.834 2.807 1.304 3.492.997.107-.775.418-1.305.762-1.604-2.665-.305-5.467-1.334-5.467-5.931 0-1.311.469-2.381 1.236-3.221-.124-.303-.535-1.524.117-3.176 0 0 1.008-.322 3.301 1.23.957-.266 1.983-.399 3.003-.404 1.02.005 2.047.138 3.006.404 2.291-1.552 3.297-1.23 3.297-1.23.653 1.653.242 2.874.118 3.176.77.84 1.235 1.911 1.235 3.221 0 4.609-2.807 5.624-5.479 5.921.43.372.823 1.102.823 2.222v3.293c0 .319.192.694.801.576 4.765-1.589 8.199-6.086 8.199-11.386 0-6.627-5.373-12-12-12z"/>
                    </svg>
                    <span className="font-medium">View Source</span>
                  </a>
                </div>
              </div>
            </div>
          </div>
        )}
      </nav>

      {/* Mobile Menu Backdrop */}
      {isMobileMenuOpen && (
        <div
          className="fixed inset-0 bg-black/50 backdrop-blur-sm z-40 lg:hidden"
          onClick={() => setIsMobileMenuOpen(false)}
        />
      )}
    </>
  );
}