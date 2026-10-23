
import { getMatchById, getMatchRoundsSummary } from "@/lib/queries";
import { notFound } from "next/navigation";
import Link from "next/link";
import {
  ArrowLeft,
  MapPin,
  Clock,
  Calendar,
  Trophy,
  Crosshair,
  ShieldAlert,
  Flame,
  Bomb,
} from "lucide-react";
import { RoundHistorySection } from "@/components/RoundHistorySection";

interface MatchPageProps {
  params: Promise<{ slug: string }>;
}

export default async function MatchPage({ params }: MatchPageProps) {
  const { slug } = await params;
  const { match, players, rounds } = getMatchById(slug);

  if (!match) {
    notFound();
  }

  const roundsSummary = getMatchRoundsSummary(slug);

  // Format date
  const [year, month, day] = match.game_date.split("-");
  const formattedDate = day && month ? `${day}/${month}/${year}` : match.game_date;
  const durationMinutes = Math.round(match.duration_millis / 60000);

  const teamAPlayers = players.filter(
    (p) => p.team_name.toLowerCase() === match.team_a.toLowerCase()
  );
  const teamBPlayers = players.filter(
    (p) => p.team_name.toLowerCase() === match.team_b.toLowerCase()
  );

  const isTeamAWinner = match.score_a > match.score_b;
  const isTeamBWinner = match.score_b > match.score_a;

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8">
      {/* Back button */}
      <Link
        href="/"
        className="inline-flex items-center gap-2 text-sm text-zinc-400 hover:text-white transition-colors"
      >
        <ArrowLeft className="w-4 h-4" />
        Voltar para a lista de partidas
      </Link>

      {/* Match Hero Header */}
      <div className="bg-zinc-900/80 border border-zinc-800 rounded-2xl p-6 sm:p-8 relative overflow-hidden">
        {/* Stage & Meta bar */}
        <div className="flex flex-wrap items-center justify-between gap-3 text-xs text-zinc-400 pb-4 mb-6 border-b border-zinc-800">
          <div className="flex items-center gap-2">
            <span className="font-semibold text-rose-400 bg-white-500/10 px-2.5 py-1 rounded-md border border-rose-500/20">
              {match.stage_name}
            </span>
            <span className="font-mono text-zinc-500">Partida #{match.match_code}</span>
          </div>

          <div className="flex items-center gap-4">
            <span className="flex items-center gap-1.5 text-zinc-300">
              {match.map_name}
            </span>
            <span className="flex items-center gap-1.5">
              <Calendar className="w-4 h-4 text-zinc-500" />
              {formattedDate}
            </span>
            {durationMinutes > 0 && (
              <span className="flex items-center gap-1.5">
                <Clock className="w-4 h-4 text-zinc-500" />
                {durationMinutes} min
              </span>
            )}
          </div>
        </div>

        {/* Big Score Board */}
        <div className="grid grid-cols-[1fr_auto_1fr] items-center gap-4 sm:gap-8">
          {/* Team A */}
          <div className={`space-y-1 ${isTeamAWinner ? "text-white" : "text-zinc-400"}`}>
            <div className="flex items-center gap-2">
              {isTeamAWinner}
              <h2 className="text-xl sm:text-3xl font-black tracking-tight truncate">
                {match.team_a}
              </h2>
            </div>
            <p className="text-xs uppercase tracking-wider font-semibold font-mono text-zinc-500">
              <span className={`${isTeamAWinner ? "text-emerald-400" : "text-red-400"}`}> {isTeamAWinner ? "Vitória" : "Derrota"}</span>
            </p>
          </div>

          {/* Scores */}
          <div className="flex items-center gap-3 sm:gap-6 bg-zinc-950/90 border border-zinc-800/80 px-6 py-3 rounded-2xl font-mono">
            <span
              className={`text-3xl sm:text-5xl font-black ${
                isTeamAWinner ? "text-emerald-400" : "text-red-400"
              }`}
            >
              {match.score_a}
            </span>
            <span className="text-zinc-700 text-2xl sm:text-4xl font-light">:</span>
            <span
              className={`text-3xl sm:text-5xl font-black ${
                isTeamBWinner ? "text-emerald-400" : "text-red-400"
              }`}
            >
              {match.score_b}
            </span>
          </div>

          {/* Team B */}
          <div
            className={`space-y-1 text-right flex flex-col items-end ${
              isTeamBWinner ? "text-white" : "text-zinc-400"
            }`}
          >
            <div className="flex items-center justify-end gap-2">
              <h2 className="text-xl sm:text-3xl font-black tracking-tight truncate">
                {match.team_b}
              </h2>
              {isTeamBWinner}
            </div>
            <p className="text-xs uppercase tracking-wider font-semibold font-mono text-zinc-500">
              <span className={`${isTeamBWinner ? "text-emerald-400" : "text-red-400"}`}> {isTeamBWinner ? "Vitória" : "Derrota"}</span>
            </p>
          </div>
        </div>
      </div>

      {/* Rounds Timeline & Summary */}
      {roundsSummary.length > 0 && (
        <RoundHistorySection match={match} rounds={roundsSummary} />
      )}

      {/* Scoreboard: Team A */}
      <TeamScoreboardTable
        teamName={match.team_a}
        score={match.score_a}
        isWinner={isTeamAWinner}
        players={teamAPlayers.length > 0 ? teamAPlayers : players.slice(0, 5)}
      />

      {/* Scoreboard: Team B */}
      <TeamScoreboardTable
        teamName={match.team_b}
        score={match.score_b}
        isWinner={isTeamBWinner}
        players={teamBPlayers.length > 0 ? teamBPlayers : players.slice(5)}
      />
    </div>
  );
}

function TeamScoreboardTable({
  teamName,
  score,
  isWinner,
  players,
}: {
  teamName: string;
  score: number;
  isWinner: boolean;
  players: any[];
}) {
  return (
    <div className="bg-zinc-900/60 border border-zinc-800 rounded-xl overflow-hidden">
      <div className="px-5 py-4 bg-zinc-900/90 border-b border-zinc-800 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <span
            className={`w-3 h-3 rounded-full ${
              isWinner ? "bg-emerald-400" : "bg-zinc-600"
            }`}
          />
          <h3 className="font-bold text-white text-base">{teamName}</h3>
          {isWinner && (
            <span className="text-[10px] uppercase font-bold tracking-wider px-2 py-0.5 rounded bg-emerald-500/20 text-emerald-400 border border-emerald-500/30">
              Vencedor
            </span>
          )}
        </div>
        <span className="font-mono font-bold text-lg text-zinc-200">{score} Rounds</span>
      </div>

      <div className="overflow-x-auto">
        <table className="w-full text-left text-sm">
          <thead className="bg-zinc-950/60 text-zinc-400 text-xs uppercase tracking-wider font-mono border-b border-zinc-800">
            <tr>
              <th className="py-3 px-4">Jogador</th>
              <th className="py-3 px-3">Agente</th>
              <th className="py-3 px-3 text-right">ACS</th>
              <th className="py-3 px-3 text-center">K / D / A</th>
              <th className="py-3 px-3 text-right">+/-</th>
              <th className="py-3 px-3 text-right">K/D</th>
              <th className="py-3 px-3 text-right">ADR</th>
              <th className="py-3 px-3 text-right">HS%</th>
              <th className="py-3 px-3 text-right">FB / FD</th>
              <th className="py-3 px-3 text-right">Pl / Def</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-zinc-800/60 font-mono text-zinc-300">
            {players.map((p) => {
              const diff = p.kills - p.deaths;
              return (
                <tr key={p.id} className="hover:bg-zinc-800/40 transition-colors">
                  <td className="py-3 px-4 font-sans font-medium text-white flex items-center gap-1.5">
                    <span>{p.game_name}</span>
                    <span className="text-zinc-500 text-xs font-mono">#{p.tag_line}</span>
                  </td>
                  <td className="py-3 px-3 font-sans">
                    <span className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded bg-zinc-800 text-xs font-medium text-zinc-200 border border-zinc-700">
                      {p.character_id && (
                        <img
                          src={`/agents/${p.character_id.toLowerCase()}.png`}
                          alt={p.agent_name}
                          title={p.agent_name}
                          className="w-5 h-5 object-contain"
                        />
                      )}
                      <span>{p.agent_name}</span>
                    </span>
                  </td>
                  <td className="py-3 px-3 text-right font-bold text-amber-400">{p.acs}</td>
                  <td className="py-3 px-3 text-center text-zinc-200">
                    {p.kills} / <span className="text-rose-400">{p.deaths}</span> / {p.assists}
                  </td>
                  <td
                    className={`py-3 px-3 text-right font-bold ${
                      diff > 0
                        ? "text-emerald-400"
                        : diff < 0
                        ? "text-rose-400"
                        : "text-zinc-400"
                    }`}
                  >
                    {diff > 0 ? `+${diff}` : diff}
                  </td>
                  <td className="py-3 px-3 text-right font-semibold">{p.kd_ratio}</td>
                  <td className="py-3 px-3 text-right">{p.adr}</td>
                  <td className="py-3 px-3 text-right">{p.hs_pct}%</td>
                  <td className="py-3 px-3 text-right">
                    <span className="text-emerald-400 font-semibold">{p.first_bloods}</span>
                    <span className="text-zinc-600"> / </span>
                    <span className="text-rose-400 font-semibold">{p.first_deaths}</span>
                  </td>
                  <td className="py-3 px-3 text-right text-zinc-400">
                    <span className="text-amber-300">{p.plants}</span>
                    <span className="text-zinc-600"> / </span>
                    <span className="text-emerald-400">{p.defuses}</span>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
}