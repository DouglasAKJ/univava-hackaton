import { LeaderboardPlayer } from "@/lib/queries";
import { Trophy, Flame, Target, PodiumIcon, Podium } from "lucide-react";
import Link from "next/link";

interface TopPlayersWidgetProps {
  players: LeaderboardPlayer[];
}

export function TopPlayersWidget({ players }: TopPlayersWidgetProps) {
  return (
    <div className="bg-zinc-900/60 border border-zinc-800 rounded-xl p-5 space-y-4">
      <div className="flex items-center justify-between pb-3 border-b border-zinc-800">
        <div className="flex items-center gap-2">

          <svg className="h-7 w7 text-yellow-300" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" ><g fill="none" stroke="currentColor" strokeWidth="2"><path strokeLinecap="round" d="M8.5 2v8.5m7-8.5v8.5"/><path d="M17.916 2.012H6.084c-.911 0-2.117-.158-2.74.684C3 3.161 3 3.833 3 5.178c0 1.147 0 1.72.232 2.204c.396.825 1.282 1.183 2.04 1.573l3.71 1.904C10.461 11.62 11.202 12 12 12s1.537-.38 3.019-1.14l3.708-1.905c.76-.39 1.645-.748 2.041-1.573C21 6.899 21 6.325 21 5.178c0-1.345 0-2.017-.344-2.482c-.623-.842-1.829-.684-2.74-.684Z"/><path strokeLinejoin="round" d="M10.53 13.638C11.247 13.213 11.606 13 12 13s.752.213 1.47.638l1 .591c.747.441 1.12.662 1.325 1.031s.205.819.205 1.719v1.042c0 .9 0 1.35-.205 1.719s-.578.59-1.324 1.03l-1 .592c-.719.426-1.078.638-1.471.638s-.752-.212-1.47-.638l-1-.591c-.747-.441-1.12-.662-1.325-1.031S8 18.921 8 18.021v-1.042c0-.9 0-1.35.205-1.719s.578-.59 1.324-1.03z"/></g></svg>
          
          <h3 className="font-bold text-white text-sm tracking-wide">Top MVPs (ACS)</h3>
        </div>
        <Link
          href="/leaderboard"
          className="text-xs text-rose-400 hover:text-rose-300 font-medium transition-colors"
        >
          
          Ver todos &rarr;
        </Link>
      </div>

      <div className="space-y-3">
        {players.map((p, index) => {
          const rankColors = [
            "text-amber-400 border-amber-400/30 bg-amber-400/10",
            "text-zinc-300 border-zinc-400/30 bg-zinc-400/10",
            "text-amber-600 border-amber-600/30 bg-amber-600/10",
          ];
          
          const rankIcon = [
            "/radiant.svg",
            "/im3.svg",
            "/asc3.svg",
            "/diam3.svg",
            "/plat3.svg"
          ]

          const badgeIcon = rankIcon[index]
          

          return (
            <div
              key={p.puuid}
              className="flex items-center justify-between p-2.5 rounded-lg bg-zinc-950/60 border border-zinc-800/60 hover:border-zinc-700 transition-colors"
            >
              <div className="flex items-center gap-3">
          {/*      
                <span
                  className={`w-6 h-6 rounded-md flex items-center justify-center text-xs font-mono font-bold border ${badgeClass}`}
                >
                  {index + 1}
                </span>
        */} 

              
                <span>
                  <img src={`${badgeIcon}`} alt="" className="h-8 w-8"/>
                </span>

                <div>
                  <div className="flex items-center gap-1.5">
                    <span className="font-semibold text-sm text-zinc-100">{p.game_name}</span>
                    <span className="text-[11px] text-zinc-500 font-mono">#{p.tag_line}</span>
                  </div>
                  <div className="flex items-center gap-2 text-xs text-zinc-400">
                    <span className="text-rose-400 font-medium">{p.most_played_agent}</span>
                    <span>•</span>
                    <span>{p.matches_played} partidas</span>
                  </div>
                </div>
              </div>

              <div className="text-right">
                <div className="flex items-center justify-end gap-1 font-mono font-bold text-sm text-amber-400">
                  <Flame className="w-3.5 h-3.5 text-amber-500" />
                  {p.avg_acs}
                </div>
                <div className="text-[11px] text-zinc-400 font-mono flex items-center justify-end gap-2">
                  <span>KD: <strong className="text-zinc-200">{p.avg_kd}</strong></span>
                  <span>HS: <strong className="text-zinc-200">{p.avg_hs_pct}%</strong></span>
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
