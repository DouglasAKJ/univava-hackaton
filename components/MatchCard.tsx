import Link from "next/link";
import { MatchSummary } from "@/lib/queries";
import { MapPin, Clock, Trophy, ChevronRight } from "lucide-react";

interface MatchCardProps {
  match: MatchSummary;
}

export function MatchCard({ match }: MatchCardProps) {
  const isTeamAWinner = match.score_a > match.score_b;
  const isTeamBWinner = match.score_b > match.score_a;

  const durationMinutes = Math.round(match.duration_millis / 60000);

  // Formatted date (YYYY-MM-DD -> DD/MM/YYYY)
  const [year, month, day] = match.game_date.split("-");
  const formattedDate = day && month ? `${day}/${month}/${year}` : match.game_date;

  return (
    <Link
      href={`/matches/${match.slug}`}
      className="group block bg-zinc-900/60 hover:bg-zinc-900 border border-zinc-800/80 hover:border-zinc-700/80 rounded-xl p-4 transition-all duration-200 hover:shadow-lg hover:shadow-black/50 relative overflow-hidden"
    >
      {/* Top bar: Stage and Date */}
      <div className="flex items-center justify-between text-xs text-zinc-400 mb-3 pb-2 border-b border-zinc-800/50">
        <div className="flex items-center gap-2">
          <span className="font-semibold text-rose-400 bg-white-500/10 px-2 py-0.5 rounded border border-rose-500/20">
            {match.stage_name}
          </span>
          <span className="text-zinc-500 font-mono">#{match.match_code}</span>
        </div>
        <span className="text-zinc-500">{formattedDate}</span>
      </div>

      {/* Teams and Scores */}
      <div className="grid grid-cols-[1fr_auto_1fr] items-center gap-2 sm:gap-3 my-2">
        {/* Team A */}
        <div className={`flex flex-col min-w-0 ${isTeamAWinner ? "font-bold text-white" : "text-zinc-400"}`}>
          <div className="flex items-center gap-1.5 truncate">
            <span className="truncate text-xs sm:text-base">{match.team_a}</span>
          </div>
          <span className="text-[10px] sm:text-[11px] text-zinc-500 font-mono">
            {isTeamAWinner ? "Vencedor" : "Derrotado"}
          </span>
        </div>

        {/* Score Pill */}
        <div className="flex items-center gap-1.5 sm:gap-2 px-2.5 sm:px-3 py-1 bg-zinc-950/80 rounded-lg border border-zinc-800 font-mono text-sm sm:text-lg shrink-0">
          <span className={isTeamAWinner ? "text-emerald-400 font-bold" : "text-zinc-400"}>
            {match.score_a}
          </span>
          <span className="text-zinc-600">:</span>
          <span className={isTeamBWinner ? "text-emerald-400 font-bold" : "text-zinc-400"}>
            {match.score_b}
          </span>
        </div>

        {/* Team B */}
        <div
          className={`flex flex-col items-end text-right min-w-0 ${
            isTeamBWinner ? "font-bold text-white" : "text-zinc-400"
          }`}
        >
          <div className="flex items-center justify-end gap-1.5 truncate w-full">
            <span className="truncate text-xs sm:text-base">{match.team_b}</span>
          </div>
          <span className="text-[10px] sm:text-[11px] text-zinc-500 font-mono">
            {isTeamBWinner ? "Vencedor" : "Derrotado"}
          </span>
        </div>
      </div>

      {/* Footer details: Map & Duration */}
      <div className="flex flex-wrap items-center justify-between text-[11px] sm:text-xs text-zinc-400 pt-2.5 mt-2 border-t border-zinc-800/50 gap-2">
        <div className="flex items-center gap-2 sm:gap-3 flex-wrap">
          <span className="flex items-center gap-1 text-zinc-300 font-medium">
            {match.map_name}
          </span>
          <span className="text-zinc-500">•</span>
          <span className="text-zinc-400">{match.rounds_played} rounds</span>
          {durationMinutes > 0 && (
            <>
              <span className="text-zinc-500">•</span>
              <span className="flex items-center gap-1 text-zinc-400">
                <Clock className="w-3 h-3 text-zinc-500" />
                {durationMinutes} min
              </span>
            </>
          )}
        </div>

        <div className="flex items-center gap-1 text-rose-400 group-hover:translate-x-1 transition-transform font-medium shrink-0 ml-auto sm:ml-0">
          <span className="text-[11px]">Ver match</span>
          <ChevronRight className="w-3.5 h-3.5" />
        </div>
      </div>
    </Link>
  );
}
