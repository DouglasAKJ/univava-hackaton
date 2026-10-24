"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { Swords, Trophy, UploadCloud } from "lucide-react";

export function Navbar() {
  const pathname = usePathname();

  const isImport = pathname === "/import" || pathname?.startsWith("/import");
  const isLeaderboard =
    pathname === "/leaderboard" || pathname?.startsWith("/leaderboard");
  const isMatches =
    !isLeaderboard && !isImport && (pathname === "/" || pathname?.startsWith("/matches"));

  return (
    <header className="sticky top-0 z-50 w-full border-b border-zinc-800 bg-zinc-950/80 backdrop-blur-md">
      <div className="max-w-7xl mx-auto px-3 sm:px-6 lg:px-8 h-16 flex items-center justify-between gap-2">
        <Link href="/" className="flex items-center gap-2.5 sm:gap-3 group shrink-0">
          <div className="w-9 h-9 sm:w-10 sm:h-10 rounded-lg bg-gradient-to-tr from-rose-600 to-red-500 flex items-center justify-center shadow-lg shadow-rose-900/40 group-hover:scale-105 transition-transform overflow-hidden shrink-0">
            <img src="/icon raze.png" alt="Icone" className="w-7 h-7 sm:w-8 sm:h-8 object-contain" />
          </div>
          <div>
            <div className="flex items-center gap-1.5 sm:gap-2">
              <span className="font-black tracking-wider text-base sm:text-lg text-white font-mono">
                UNIVAVA
              </span>
              <span className="text-[9px] sm:text-[10px] uppercase font-bold tracking-widest px-1 sm:px-1.5 py-0.5 rounded bg-rose-500/20 text-rose-400 border border-rose-500/30">
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
            className={`flex items-center gap-1.5 sm:gap-2 px-2.5 sm:px-3 py-1.5 rounded-lg text-xs sm:text-sm font-medium transition-all ${
              isMatches
                ? "text-white bg-zinc-800/90 border border-zinc-700/80 shadow-sm"
                : "text-zinc-400 hover:text-white hover:bg-zinc-800/50"
            }`}
          >
      
            <span>Partidas</span>
          </Link>
          <Link
            href="/leaderboard"
            className={`flex items-center gap-1.5 sm:gap-2 px-2.5 sm:px-3 py-1.5 rounded-lg text-xs sm:text-sm font-medium transition-all ${
              isLeaderboard
                ? "text-white bg-zinc-800/90 border border-zinc-700/80 shadow-sm"
                : "text-zinc-400 hover:text-white hover:bg-zinc-800/50"
            }`}
          >

            <span>Leaderboard</span>
          </Link>
          <Link
            href="/import"
            className={`flex items-center gap-1.5 sm:gap-2 px-2.5 sm:px-3 py-1.5 rounded-lg text-xs sm:text-sm font-medium transition-all ${
              isImport
                ? "text-white bg-zinc-800/90 border border-zinc-700/80 shadow-sm"
                : "text-zinc-400 hover:text-white hover:bg-zinc-800/50"
            }`}
          >
            <UploadCloud className={`w-3.5 h-3.5 sm:w-4 sm:h-4 ${isImport ? "text-rose-400" : "text-zinc-400"}`} />
            <span>Importar</span>
          </Link>
        </nav>
      </div>
    </header>
  );
}
