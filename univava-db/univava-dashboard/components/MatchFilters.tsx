"use client";

import { useRouter, useSearchParams } from "next/navigation";
import { useState, useTransition, useEffect } from "react";
import { Search, Filter, X } from "lucide-react";

interface MatchFiltersProps {
  stages: { stage_name: string; stage_code: string; count: number }[];
  maps: string[];
}

export function MatchFilters({ stages, maps }: MatchFiltersProps) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [isPending, startTransition] = useTransition();

  const currentSearch = searchParams.get("search") || "";
  const currentStage = searchParams.get("stage") || "all";
  const currentMap = searchParams.get("map") || "all";

  const [searchTerm, setSearchTerm] = useState(currentSearch);

  useEffect(() => {
    setSearchTerm(currentSearch);
  }, [currentSearch]);

  const updateFilters = (newParams: Record<string, string | null>) => {
    const params = new URLSearchParams(searchParams.toString());

    for (const [key, value] of Object.entries(newParams)) {
      if (!value || value === "all") {
        params.delete(key);
      } else {
        params.set(key, value);
      }
    }

    startTransition(() => {
      router.push(`/?${params.toString()}`);
    });
  };

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    updateFilters({ search: searchTerm });
  };

  const handleClear = () => {
    setSearchTerm("");
    startTransition(() => {
      router.push("/");
    });
  };

  const hasActiveFilters = currentSearch || currentStage !== "all" || currentMap !== "all";

  return (
    <div className="bg-zinc-900/70 border border-zinc-800 rounded-xl p-4 space-y-4">
      <div className="flex flex-col md:flex-row gap-3 items-stretch md:items-center justify-between">
        {/* Search */}
        <form onSubmit={handleSearchSubmit} className="relative flex-1">
          <Search className="w-4 h-4 text-zinc-500 absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none" />
          <input
            type="text"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            placeholder="Buscar por time (ex: UFG, Tritons, CEUB)..."
            className="w-full bg-zinc-950/80 border border-zinc-800 rounded-lg pl-10 pr-4 py-2 text-sm text-zinc-200 placeholder-zinc-500 focus:outline-none focus:border-rose-500/80 focus:ring-1 focus:ring-rose-500/50 transition-colors"
          />
        </form>

        {/* Filters and Clear */}
        <div className="flex items-center gap-2 flex-wrap">
          {/* Stage Dropdown */}
          <div className="relative">
            <select
              value={currentStage}
              onChange={(e) => updateFilters({ stage: e.target.value })}
              className="bg-zinc-950/80 border border-zinc-800 rounded-lg px-3 py-2 text-sm text-zinc-200 focus:outline-none focus:border-rose-500/80 cursor-pointer appearance-none pr-8"
            >
              <option value="all">Todas as Fases</option>
              {stages.map((st) => (
                <option key={st.stage_code} value={st.stage_code}>
                  {st.stage_name} ({st.count})
                </option>
              ))}
            </select>
            <Filter className="w-3.5 h-3.5 text-zinc-500 absolute right-2.5 top-1/2 -translate-y-1/2 pointer-events-none" />
          </div>

          {/* Map Dropdown */}
          <div className="relative">
            <select
              value={currentMap}
              onChange={(e) => updateFilters({ map: e.target.value })}
              className="bg-zinc-950/80 border border-zinc-800 rounded-lg px-3 py-2 text-sm text-zinc-200 focus:outline-none focus:border-rose-500/80 cursor-pointer appearance-none pr-8"
            >
              <option value="all">Todos os Mapas</option>
              {maps.map((map) => (
                <option key={map} value={map}>
                  {map}
                </option>
              ))}
            </select>
            <Filter className="w-3.5 h-3.5 text-zinc-500 absolute right-2.5 top-1/2 -translate-y-1/2 pointer-events-none" />
          </div>

          {hasActiveFilters && (
            <button
              onClick={handleClear}
              className="flex items-center gap-1.5 px-3 py-2 text-xs font-medium text-zinc-400 hover:text-white bg-zinc-800/60 hover:bg-zinc-800 rounded-lg transition-colors border border-zinc-700/50"
            >
              <X className="w-3.5 h-3.5" />
              Limpar
            </button>
          )}
        </div>
      </div>

      {isPending && (
        <div className="text-xs text-rose-400 animate-pulse flex items-center gap-1.5">
          <div className="w-2 h-2 rounded-full bg-rose-500 animate-ping" />
          Filtrando partidas...
        </div>
      )}
    </div>
  );
}
