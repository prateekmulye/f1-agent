"use client";
import { useState, useRef, useEffect } from "react";
import { createPortal } from "react-dom";

interface Message {
  id: string;
  text: string;
  sender: 'user' | 'ai';
  timestamp: Date;
  isTyping?: boolean;
}

export default function FloatingChat() {
  const [isOpen, setIsOpen] = useState(false);
  const [messages, setMessages] = useState<Message[]>([
    {
      id: '1',
      text: "Hi! I'm your F1 AI assistant. Ask me about race predictions, driver stats, or anything Formula 1 related!",
      sender: 'ai',
      timestamp: new Date(),
    }
  ]);
  const [inputValue, setInputValue] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [mounted, setMounted] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    setMounted(true);
  }, []);

  useEffect(() => {
    if (messagesEndRef.current) {
      messagesEndRef.current.scrollIntoView({ behavior: 'smooth' });
    }
  }, [messages]);

  const handleSendMessage = async (text: string) => {
    if (!text.trim() || isLoading) return;

    const userMessage: Message = {
      id: Date.now().toString(),
      text: text.trim(),
      sender: 'user',
      timestamp: new Date(),
    };

    setMessages(prev => [...prev, userMessage]);
    setInputValue('');
    setIsLoading(true);

    try {
      const response = await fetch('/api/agent', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ query: text.trim() }),
      });

      if (!response.ok) {
        throw new Error('Failed to get AI response');
      }

      const aiResponse = await response.text();

      const aiMessage: Message = {
        id: (Date.now() + 1).toString(),
        text: aiResponse,
        sender: 'ai',
        timestamp: new Date(),
      };

      setMessages(prev => [...prev, aiMessage]);
    } catch (error) {
      const errorMessage: Message = {
        id: (Date.now() + 1).toString(),
        text: "Sorry, I'm having trouble connecting. Please try again later.",
        sender: 'ai',
        timestamp: new Date(),
      };
      setMessages(prev => [...prev, errorMessage]);
    } finally {
      setIsLoading(false);
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    handleSendMessage(inputValue);
  };

  const quickQuestions = [
    "Who will win the next race?",
    "Show me championship standings",
    "Compare Hamilton vs Verstappen",
    "Weather impact on racing"
  ];

  const toggleChat = () => {
    setIsOpen(!isOpen);
    if (!isOpen && inputRef.current) {
      setTimeout(() => inputRef.current?.focus(), 100);
    }
  };

  if (!mounted) return null;

  const chatContent = (
    <>
      {/* Floating Chat Button */}
      <button
        onClick={toggleChat}
        className={`floating-chat ${isOpen ? 'active' : ''}`}
        aria-label={isOpen ? 'Close chat' : 'Open AI chat'}
      >
        {!isOpen ? (
          <div className="text-2xl">🤖</div>
        ) : null}
      </button>

      {/* Chat Interface */}
      {isOpen && (
        <div className="fixed bottom-24 right-6 w-96 h-[600px] glass-card flex flex-col z-50 shadow-2xl">
          {/* Chat Header */}
          <div className="flex items-center justify-between p-4 border-b border-white/10">
            <div className="flex items-center space-x-3">
              <div className="w-10 h-10 rounded-full bg-gradient-to-r from-red-600 to-red-700 flex items-center justify-center">
                <span className="text-white text-lg">🤖</span>
              </div>
              <div>
                <h3 className="font-semibold text-white">F1 AI Assistant</h3>
                <div className="flex items-center space-x-1">
                  <div className="w-2 h-2 bg-green-400 rounded-full animate-pulse"></div>
                  <span className="text-xs text-green-400">Online</span>
                </div>
              </div>
            </div>
            <button
              onClick={toggleChat}
              className="glass-button w-8 h-8 flex items-center justify-center text-gray-400 hover:text-white"
              aria-label="Close chat"
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>

          {/* Messages Area */}
          <div className="flex-1 overflow-y-auto p-4 space-y-4">
            {messages.map((message, index) => (
              <div
                key={message.id}
                className={`flex ${message.sender === 'user' ? 'justify-end' : 'justify-start'} fade-in`}
                style={{ animationDelay: `${index * 0.1}s` }}
              >
                <div
                  className={`max-w-[80%] p-3 rounded-2xl ${
                    message.sender === 'user'
                      ? 'bg-red-600 text-white rounded-br-md'
                      : 'bg-white/10 text-gray-100 rounded-bl-md'
                  }`}
                >
                  <p className="text-sm whitespace-pre-wrap">{message.text}</p>
                  <p className={`text-xs mt-1 opacity-70 ${
                    message.sender === 'user' ? 'text-red-100' : 'text-gray-400'
                  }`}>
                    {message.timestamp.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                  </p>
                </div>
              </div>
            ))}

            {isLoading && (
              <div className="flex justify-start fade-in">
                <div className="bg-white/10 text-gray-100 rounded-2xl rounded-bl-md p-3">
                  <div className="flex items-center space-x-2">
                    <div className="flex space-x-1">
                      <div className="w-2 h-2 bg-gray-400 rounded-full animate-pulse"></div>
                      <div className="w-2 h-2 bg-gray-400 rounded-full animate-pulse" style={{ animationDelay: '0.2s' }}></div>
                      <div className="w-2 h-2 bg-gray-400 rounded-full animate-pulse" style={{ animationDelay: '0.4s' }}></div>
                    </div>
                    <span className="text-xs text-gray-400">AI is thinking...</span>
                  </div>
                </div>
              </div>
            )}
            <div ref={messagesEndRef} />
          </div>

          {/* Quick Questions */}
          {messages.length <= 1 && !isLoading && (
            <div className="px-4 pb-2">
              <div className="text-xs text-gray-400 mb-2">Quick questions:</div>
              <div className="flex flex-wrap gap-2">
                {quickQuestions.map((question, index) => (
                  <button
                    key={index}
                    onClick={() => handleSendMessage(question)}
                    className="text-xs px-3 py-2 bg-white/5 hover:bg-white/10 border border-white/10 rounded-full transition-colors"
                  >
                    {question}
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* Input Area */}
          <form onSubmit={handleSubmit} className="p-4 border-t border-white/10">
            <div className="flex items-center space-x-2">
              <input
                ref={inputRef}
                type="text"
                value={inputValue}
                onChange={(e) => setInputValue(e.target.value)}
                placeholder="Ask about F1 predictions, drivers, teams..."
                className="flex-1 bg-white/10 border border-white/20 rounded-xl px-4 py-3 text-sm text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-red-500 focus:border-transparent transition-all"
                disabled={isLoading}
              />
              <button
                type="submit"
                disabled={!inputValue.trim() || isLoading}
                className="glass-button w-12 h-12 flex items-center justify-center text-red-400 hover:text-red-300 disabled:opacity-50 disabled:cursor-not-allowed"
                aria-label="Send message"
              >
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 19l9 2-9-18-9 18 9-2zm0 0v-8" />
                </svg>
              </button>
            </div>
          </form>

          {/* Powered by indicator */}
          <div className="px-4 pb-2">
            <div className="text-xs text-gray-500 text-center">
              Powered by Groq Llama 3.1 & OpenF1 API
            </div>
          </div>
        </div>
      )}
    </>
  );

  return createPortal(chatContent, document.body);
}