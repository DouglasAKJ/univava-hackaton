import Link from "next/link";
import { Swords, Trophy, BarChart3, Database } from "lucide-react";


export function Navbar() {
  return (
    <header className="sticky top-0 z-50 w-full border-b border-zinc-800 bg-zinc-950/80 backdrop-blur-md">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
        <Link href="/" className="flex items-center gap-3 group">
          <div className="w-10 h-10 rounded-lg bg-gradient-to-tr from-rose-600 to-red-500 flex items-center justify-center shadow-lg shadow-rose-900/40 group-hover:scale-105 transition-transform">
            
            <img src="/icon raze.png" alt="Icone" />


          </div>
          <div>
            <div className="flex items-center gap-2">
              <span className="font-black tracking-wider text-lg text-white font-mono">
                UNIVAVA
              </span>
              <span className="text-[10px] uppercase font-bold tracking-widest px-1.5 py-0.5 rounded bg-rose-500/20 text-rose-400 border border-rose-500/30">
                VALORANT
              </span>
            </div>
            <p className="text-xs text-zinc-400 hidden sm:block">
              Torneio Universitário • Dashboard de Estatísticas
            </p>
          </div>
        </Link>

        <nav className="flex items-center gap-1 sm:gap-2">
          <Link
            href="/"
            className="flex items-center gap-2 px-3 py-1.5 rounded-md text-sm font-medium text-zinc-200 hover:text-white hover:bg-zinc-800/80 transition-colors"
          >
            
            <span>Partidas</span>
          </Link>
          <Link
            href="/leaderboard"
            className="flex items-center gap-2 px-3 py-1.5 rounded-md text-sm font-medium text-zinc-400 hover:text-white hover:bg-zinc-800/80 transition-colors"
          >
            
            <span>Leaderboard</span>
          </Link>
        </nav>
      </div>
    </header>
  );
}
