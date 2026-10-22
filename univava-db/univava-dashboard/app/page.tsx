import { getOverviewStats, getMatches, getLeaderboard } from "@/lib/queries";
import { MatchCard } from "@/components/MatchCard";
import { MatchFilters } from "@/components/MatchFilters";
import { TopPlayersWidget } from "@/components/TopPlayersWidget";
import { MapStatsWidget } from "@/components/MapStatsWidget";
import { Swords, Users, MapPin, Trophy, Shield } from "lucide-react";

interface HomePageProps {
  searchParams: Promise<{
    stage?: string;
    map?: string;
    search?: string;
  }>;
}

export default async function HomePage({ searchParams }: HomePageProps) {
  const filters = await searchParams;

  const overview = getOverviewStats();
  const { matches, total } = getMatches({
    stage: filters.stage,
    map: filters.map,
    search: filters.search,
    limit: 40,
  });
  const topPlayers = getLeaderboard(5, 2);

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8">
      {/* Hero / Overview Cards */}
      <div className="space-y-4">
        <div>
          <h1 className="text-2xl sm:text-3xl font-black text-white tracking-tight flex items-center gap-2">
            Visão Geral do Torneio
          </h1>
          <p className="text-sm text-zinc-400 mt-1">
            Análise e estatísticas de todas as partidas classificatórias e fase de grupos.
          </p>
        </div>

        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <div className="bg-zinc-900/60 border border-zinc-800 rounded-xl p-4 flex items-center gap-3">
            <div className="w-10 h-10 rounded-lg flex items-center justify-center shrink-0">
              <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor"><path d="M6 20.1957V3.80421C6 3.01878 6.86395 2.53993 7.53 2.95621L20.6432 11.152C21.2699 11.5436 21.2699 12.4563 20.6432 12.848L7.53 21.0437C6.86395 21.46 6 20.9812 6 20.1957Z"></path></svg>
            </div>
            <div>
              <div className="text-2xl font-bold font-mono text-white">{overview.totalMatches}</div>
              <div className="text-xs text-zinc-400">Partidas Registradas</div>
            </div>
          </div>

          <div className="bg-zinc-900/60 border border-zinc-800 rounded-xl p-4 flex items-center gap-3">
            <div className="w-8 h-8 flex items-center justify-center shrink-0">
              <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor"><path d="M11.9999 17C15.6623 17 18.8649 18.5751 20.607 20.9247L18.765 21.796C17.3473 20.1157 14.8473 19 11.9999 19C9.15248 19 6.65252 20.1157 5.23479 21.796L3.39355 20.9238C5.13576 18.5747 8.33796 17 11.9999 17ZM11.9999 2C14.7613 2 16.9999 4.23858 16.9999 7V10C16.9999 12.7614 14.7613 15 11.9999 15C9.23847 15 6.9999 12.7614 6.9999 10V7C6.9999 4.23858 9.23847 2 11.9999 2Z"></path></svg>
            </div>
            <div>
              <div className="text-2xl font-bold font-mono text-white">{overview.totalPlayers}</div>
              <div className="text-xs text-zinc-400">Jogadores Únicos</div>
            </div>
          </div>

          <div className="bg-zinc-900/60 border border-zinc-800 rounded-xl p-4 flex items-center gap-3">
            <div className="w-10 h-10  flex items-center justify-center shrink-0">
              
              <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor"><path d="M4 6.14286V18.9669L9.06476 16.7963L15.0648 19.7963L20 17.6812V4.85714L21.303 4.2987C21.5569 4.18992 21.8508 4.30749 21.9596 4.56131C21.9862 4.62355 22 4.69056 22 4.75827V19L15 22L9 19L2.69696 21.7013C2.44314 21.8101 2.14921 21.6925 2.04043 21.4387C2.01375 21.3765 2 21.3094 2 21.2417V7L4 6.14286ZM16.2426 11.2426L12 15.4853L7.75736 11.2426C5.41421 8.89949 5.41421 5.10051 7.75736 2.75736C10.1005 0.414214 13.8995 0.414214 16.2426 2.75736C18.5858 5.10051 18.5858 8.89949 16.2426 11.2426ZM12 12.6569L14.8284 9.82843C16.3905 8.26633 16.3905 5.73367 14.8284 4.17157C13.2663 2.60948 10.7337 2.60948 9.17157 4.17157C7.60948 5.73367 7.60948 8.26633 9.17157 9.82843L12 12.6569Z"></path></svg>
            </div>
            <div>
              <div className="text-2xl font-bold font-mono text-white">{overview.mostPlayedMap}</div>
              <div className="text-xs text-zinc-400">Mapa Mais Jogado</div>
            </div>
          </div>

          <div className="bg-zinc-900/60 border border-zinc-800 rounded-xl p-4 flex items-center gap-3">
            <div className="w-10 h-10  flex items-center justify-center shrink-0">
              <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor"><path d="M9 3V5H6V19H9V21H4V3H9ZM15 3H20V21H15V19H18V5H15V3Z"></path></svg>
            </div>
            <div>
              <div className="text-2xl font-bold font-mono text-white">{overview.stages.length}</div>
              <div className="text-xs text-zinc-400">Fases Disputadas</div>
            </div>
          </div>
        </div>
      </div>

      {/* Main Grid: Matches + Sidebars */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 items-start">
        {/* Left Column: Match List with Filters */}
        <div className="lg:col-span-2 space-y-6">
          <div className="flex items-center justify-between">
            <h2 className="text-lg font-bold text-white flex items-center gap-2">
              Partidas
            </h2>
            <span className="text-xs text-zinc-400 font-mono">
              Mostrando {matches.length} de {total} partidas
            </span>
          </div>

          {/* Filters Bar */}
          <MatchFilters stages={overview.stages} maps={overview.maps} />

          {/* Matches List */}
          {matches.length === 0 ? (
            <div className="bg-zinc-900/40 border border-zinc-800/80 rounded-xl p-12 text-center space-y-2">
              <p className="text-zinc-400 font-medium">Nenhuma partida encontrada para esses filtros.</p>
              <p className="text-xs text-zinc-500">Tente buscar por outro time, fase ou mapa.</p>
            </div>
          ) : (
            <div className="space-y-3">
              {matches.map((match) => (
                <MatchCard key={match.id} match={match} />
              ))}
            </div>
          )}
        </div>

        {/* Right Column: Widgets */}
        <div className="space-y-6">
          <TopPlayersWidget players={topPlayers} />
          <MapStatsWidget />
        </div>
      </div>
    </div>
  );
}
