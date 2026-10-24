"use client";

import { useState, useEffect, useRef } from "react";
import { MatchSummary } from "@/lib/queries";
import { MatchCard } from "@/components/MatchCard";
import { ChevronLeft, ChevronRight } from "lucide-react";

interface MatchListProps {
  matches: MatchSummary[];
  total: number;
}

export function MatchList({ matches, total }: MatchListProps) {
  const [currentPage, setCurrentPage] = useState(1);
  const [isMobile, setIsMobile] = useState(false);
  const [mounted, setMounted] = useState(false);
  const listRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    setMounted(true);
    const mql = window.matchMedia("(max-width: 767px)");
    setIsMobile(mql.matches);

    const handler = (e: MediaQueryListEvent) => {
      setIsMobile(e.matches);
    };

    mql.addEventListener("change", handler);
    return () => mql.removeEventListener("change", handler);
  }, []);

  // Reset page whenever matches change (e.g. after search or filters)
  useEffect(() => {
    setCurrentPage(1);
  }, [matches]);

  const totalPages = Math.ceil(matches.length / 5);

  const handlePageChange = (newPage: number) => {
    setCurrentPage(newPage);
    if (listRef.current) {
      listRef.current.scrollIntoView({ behavior: "smooth", block: "start" });
    }
  };

  if (matches.length === 0) {
    return (
      <div className="bg-zinc-900/40 border border-zinc-800/80 rounded-xl p-12 text-center space-y-2">
        <p className="text-zinc-400 font-medium">
          Nenhuma partida encontrada para esses filtros.
        </p>
        <p className="text-xs text-zinc-500">
          Tente buscar por outro time, fase ou mapa.
        </p>
      </div>
    );
  }

  // Mobile slice (5 items per page)
  const startIndex = (currentPage - 1) * 5;
  const endIndex = Math.min(startIndex + 5, matches.length);
  const mobileMatches = matches.slice(startIndex, endIndex);

  return (
    <div ref={listRef} className="space-y-4">
      {/* Header Info */}
      <div className="flex items-center justify-between">
        <h2 className="text-lg font-bold text-white flex items-center gap-2">
          Partidas
        </h2>
        {/* Desktop indicator */}
        <span className="text-xs text-zinc-400 font-mono hidden md:inline">
          Mostrando {matches.length} de {total} partidas
        </span>
        {/* Mobile indicator */}
        <span className="text-xs text-zinc-400 font-mono md:hidden">
          Mostrando {startIndex + 1}–{endIndex} de {matches.length} partidas
        </span>
      </div>

      {/* Matches List */}
      <div className="space-y-3">
        {mounted && isMobile ? (
          // Mobile view: strictly the 5 matches for current page
          mobileMatches.map((match) => (
            <MatchCard key={match.id} match={match} />
          ))
        ) : (
          // Desktop view or SSR:
          // Items 0..4 always visible; items 5..39 hidden on mobile via CSS (hidden md:block)
          matches.map((match, idx) => (
            <div
              key={match.id}
              className={idx >= 5 ? "hidden md:block" : "block"}
            >
              <MatchCard match={match} />
            </div>
          ))
        )}
      </div>

      {/* Pagination Controls on Mobile */}
      {totalPages > 1 && (
        <div className="flex md:hidden items-center justify-between gap-2 pt-3 border-t border-zinc-800/60">
          <button
            type="button"
            onClick={() => handlePageChange(Math.max(currentPage - 1, 1))}
            disabled={currentPage === 1}
            className="flex items-center gap-1 px-3 py-2 rounded-lg text-xs font-medium bg-zinc-900 border border-zinc-800 text-zinc-300 disabled:opacity-30 disabled:pointer-events-none hover:bg-zinc-800 transition-colors"
          >
            <ChevronLeft className="w-3.5 h-3.5" />
            <span>Anterior</span>
          </button>

          <div className="flex items-center gap-1.5 font-mono text-xs text-zinc-400">
            <span>Página</span>
            <span className="px-2 py-0.5 rounded bg-zinc-800 text-white font-bold border border-zinc-700">
              {currentPage}
            </span>
            <span>de {totalPages}</span>
          </div>

          <button
            type="button"
            onClick={() => handlePageChange(Math.min(currentPage + 1, totalPages))}
            disabled={currentPage === totalPages}
            className="flex items-center gap-1 px-3 py-2 rounded-lg text-xs font-medium bg-zinc-900 border border-zinc-800 text-zinc-300 disabled:opacity-30 disabled:pointer-events-none hover:bg-zinc-800 transition-colors"
          >
            <span>Próxima</span>
            <ChevronRight className="w-3.5 h-3.5" />
          </button>
        </div>
      )}
    </div>
  );
}
