"use client";
import NavBar from "@/components/NavBar";
import Footer from "@/components/Footer";
import LiveSnapshot from "@/components/LiveSnapshot";

export default function LivePage() {
  return (
    <main className="min-h-screen">
      <NavBar />

      {/* Hero Section */}
      <section className="relative py-16 bg-gradient-to-br from-zinc-900 to-black border-b border-zinc-800">
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_center,_var(--tw-gradient-stops))] from-red-900/10 via-transparent to-transparent"></div>
        <div className="container-page relative">
          <div className="text-center mb-8">
            <h1 className="text-5xl md:text-6xl font-bold bg-gradient-to-r from-white to-zinc-300 bg-clip-text text-transparent mb-4">
              Live Trackside
            </h1>
            <p className="text-xl text-zinc-400 max-w-3xl mx-auto">
              Real-time race conditions, leader updates, and trackside information powered by OpenF1 API.
            </p>
          </div>

          {/* Status Indicators */}
          <div className="flex justify-center gap-8">
            <div className="flex items-center gap-2">
              <div className="w-3 h-3 bg-green-500 rounded-full animate-pulse"></div>
              <span className="text-sm text-zinc-300">Live Data</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-3 h-3 bg-blue-500 rounded-full animate-pulse"></div>
              <span className="text-sm text-zinc-300">Real-time Updates</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-3 h-3 bg-orange-500 rounded-full animate-pulse"></div>
              <span className="text-sm text-zinc-300">Race Conditions</span>
            </div>
          </div>
        </div>
      </section>

      {/* Content */}
      <div className="container-page py-12">
        {/* Main Live Feed */}
        <div className="mb-12">
          <div className="card">
            <div className="card-header">
              <div className="flex items-center gap-3">
                <div className="w-4 h-4 bg-red-500 rounded-full animate-pulse"></div>
                <h3 className="text-lg font-semibold">Live Race Feed</h3>
                <span className="text-xs bg-red-500/20 text-red-400 px-2 py-1 rounded-full">
                  LIVE
                </span>
              </div>
              <div className="text-sm text-zinc-400">
                Updated every 30 seconds
              </div>
            </div>
            <div className="card-body">
              <LiveSnapshot />
            </div>
          </div>
        </div>

        {/* Information Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
          {/* Weather Conditions */}
          <div className="card">
            <div className="card-header">
              <h3 className="font-semibold">Weather Conditions</h3>
              <div className="text-2xl">☀️</div>
            </div>
            <div className="card-body space-y-3">
              <div className="flex justify-between">
                <span className="text-zinc-400">Temperature</span>
                <span className="text-white">24°C</span>
              </div>
              <div className="flex justify-between">
                <span className="text-zinc-400">Track Temp</span>
                <span className="text-white">36°C</span>
              </div>
              <div className="flex justify-between">
                <span className="text-zinc-400">Humidity</span>
                <span className="text-white">45%</span>
              </div>
              <div className="flex justify-between">
                <span className="text-zinc-400">Rain Chance</span>
                <span className="text-green-400">0%</span>
              </div>
            </div>
          </div>

          {/* Track Status */}
          <div className="card">
            <div className="card-header">
              <h3 className="font-semibold">Track Status</h3>
              <div className="w-3 h-3 bg-green-500 rounded-full"></div>
            </div>
            <div className="card-body space-y-3">
              <div className="flex items-center gap-2">
                <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                <span>Green Flag</span>
              </div>
              <div className="text-sm text-zinc-400">
                Racing conditions are optimal
              </div>
              <div className="mt-4 p-3 bg-green-500/10 border border-green-500/20 rounded-lg">
                <div className="text-sm font-medium text-green-400">All Clear</div>
                <div className="text-xs text-green-300/80">No incidents reported</div>
              </div>
            </div>
          </div>

          {/* Session Info */}
          <div className="card">
            <div className="card-header">
              <h3 className="font-semibold">Session Info</h3>
              <div className="text-xs bg-blue-500/20 text-blue-400 px-2 py-1 rounded">
                QUALIFYING
              </div>
            </div>
            <div className="card-body space-y-3">
              <div className="flex justify-between">
                <span className="text-zinc-400">Session</span>
                <span className="text-white">Q3</span>
              </div>
              <div className="flex justify-between">
                <span className="text-zinc-400">Time Left</span>
                <span className="text-white font-mono">08:45</span>
              </div>
              <div className="flex justify-between">
                <span className="text-zinc-400">Cars On Track</span>
                <span className="text-white">18/20</span>
              </div>
            </div>
          </div>
        </div>

        {/* Feature Cards */}
        <div className="mt-12 grid grid-cols-1 md:grid-cols-2 gap-8">
          <div className="group hover:scale-[1.02] transition-transform duration-200">
            <div className="bg-gradient-to-br from-zinc-900 to-zinc-800 border border-zinc-700 rounded-xl p-8 h-full hover:border-zinc-600 transition-colors">
              <div className="w-12 h-12 rounded-lg bg-gradient-to-br from-red-500 to-red-600 flex items-center justify-center text-2xl mb-4">
                📡
              </div>
              <h4 className="text-xl font-semibold text-white mb-3">Real-time Telemetry</h4>
              <p className="text-zinc-400 leading-relaxed">
                Access live car data including speed, tire temperature, fuel levels, and more from the OpenF1 API during race sessions.
              </p>
            </div>
          </div>

          <div className="group hover:scale-[1.02] transition-transform duration-200">
            <div className="bg-gradient-to-br from-zinc-900 to-zinc-800 border border-zinc-700 rounded-xl p-8 h-full hover:border-zinc-600 transition-colors">
              <div className="w-12 h-12 rounded-lg bg-gradient-to-br from-blue-500 to-blue-600 flex items-center justify-center text-2xl mb-4">
                🏁
              </div>
              <h4 className="text-xl font-semibold text-white mb-3">Position Tracking</h4>
              <p className="text-zinc-400 leading-relaxed">
                Follow every position change, sector times, and lap-by-lap performance data as it happens during live sessions.
              </p>
            </div>
          </div>
        </div>
      </div>

      <Footer />
    </main>
  );
}