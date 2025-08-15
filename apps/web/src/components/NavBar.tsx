export default function NavBar() {
    return (
        <header className="sticky top-0 z-20 bg-f1-carbon/70 backdrop-blur border-b border-zinc-800">
            <div className="max-w-6xl mx-auto px-4 py-3 flex items-center justify-between">
                <div className="flex items-center gap-3">
                    <div className="w-6 h-6 rounded-sm bg-f1-red"/>
                    <span className="font-semibold text-white">F1 Race Predictor</span>
                </div>
                <a href="https://github.com/prateekmulye/f1-agent" className="text-sm text-zinc-300 hover:text-white">GitHub</a>
                <a href="https://linkedin.com/in/prateekmulye" className="text-sm text-zinc-300 hover:text-white">LinkedIn</a>
            </div>
        </header>
    );
}