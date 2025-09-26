"use client";
import { useState } from "react";
import NavBar from "@/components/NavBar";
import Footer from "@/components/Footer";
import AgentChatStreaming from "@/components/AgentChatStreaming";

export default function AgentPage() {
  const [selectedExample, setSelectedExample] = useState<string | null>(null);

  const exampleQuestions = [
    {
      category: "Driver Analysis",
      questions: [
        "Who has the best chance of winning at Silverstone?",
        "How does Max Verstappen perform at street circuits?",
        "Which rookie driver shows the most promise this season?"
      ],
      icon: "👨‍✈️",
      color: "from-blue-500 to-blue-600"
    },
    {
      category: "Race Strategy",
      questions: [
        "What's the optimal pit stop strategy for Monaco?",
        "How does weather affect race outcomes at Spa?",
        "Which tire compound works best at this circuit?"
      ],
      icon: "🎯",
      color: "from-green-500 to-green-600"
    },
    {
      category: "Team Performance",
      questions: [
        "How has Red Bull's performance changed this season?",
        "Which team has the most consistent results?",
        "What's Ferrari's strongest circuit type?"
      ],
      icon: "🏆",
      color: "from-purple-500 to-purple-600"
    },
    {
      category: "Historical Data",
      questions: [
        "Who has won the most races at this circuit?",
        "What's the most common winning strategy here?",
        "How do qualifying positions correlate with race results?"
      ],
      icon: "📊",
      color: "from-orange-500 to-orange-600"
    }
  ];

  const handleExampleClick = (question: string) => {
    setSelectedExample(question);
    // This would ideally trigger the chat input to be filled with the question
    // For now, we'll just show it as selected
  };

  return (
    <main className="min-h-screen">
      <NavBar />

      {/* Hero Section */}
      <section className="relative py-16 bg-gradient-to-br from-zinc-900 to-black border-b border-zinc-800">
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_center,_var(--tw-gradient-stops))] from-red-900/10 via-transparent to-transparent"></div>
        <div className="container-page relative">
          <div className="text-center mb-12">
            <h1 className="text-5xl md:text-6xl font-bold bg-gradient-to-r from-white to-zinc-300 bg-clip-text text-transparent mb-4">
              AI Race Agent
            </h1>
            <p className="text-xl text-zinc-400 max-w-3xl mx-auto mb-8">
              Chat with our expert F1 AI agent powered by advanced language models. Ask about drivers, teams, strategies, and get detailed race insights.
            </p>

            {/* Quick Stats */}
            <div className="flex justify-center gap-8 text-center">
              <div>
                <div className="text-2xl font-bold text-red-500">2024</div>
                <div className="text-sm text-zinc-400">Season Data</div>
              </div>
              <div>
                <div className="text-2xl font-bold text-red-500">20+</div>
                <div className="text-sm text-zinc-400">Circuits</div>
              </div>
              <div>
                <div className="text-2xl font-bold text-red-500">10</div>
                <div className="text-sm text-zinc-400">Teams</div>
              </div>
            </div>
          </div>
        </div>
      </section>

      <div className="container-page py-12">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Chat Interface - Takes 2/3 width on large screens */}
          <div className="lg:col-span-2 order-2 lg:order-1">
            <div className="card h-full min-h-[600px]">
              <div className="card-header">
                <div className="flex items-center gap-3">
                  <div className="w-3 h-3 bg-green-500 rounded-full animate-pulse"></div>
                  <h3 className="text-lg font-semibold">F1 Expert Agent</h3>
                  <span className="text-xs bg-green-500/20 text-green-400 px-2 py-1 rounded-full">Online</span>
                </div>
                {selectedExample && (
                  <div className="text-sm text-zinc-400">
                    Suggested: &quot;{selectedExample}&quot;
                  </div>
                )}
              </div>
              <div className="card-body h-full">
                <AgentChatStreaming />
              </div>
            </div>
          </div>

          {/* Example Questions Sidebar */}
          <div className="order-1 lg:order-2">
            <div className="sticky top-24">
              <h3 className="text-lg font-semibold text-white mb-6">Try Asking About...</h3>

              <div className="space-y-6">
                {exampleQuestions.map((category, categoryIndex) => (
                  <div key={categoryIndex}>
                    <div className="flex items-center gap-2 mb-3">
                      <div className={`w-8 h-8 rounded-lg bg-gradient-to-br ${category.color} flex items-center justify-center text-sm`}>
                        {category.icon}
                      </div>
                      <h4 className="font-medium text-white text-sm">{category.category}</h4>
                    </div>

                    <div className="space-y-2">
                      {category.questions.map((question, questionIndex) => (
                        <button
                          key={questionIndex}
                          onClick={() => handleExampleClick(question)}
                          className={`w-full text-left p-3 rounded-lg border transition-all duration-200 hover:scale-[1.02] ${
                            selectedExample === question
                              ? 'bg-red-500/20 border-red-500/50 text-red-200'
                              : 'bg-zinc-900/60 border-zinc-700 text-zinc-300 hover:border-zinc-600 hover:bg-zinc-800/60'
                          }`}
                        >
                          <div className="text-sm">{question}</div>
                        </button>
                      ))}
                    </div>
                  </div>
                ))}
              </div>

              {/* Tips */}
              <div className="mt-8 p-4 bg-zinc-900/40 border border-zinc-700 rounded-lg">
                <h4 className="font-medium text-white mb-2">💡 Tips</h4>
                <ul className="text-sm text-zinc-400 space-y-1">
                  <li>• Be specific about races, drivers, or teams</li>
                  <li>• Ask follow-up questions for deeper insights</li>
                  <li>• Request explanations for predictions</li>
                </ul>
              </div>
            </div>
          </div>
        </div>
      </div>

      <Footer />
    </main>
  );
}