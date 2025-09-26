"use client";
import { useState, useRef, useEffect } from "react";
import ModernNavbar from "@/components/ModernNavbar";
import { apiPost } from "@/lib/api";

interface Message {
  id: string;
  text: string;
  sender: 'user' | 'ai';
  timestamp: Date;
  isTyping?: boolean;
}

export default function ChatPage() {
  const [messages, setMessages] = useState<Message[]>([
    {
      id: '1',
      text: "Hello! I'm your dedicated F1 AI assistant. I have access to comprehensive Formula 1 data including race results, driver statistics, team performance, and can make predictions for upcoming races. What would you like to know?",
      sender: 'ai',
      timestamp: new Date(),
    }
  ]);
  const [inputValue, setInputValue] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (messagesEndRef.current) {
      messagesEndRef.current.scrollIntoView({ behavior: 'smooth' });
    }
  }, [messages]);

  useEffect(() => {
    if (inputRef.current) {
      inputRef.current.focus();
    }
  }, []);

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
      const aiResponse = await apiPost('chat/message', { query: text.trim() });
      const responseText = typeof aiResponse === 'string' ? aiResponse : aiResponse?.content || aiResponse?.message || "I apologize, but I couldn't process your request properly.";

      const aiMessage: Message = {
        id: (Date.now() + 1).toString(),
        text: responseText,
        sender: 'ai',
        timestamp: new Date(),
      };

      setMessages(prev => [...prev, aiMessage]);
    } catch (error) {
      const errorMessage: Message = {
        id: (Date.now() + 1).toString(),
        text: "I apologize, but I'm having trouble connecting right now. Please try again in a moment.",
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

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSendMessage(inputValue);
    }
  };

  const quickQuestions = [
    {
      category: "Race Predictions",
      questions: [
        "Who will win the next race?",
        "What are the podium chances for Hamilton?",
        "Show me predictions for the Hungarian Grand Prix",
        "Which driver has the best championship chances?"
      ]
    },
    {
      category: "Driver Analysis",
      questions: [
        "Compare Verstappen vs Leclerc performance",
        "How has Norris improved this season?",
        "Show me Russell's race statistics",
        "Who is the most consistent driver this year?"
      ]
    },
    {
      category: "Team Performance",
      questions: [
        "How are Red Bull performing compared to last year?",
        "Which team has the most wins this season?",
        "Compare Mercedes vs Ferrari development",
        "Show me McLaren's recent results"
      ]
    },
    {
      category: "Historical Data",
      questions: [
        "Who has won the most races at Silverstone?",
        "Show me championship standings history",
        "What was the fastest lap ever recorded?",
        "Which team dominated the 2000s?"
      ]
    }
  ];

  const clearChat = () => {
    setMessages([
      {
        id: '1',
        text: "Hello! I'm your dedicated F1 AI assistant. I have access to comprehensive Formula 1 data including race results, driver statistics, team performance, and can make predictions for upcoming races. What would you like to know?",
        sender: 'ai',
        timestamp: new Date(),
      }
    ]);
  };

  return (
    <div className="min-h-screen bg-black text-white">
      <ModernNavbar />

      <div className="pt-20 h-screen flex flex-col">
        {/* Chat Header */}
        <div className="bg-gradient-to-r from-gray-900 to-black border-b border-gray-800 p-6">
          <div className="container-fluid">
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-4">
                <div className="w-12 h-12 rounded-full bg-gradient-to-r from-red-600 to-red-700 flex items-center justify-center">
                  <span className="text-white text-xl">🤖</span>
                </div>
                <div>
                  <h1 className="text-2xl font-bold text-white">F1 AI Assistant</h1>
                  <div className="flex items-center space-x-2">
                    <div className="w-2 h-2 bg-green-400 rounded-full animate-pulse"></div>
                    <span className="text-sm text-green-400">Online & Ready</span>
                    <span className="text-sm text-gray-400">• Powered by Groq Llama 3.1</span>
                  </div>
                </div>
              </div>
              <button
                onClick={clearChat}
                className="glass-button px-4 py-2 text-sm hover:border-red-400"
              >
                Clear Chat
              </button>
            </div>
          </div>
        </div>

        <div className="flex-1 flex overflow-hidden">
          {/* Main Chat Area */}
          <div className="flex-1 flex flex-col">
            {/* Messages */}
            <div className="flex-1 overflow-y-auto p-6">
              <div className="container-fluid max-w-4xl mx-auto">
                <div className="space-y-6">
                  {messages.map((message, index) => (
                    <div
                      key={message.id}
                      className={`flex ${message.sender === 'user' ? 'justify-end' : 'justify-start'} fade-in`}
                      style={{ animationDelay: `${index * 0.1}s` }}
                    >
                      <div className={`max-w-[80%] ${
                        message.sender === 'user' ? 'order-2' : 'order-1'
                      }`}>
                        <div
                          className={`p-4 rounded-2xl ${
                            message.sender === 'user'
                              ? 'bg-gradient-to-r from-red-600 to-red-700 text-white rounded-br-md'
                              : 'glass-card text-gray-100 rounded-bl-md'
                          }`}
                        >
                          <p className="whitespace-pre-wrap leading-relaxed">{message.text}</p>
                          <p className={`text-xs mt-2 opacity-70 ${
                            message.sender === 'user' ? 'text-red-100' : 'text-gray-400'
                          }`}>
                            {message.timestamp.toLocaleTimeString([], {
                              hour: '2-digit',
                              minute: '2-digit',
                              second: '2-digit'
                            })}
                          </p>
                        </div>
                      </div>
                    </div>
                  ))}

                  {isLoading && (
                    <div className="flex justify-start fade-in">
                      <div className="glass-card text-gray-100 rounded-2xl rounded-bl-md p-4 max-w-[80%]">
                        <div className="flex items-center space-x-3">
                          <div className="flex space-x-1">
                            <div className="w-2 h-2 bg-gray-400 rounded-full animate-pulse"></div>
                            <div className="w-2 h-2 bg-gray-400 rounded-full animate-pulse" style={{ animationDelay: '0.2s' }}></div>
                            <div className="w-2 h-2 bg-gray-400 rounded-full animate-pulse" style={{ animationDelay: '0.4s' }}></div>
                          </div>
                          <span className="text-sm text-gray-400">AI is analyzing your question...</span>
                        </div>
                      </div>
                    </div>
                  )}
                  <div ref={messagesEndRef} />
                </div>
              </div>
            </div>

            {/* Input Area */}
            <div className="border-t border-gray-800 p-6 bg-gradient-to-t from-gray-900 to-transparent">
              <div className="container-fluid max-w-4xl mx-auto">
                <form onSubmit={handleSubmit} className="flex items-end space-x-4">
                  <div className="flex-1">
                    <textarea
                      ref={inputRef}
                      value={inputValue}
                      onChange={(e) => setInputValue(e.target.value)}
                      onKeyPress={handleKeyPress}
                      placeholder="Ask me anything about Formula 1 - drivers, teams, predictions, race results..."
                      className="w-full bg-white/10 border border-white/20 rounded-xl px-4 py-3 text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-red-500 focus:border-transparent transition-all resize-none min-h-[60px] max-h-[120px]"
                      disabled={isLoading}
                      rows={2}
                    />
                    <div className="flex items-center justify-between mt-2">
                      <div className="text-xs text-gray-500">
                        Press Enter to send, Shift+Enter for new line
                      </div>
                      <div className="text-xs text-gray-500">
                        {inputValue.length}/1000
                      </div>
                    </div>
                  </div>
                  <button
                    type="submit"
                    disabled={!inputValue.trim() || isLoading || inputValue.length > 1000}
                    className="glass-button px-6 py-4 font-semibold bg-red-600 border-red-500 text-white hover:bg-red-700 disabled:opacity-50 disabled:cursor-not-allowed transition-all"
                  >
                    Send
                  </button>
                </form>
              </div>
            </div>
          </div>

          {/* Sidebar with Quick Questions */}
          <div className="w-80 border-l border-gray-800 p-6 overflow-y-auto bg-gradient-to-b from-gray-900/50 to-transparent">
            <h3 className="text-lg font-semibold text-white mb-6">Quick Questions</h3>

            <div className="space-y-6">
              {quickQuestions.map((category, categoryIndex) => (
                <div key={categoryIndex} className="fade-in" style={{ animationDelay: `${categoryIndex * 0.1}s` }}>
                  <h4 className="text-sm font-medium text-gray-300 mb-3 uppercase tracking-wide">
                    {category.category}
                  </h4>
                  <div className="space-y-2">
                    {category.questions.map((question, questionIndex) => (
                      <button
                        key={questionIndex}
                        onClick={() => handleSendMessage(question)}
                        disabled={isLoading}
                        className="w-full text-left p-3 rounded-lg border border-gray-700 hover:border-gray-600 hover:bg-gray-800/50 transition-all duration-200 text-sm text-gray-300 hover:text-white disabled:opacity-50 disabled:cursor-not-allowed"
                      >
                        {question}
                      </button>
                    ))}
                  </div>
                </div>
              ))}
            </div>

            {/* AI Capabilities */}
            <div className="mt-8 p-4 glass-card fade-in">
              <h4 className="text-sm font-semibold text-white mb-3">🧠 AI Capabilities</h4>
              <ul className="space-y-1 text-xs text-gray-400">
                <li>• Real-time F1 data access</li>
                <li>• Race outcome predictions</li>
                <li>• Driver & team analysis</li>
                <li>• Historical statistics</li>
                <li>• Championship insights</li>
                <li>• Weather impact analysis</li>
              </ul>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}