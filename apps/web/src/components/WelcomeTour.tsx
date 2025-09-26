"use client";
import { useState, useEffect } from "react";
import { createPortal } from "react-dom";

interface WelcomeTourProps {
  onClose: () => void;
}

export default function WelcomeTour({ onClose }: WelcomeTourProps) {
  const [currentPage, setCurrentPage] = useState(0);
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  const pages = [
    {
      title: "Welcome to Slipstream",
      subtitle: "Your AI-Powered F1 Race Predictor",
      content: "Experience the thrill of Formula 1 with cutting-edge AI predictions. Get real-time insights, probability analysis, and expert explanations for every race.",
      icon: (
        <div className="w-20 h-20 mx-auto mb-6 relative">
          <div className="absolute inset-0 bg-gradient-to-br from-red-500 to-red-600 rounded-full animate-pulse opacity-20"></div>
          <div className="relative bg-gradient-to-br from-red-500 to-red-600 rounded-full w-full h-full flex items-center justify-center">
            <svg className="w-10 h-10 text-white" fill="currentColor" viewBox="0 0 24 24">
              <path d="M12 2L3.09 8.26L12 22L20.91 8.26L12 2ZM12 4.44L18.18 9.26L12 19.56L5.82 9.26L12 4.44Z"/>
            </svg>
          </div>
        </div>
      )
    },
    {
      title: "Race Predictions & Analytics",
      subtitle: "Data-Driven Insights at Your Fingertips",
      content: "Explore detailed probability charts, driver performance metrics, and race outcome predictions powered by advanced machine learning models trained on historical F1 data.",
      icon: (
        <div className="w-20 h-20 mx-auto mb-6 relative">
          <div className="absolute inset-0 bg-gradient-to-br from-blue-500 to-blue-600 rounded-full animate-pulse opacity-20"></div>
          <div className="relative bg-gradient-to-br from-blue-500 to-blue-600 rounded-full w-full h-full flex items-center justify-center">
            <svg className="w-10 h-10 text-white" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
              <path d="M3 3v18h18"/>
              <path d="M8 12l4-4 4 4"/>
            </svg>
          </div>
        </div>
      )
    },
    {
      title: "AI Agent Assistant",
      subtitle: "Ask Questions, Get Expert Answers",
      content: "Chat with our F1 expert AI agent for personalized insights, race strategies, and detailed explanations. Simply ask about any driver, team, or race scenario.",
      icon: (
        <div className="w-20 h-20 mx-auto mb-6 relative">
          <div className="absolute inset-0 bg-gradient-to-br from-green-500 to-green-600 rounded-full animate-pulse opacity-20"></div>
          <div className="relative bg-gradient-to-br from-green-500 to-green-600 rounded-full w-full h-full flex items-center justify-center">
            <svg className="w-10 h-10 text-white" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
              <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"/>
              <path d="M13 8H7"/>
              <path d="M17 12H7"/>
            </svg>
          </div>
        </div>
      )
    }
  ];

  const nextPage = () => {
    if (currentPage < pages.length - 1) {
      setCurrentPage(currentPage + 1);
    } else {
      onClose();
    }
  };

  const prevPage = () => {
    if (currentPage > 0) {
      setCurrentPage(currentPage - 1);
    }
  };

  const skipTour = () => {
    onClose();
  };

  if (!mounted) return null;

  return createPortal(
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-fadeIn">
      <div className="relative max-w-md w-full bg-zinc-900 border border-zinc-700 rounded-2xl shadow-2xl animate-slideUp">
        {/* Progress bar */}
        <div className="absolute top-0 left-0 h-1 bg-gradient-to-r from-red-500 to-red-600 rounded-t-2xl transition-all duration-500 ease-out"
             style={{ width: `${((currentPage + 1) / pages.length) * 100}%` }}></div>

        {/* Skip button */}
        <button
          onClick={skipTour}
          className="absolute top-4 right-4 text-zinc-400 hover:text-white transition-colors z-10"
        >
          <svg className="w-5 h-5" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
            <path d="M6 18L18 6M6 6l12 12"/>
          </svg>
        </button>

        <div className="p-8 text-center">
          {pages[currentPage].icon}

          <h2 className="text-2xl font-bold text-white mb-2">
            {pages[currentPage].title}
          </h2>

          <h3 className="text-sm font-medium text-red-400 mb-4">
            {pages[currentPage].subtitle}
          </h3>

          <p className="text-zinc-300 leading-relaxed mb-8">
            {pages[currentPage].content}
          </p>

          {/* Page indicators */}
          <div className="flex justify-center space-x-2 mb-6">
            {pages.map((_, index) => (
              <div
                key={index}
                className={`w-2 h-2 rounded-full transition-all duration-300 ${
                  index === currentPage
                    ? 'bg-red-500 w-8'
                    : index < currentPage
                    ? 'bg-red-500/50'
                    : 'bg-zinc-600'
                }`}
              />
            ))}
          </div>

          {/* Navigation buttons */}
          <div className="flex justify-between">
            <button
              onClick={prevPage}
              disabled={currentPage === 0}
              className={`px-4 py-2 rounded-lg font-medium transition-all ${
                currentPage === 0
                  ? 'text-zinc-500 cursor-not-allowed'
                  : 'text-zinc-300 hover:text-white hover:bg-zinc-800'
              }`}
            >
              Previous
            </button>

            <button
              onClick={nextPage}
              className="px-6 py-2 bg-gradient-to-r from-red-500 to-red-600 hover:from-red-600 hover:to-red-700 text-white font-medium rounded-lg transition-all duration-200 transform hover:scale-105 shadow-lg"
            >
              {currentPage === pages.length - 1 ? 'Get Started' : 'Next'}
            </button>
          </div>
        </div>

        {/* F1 themed decorative elements */}
        <div className="absolute -top-4 -left-4 w-8 h-8 border-2 border-red-500/30 rounded-full animate-ping"></div>
        <div className="absolute -bottom-4 -right-4 w-6 h-6 border-2 border-red-500/30 rounded-full animate-ping animation-delay-1000"></div>
      </div>
    </div>,
    document.body
  );
}