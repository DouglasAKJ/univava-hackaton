import { getLeaderboard } from "@/lib/queries";
import Link from "next/link";
import { ArrowLeft, Trophy, Flame, Target, Crosshair } from "lucide-react";

export default function LeaderboardPage() {
  const players = getLeaderboard(50, 2);

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-6">
      {/* Back button */}
      <Link
        href="/"
        className="inline-flex items-center gap-2 text-sm text-zinc-400 hover:text-white transition-colors"
      >
        <ArrowLeft className="w-4 h-4" />
        Voltar para as partidas
      </Link>

      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl sm:text-3xl font-black text-white tracking-tight flex items-center gap-2">
            <Trophy className="w-7 h-7 text-amber-400" />
            Classificação Geral de Jogadores
          </h1>
          <p className="text-sm text-zinc-400 mt-1">
            Ranking individual dos jogadores com no mínimo 2 partidas disputadas no torneio.
          </p>
        </div>
        <span className="text-xs text-zinc-400 font-mono bg-zinc-900 px-3 py-1.5 rounded-lg border border-zinc-800">
          Top {players.length} Jogadores
        </span>
      </div>

      {/* Leaderboard Table */}
      <div className="bg-zinc-900/60 border border-zinc-800 rounded-xl overflow-hidden shadow-xl">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm">
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
                      <span className="px-2 py-0.5 rounded bg-zinc-800 text-xs font-medium text-rose-400 border border-zinc-700">
                        {p.most_played_agent}
                      </span>
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
