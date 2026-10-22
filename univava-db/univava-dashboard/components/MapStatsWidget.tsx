import { db } from "@/lib/db";
import { MapPin } from "lucide-react";

export function MapStatsWidget() {
  const mapStats = db
    .prepare(
      `
    SELECT map_name, COUNT(*) as match_count,
           ROUND(AVG(rounds_played), 1) as avg_rounds
    FROM matches
    GROUP BY map_name
    ORDER BY match_count DESC
  `
    )
    .all() as { map_name: string; match_count: number; avg_rounds: number }[];

  const maxMatches = mapStats.length > 0 ? mapStats[0].match_count : 1;

  return (
    <div className="bg-zinc-900/60 border border-zinc-800 rounded-xl p-5 space-y-4">
      <div className="flex items-center gap-2 pb-3 border-b border-zinc-800">
        <img src="/kayo e.png" alt="" className="h-7 w-7" />
        <h3 className="font-bold text-white text-sm tracking-wide">Frequência de Mapas</h3>
      </div>

      <div className="space-y-3">
        {mapStats.map((item) => {
          const percentage = Math.round((item.match_count / maxMatches) * 100);

          return (
            <div key={item.map_name} className="space-y-1">
              <div className="flex items-center justify-between text-xs">
                <span className="font-medium text-zinc-200">{item.map_name}</span>
                <span className="text-zinc-400 font-mono">
                  {item.match_count} jogos{" "}
                  <span className="text-zinc-500">({item.avg_rounds} rds avg)</span>
                </span>
              </div>
              <div className="w-full h-2 bg-zinc-950 rounded-full overflow-hidden border border-zinc-800">
                <div
                  className="h-full bg-gradient-to-r from-rose-600 to-red-500 rounded-full transition-all duration-500"
                  style={{ width: `${percentage}%` }}
                />
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
