import { getLeaderboard } from "@/lib/queries";
import Link from "next/link";
import { ArrowLeft, Trophy, Flame, Target, Crosshair } from "lucide-react";

export default function LeaderboardPage() {
  const players = getLeaderboard(50, 2);

  return (
    <div className="max-w-7xl mx-auto px-3 sm:px-6 lg:px-8 py-6 sm:py-8 space-y-6">
      {/* Back button */}
      <Link
        href="/"
        className="inline-flex items-center gap-2 text-xs sm:text-sm text-zinc-400 hover:text-white transition-colors"
      >
        <ArrowLeft className="w-4 h-4" />
        Voltar para as partidas
      </Link>

      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 sm:gap-4">
        <div>
          <h1 className="text-xl sm:text-3xl font-black text-white tracking-tight flex items-center gap-2">
            <Trophy className="w-6 h-6 sm:w-7 sm:h-7 text-amber-400 shrink-0" />
            Classificação Geral de Jogadores
          </h1>
          <p className="text-xs sm:text-sm text-zinc-400 mt-1">
            Ranking individual dos jogadores com no mínimo 2 partidas disputadas no torneio.
          </p>
        </div>
        <div className="flex items-center justify-between sm:justify-end gap-2">
          <span className="text-[10px] text-zinc-500 sm:hidden">← arraste para ver mais colunas →</span>
          <span className="text-xs text-zinc-400 font-mono bg-zinc-900 px-3 py-1.5 rounded-lg border border-zinc-800 shrink-0">
            Top {players.length} Jogadores
          </span>
        </div>
      </div>

      {/* Leaderboard Table */}
      <div className="bg-zinc-900/60 border border-zinc-800 rounded-xl overflow-hidden shadow-xl">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm min-w-[750px]">
            <thead className="bg-zinc-950/80 text-zinc-400 text-xs uppercase tracking-wider font-mono border-b border-zinc-800">
              <tr>
                <th className="py-3.5 px-4 text-center w-12">#</th>
                <th className="py-3.5 px-4">Jogador</th>
                <th className="py-3.5 px-3">Agente Favorito</th>
                <th className="py-3.5 px-3 text-center">Partidas</th>
                <th className="py-3.5 px-3 text-center">K / D / A Total</th>
                <th className="py-3.5 px-3 text-right">ACS Médio</th>
                <th className="py-3.5 px-3 text-right">K/D Médio</th>
                <th className="py-3.5 px-3 text-right">ADR Médio</th>
                <th className="py-3.5 px-4 text-right">HS% Médio</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-zinc-800/60 font-mono text-zinc-300">
              {players.map((p, index) => {
                const rankColors = [
                  "text-amber-400 font-bold",
                  "text-zinc-300 font-bold",
                  "text-amber-600 font-bold",
                ];
                const rankClass = index < 3 ? rankColors[index] : "text-zinc-500";

                return (
                  <tr
                    key={p.puuid}
                    className={`hover:bg-zinc-800/40 transition-colors ${
                      index < 3 ? "bg-amber-400/[0.02]" : ""
                    }`}
                  >
                    <td className={`py-3.5 px-4 text-center ${rankClass}`}>
                      {index + 1}
                    </td>
                    <td className="py-3.5 px-4 font-sans font-medium text-white flex items-center gap-1.5">
                      <span>{p.game_name}</span>
                      <span className="text-zinc-500 text-xs font-mono">#{p.tag_line}</span>
                    </td>
                    <td className="py-3.5 px-3 font-sans">
                      {p.most_played_agent_id ? (
                        <div className="flex items-center gap-2">
                          <img
                            src={`/agents/${p.most_played_agent_id.toLowerCase()}.png`}
                            alt={p.most_played_agent}
                            title={p.most_played_agent}
                            className="w-7 h-7 rounded-lg object-contain bg-zinc-800/80 p-0.5 border border-zinc-700 hover:border-zinc-500 transition-colors"
                          />
                          <span className="text-xs text-zinc-300 font-medium">
                            {p.most_played_agent}
                          </span>
                        </div>
                      ) : (
                        <span className="text-zinc-500 text-xs">-</span>
                      )}
                    </td>
                    <td className="py-3.5 px-3 text-center text-zinc-300">
                      {p.matches_played}
                    </td>
                    <td className="py-3.5 px-3 text-center text-zinc-300">
                      {p.total_kills} / <span className="text-rose-400">{p.total_deaths}</span> /{" "}
                      {p.total_assists}
                    </td>
                    <td className="py-3.5 px-3 text-right font-bold text-amber-400">
                      {p.avg_acs}
                    </td>
                    <td
                      className={`py-3.5 px-3 text-right font-semibold ${
                        p.avg_kd >= 1.2
                          ? "text-emerald-400"
                          : p.avg_kd >= 1.0
                          ? "text-zinc-200"
                          : "text-rose-400"
                      }`}
                    >
                      {p.avg_kd}
                    </td>
                    <td className="py-3.5 px-3 text-right">{p.avg_adr}</td>
                    <td className="py-3.5 px-4 text-right">{p.avg_hs_pct}%</td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
