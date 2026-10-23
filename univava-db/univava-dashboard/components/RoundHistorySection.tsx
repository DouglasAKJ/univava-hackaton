"use client";

import { useState } from "react";
import { RoundSummary, MatchSummary } from "@/lib/queries";
import { getRoundResult } from "@/lib/roundResult";
import {
  Trophy,
  Crosshair,
  Skull,
  Bomb,
  ShieldCheck,
  Zap,
  Clock,
  Swords,
  ChevronDown,
  Sparkles,
  UserCheck,
} from "lucide-react";

interface RoundHistorySectionProps {
  match: MatchSummary;
  rounds: RoundSummary[];
}

function formatRoundTime(millis: number): string {
  const totalSeconds = Math.floor(millis / 1000);
  const minutes = Math.floor(totalSeconds / 60);
  const seconds = totalSeconds % 60;
  return `${minutes}:${seconds.toString().padStart(2, "0")}`;
}

function getResultLabel(result: string | null): string {
  switch (result) {
    case "Bomb defused":
      return "Spike Defusada";
    case "Bomb detonated":
      return "Spike Detonada";
    case "Eliminated":
      return "Eliminação da Equipe";
    case "Round timer expired":
      return "Tempo Esgotado";
    default:
      return result || "Finalizado";
  }
}

export function RoundHistorySection({ match, rounds }: RoundHistorySectionProps) {
  const [selectedRoundNum, setSelectedRoundNum] = useState<number | null>(null);

  const isTeamAWinner = match.score_a > match.score_b;
  const isTeamBWinner = match.score_b > match.score_a;

  const selectedRound =
    selectedRoundNum !== null
      ? rounds.find((r) => r.round_num === selectedRoundNum) || null
      : null;

  return (
    <div className="bg-zinc-900/60 border border-zinc-800 rounded-xl p-3.5 sm:p-5 space-y-3.5 sm:space-y-4">
      {/* Header */}
      <div className="flex flex-wrap items-center justify-between gap-2.5 sm:gap-3 pb-3 border-b border-zinc-800">
        <div className="flex items-center gap-2">
          <h3 className="text-xs sm:text-sm font-bold text-white flex items-center gap-2">
            Histórico de Rounds ({rounds.length})
          </h3>
          <span className="text-xs text-zinc-500 hidden sm:inline">
            • Clique em um round para ver o resumo completo
          </span>
        </div>
        <div className="flex items-center gap-3 sm:gap-4 text-xs text-zinc-400 font-medium">
          <span className="flex items-center gap-1.5">
            <span
              className={`w-2.5 h-2.5 rounded-full ${
                isTeamAWinner ? "bg-emerald-500" : "bg-red-500"
              }`}
            />
            {match.team_a}
          </span>
          <span className="flex items-center gap-1.5">
            <span
              className={`w-2.5 h-2.5 rounded-full ${
                isTeamBWinner ? "bg-emerald-500" : "bg-red-500"
              }`}
            />
            {match.team_b}
          </span>
        </div>
      </div>

      {/* Rounds Selector Timeline */}
      <div className="flex flex-wrap gap-1.5 sm:gap-2 pt-1">
        {rounds.map((r) => {
          const wonByA =
            r.winning_team_name.toLowerCase() === match.team_a.toLowerCase();
          const wonByB =
            r.winning_team_name.toLowerCase() === match.team_b.toLowerCase();
          const wonByWinner = match.winner_team
            ? r.winning_team_name.toLowerCase() === match.winner_team.toLowerCase()
            : isTeamAWinner
            ? wonByA
            : wonByB;

          const isSelected = selectedRoundNum === r.round_num;

          return (
            <button
              key={r.id}
              type="button"
              onClick={() =>
                setSelectedRoundNum(isSelected ? null : r.round_num)
              }
              title={`Round ${r.round_num + 1} • Venceu: ${
                r.winning_team_name
              } (${getResultLabel(r.round_result)}) ${
                r.plant_site ? `Site ${r.plant_site}` : ""
              }`}
              className={`w-8 h-8 sm:w-9 sm:h-9 rounded-lg flex items-center justify-center font-mono text-xs font-bold border transition-all duration-150 cursor-pointer relative ${
                isSelected
                  ? "ring-2 ring-white border-white scale-110 shadow-lg shadow-white/20 z-10"
                  : "hover:scale-105 opacity-90 hover:opacity-100"
              } ${
                wonByWinner
                  ? "bg-emerald-500/20 text-emerald-400 border-emerald-500/40"
                  : "bg-red-500/20 text-red-400 border-red-500/40"
              }`}
            >
              <img
                src={getRoundResult(r.round_result)}
                alt={r.round_result || "Resultado"}
                className="w-4 h-4 sm:w-5 sm:h-5 object-contain"
              />
              <span className="absolute -top-1.5 -right-1 text-[8px] sm:text-[9px] bg-zinc-950 text-zinc-400 px-1 rounded font-mono border border-zinc-800">
                {r.round_num + 1}
              </span>
            </button>
          );
        })}
      </div>

      {/* Selected Round Summary Card */}
      {selectedRound && (
        <div className="mt-4 bg-zinc-950/80 border border-zinc-800 rounded-xl p-3.5 sm:p-5 space-y-4 sm:space-y-5 animate-in fade-in duration-200">
          {/* Top Info Bar */}
          <div className="flex flex-wrap items-center justify-between gap-2.5 sm:gap-3 pb-3 sm:pb-4 border-b border-zinc-800/80">
            <div className="flex items-center gap-2.5 sm:gap-3 min-w-0">
              <span className="text-sm sm:text-lg font-black font-mono text-white px-2.5 sm:px-3 py-1 rounded-lg border border-white-400/20 shrink-0">
                ROUND {selectedRound.round_num + 1}
              </span>
              <div className="min-w-0">
                <div className="flex items-center gap-1.5 sm:gap-2 truncate">
                  <span className="text-xs text-zinc-400 shrink-0">Vencedor:</span>
                  <span className="text-xs sm:text-sm font-bold text-white truncate">
                    {selectedRound.winning_team_name}
                  </span>
                </div>
                <div className="text-[11px] sm:text-xs text-zinc-500 flex items-center gap-1.5 mt-0.5 font-bold truncate">
                  <span>{getResultLabel(selectedRound.round_result)}</span>
                  {selectedRound.plant_site && (
                    <span className="text-zinc-500 shrink-0">
                      • Site {selectedRound.plant_site}
                    </span>
                  )}
                </div>
              </div>
            </div>

            <div className="flex items-center gap-1.5 sm:gap-2 text-xs font-mono text-zinc-400 bg-zinc-900 px-2.5 sm:px-3 py-1.5 rounded-lg border border-zinc-800 shrink-0">
              <Swords className="w-3.5 h-3.5 text-zinc-400" />
              <span>{selectedRound.kills.length} Abates</span>
            </div>
          </div>

          {/* Highlights Grid */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-2.5 sm:gap-3">
            {/* MVP do Round */}
            <div className="bg-gradient-to-br from-zinc-500/10 to-zinc-900 border border-zinc-500/30 rounded-xl p-3 sm:p-3.5 space-y-1.5">
              <div className="flex items-center gap-1.5 text-xs font-semibold text-white-400">
                <Trophy className="w-3.5 h-3.5 text-amber-400" />
                <span>MVP do Round</span>
              </div>
              {selectedRound.mvp ? (
                <div>
                  <div className="flex items-center gap-2">
                    {selectedRound.mvp.character_id && (
                      <img
                        src={`/agents/${selectedRound.mvp.character_id.toLowerCase()}.png`}
                        alt={selectedRound.mvp.agent_name}
                        className="w-6 h-6 sm:w-7 sm:h-7 rounded-lg object-contain bg-zinc-800/80 p-0.5 border border-amber-400/40 shrink-0"
                        onError={(e) => {
                          e.currentTarget.style.display = "none";
                        }}
                      />
                    )}
                    <div className="min-w-0 truncate">
                      <div className="text-xs sm:text-sm font-bold text-white truncate">
                        {selectedRound.mvp.game_name}
                      </div>
                      <div className="text-[11px] sm:text-xs text-zinc-400 truncate">
                        {selectedRound.mvp.agent_name} •{" "}
                        <span className="text-zinc-500">
                          {selectedRound.mvp.team_name}
                        </span>
                      </div>
                    </div>
                  </div>
                  <div className="flex items-center gap-1.5 sm:gap-2 mt-2 pt-2 border-t border-amber-400/40 text-[10px] sm:text-[11px] font-mono text-zinc-300">
                    <span>{selectedRound.mvp.score} pts</span>
                    <span>•</span>
                    <span>{selectedRound.mvp.kills}K</span>
                    <span>•</span>
                    <span>{selectedRound.mvp.damage} dmg</span>
                  </div>
                </div>
              ) : (
                <div className="text-xs text-zinc-500 pt-1">
                  Sem dados de combate
                </div>
              )}
            </div>

            {/* First Blood & First Death */}
            <div className="bg-gradient-to-br from-zinc-500/10 to-zinc-900 border border-zinc-500/30 rounded-xl p-3 sm:p-3.5 space-y-1.5">
              <div className="flex items-center gap-1.5 text-xs font-semibold text-white">
                <Crosshair className="w-3.5 h-3.5 text-rose-500" />
                <span>First Blood / Death</span>
              </div>
              {selectedRound.first_blood ? (
                <div>
                  <div className="text-xs text-zinc-300 flex items-center gap-1.5 truncate">
                    <span className="text-emerald-400 font-bold shrink-0">FB:</span>
                    <span className="font-semibold text-white truncate">
                      {selectedRound.first_blood.killer_name}
                    </span>
                    {selectedRound.first_blood.killer_character_id && (
                      <img
                        src={`/agents/${selectedRound.first_blood.killer_character_id.toLowerCase()}.png`}
                        alt={selectedRound.first_blood.killer_agent}
                        className="w-4 h-4 object-contain shrink-0"
                        onError={(e) => {
                          e.currentTarget.style.display = "none";
                        }}
                      />
                    )}
                  </div>
                  <div className="text-xs text-zinc-300 mt-0.5 flex items-center gap-1.5 truncate">
                    <span className="text-rose-400 font-bold shrink-0">FD:</span>
                    <span className="font-semibold text-white truncate">
                      {selectedRound.first_blood.victim_name}
                    </span>
                    {selectedRound.first_blood.victim_character_id && (
                      <img
                        src={`/agents/${selectedRound.first_blood.victim_character_id.toLowerCase()}.png`}
                        alt={selectedRound.first_blood.victim_agent}
                        className="w-4 h-4 object-contain shrink-0"
                        onError={(e) => {
                          e.currentTarget.style.display = "none";
                        }}
                      />
                    )}
                  </div>
                  <div className="flex items-center gap-1.5 mt-2 pt-2 border-t border-rose-500/40 text-[10px] sm:text-[11px] font-mono text-zinc-400">
                    <Clock className="w-3 h-3 text-zinc-500 shrink-0" />
                    <span>aos {selectedRound.first_blood.timing_seconds}s</span>
                    <span>•</span>
                    <span className="text-zinc-300 truncate">
                      {selectedRound.first_blood.weapon_name}
                    </span>
                  </div>
                </div>
              ) : (
                <div className="text-xs text-zinc-500 pt-1">
                  Nenhum abate registrado
                </div>
              )}
            </div>

            {/* Situação da Spike */}
            <div className="bg-gradient-to-br from-zinc-500/10 to-zinc-900 border border-zinc-500/30 rounded-xl p-3 sm:p-3.5 space-y-1.5">
              <div className="flex items-center gap-1.5 text-xs font-semibold text-white">
                <Bomb className="w-3.5 h-3.5 text-orange-500" />
                <span>Spike & Objetivo</span>
              </div>
              {selectedRound.planter ? (
                <div>
                  {selectedRound.plant_site && (
                    <div className="text-[10px] sm:text-[11px] text-white font-mono mt-0.5">
                      Site {selectedRound.plant_site}
                    </div>
                  )}

                  <div className="text-xs text-zinc-300 flex items-center gap-1.5 truncate">
                    <span className="text-amber-400 font-bold shrink-0">Plant:</span>
                    <span className="font-semibold text-white truncate">
                      {selectedRound.planter.game_name}
                    </span>
                    {selectedRound.planter.character_id && (
                      <img
                        src={`/agents/${selectedRound.planter.character_id.toLowerCase()}.png`}
                        alt={selectedRound.planter.agent_name}
                        className="w-4 h-4 object-contain shrink-0"
                        onError={(e) => {
                          e.currentTarget.style.display = "none";
                        }}
                      />
                    )}
                  </div>
                  
                  {selectedRound.defuser ? (
                    <div className="text-xs text-zinc-300 mt-1 flex items-center gap-1.5 truncate">
                      <span className="text-emerald-400 font-bold shrink-0">Defuse:</span>
                      <span className="font-semibold text-white truncate">
                        {selectedRound.defuser.game_name}
                      </span>
                      {selectedRound.defuser.character_id && (
                        <img
                          src={`/agents/${selectedRound.defuser.character_id.toLowerCase()}.png`}
                          alt={selectedRound.defuser.agent_name}
                          className="w-4 h-4 object-contain shrink-0"
                          onError={(e) => {
                            e.currentTarget.style.display = "none";
                          }}
                        />
                      )}
                    </div>
                  ) : (
                    <div className="text-[10px] sm:text-[11px] text-zinc-500 mt-1">
                      Spike não foi defusada
                    </div>
                  )}
                </div>
              ) : (
                <div className="text-xs text-zinc-400 pt-1 space-y-1">
                  <div className="text-zinc-500">Spike não plantada</div>
                  <div className="text-[10px] sm:text-[11px] text-zinc-600">
                    Round vencido por eliminação ou tempo
                  </div>
                </div>
              )}
            </div>

            {/* Habilidades no Round */}
            <div className="bg-gradient-to-br from-zinc-500/10 to-zinc-900 border border-zinc-500/30 rounded-xl p-3 sm:p-3.5 space-y-1.5">
              <div className="flex items-center gap-1.5 text-xs font-semibold text-white">
                <img src="/boom-bot-white.png" alt="" className="w-5 h-3.5 sm:w-6 sm:h-4 shrink-0" />
                <span>Habilidades</span>
              </div>
              {(() => {
                const abilityKills = selectedRound.kills.filter(
                  (k) => k.damage_type === "Ability"
                );
                if (abilityKills.length > 0) {
                  return (
                    <div className="space-y-1">
                      <div className="text-[11px] sm:text-xs text-zinc-300 font-medium">
                        {abilityKills.length} abate(s) com skill:
                      </div>
                      <div className="space-y-0.5">
                        {abilityKills.map((ak) => (
                          <div
                            key={ak.id}
                            className="text-[10px] sm:text-[11px] text-white truncate font-mono flex items-center gap-1"
                          >
                            <span>• {ak.killer_name}</span>
                            {ak.killer_character_id && (
                              <img
                                src={`/agents/${ak.killer_character_id.toLowerCase()}.png`}
                                alt={ak.killer_agent}
                                className="w-3.5 h-3.5 object-contain shrink-0"
                                onError={(e) => {
                                  e.currentTarget.style.display = "none";
                                }}
                              />
                            )}
                          </div>
                        ))}
                      </div>
                    </div>
                  );
                }
                return (
                  <div className="text-xs text-zinc-400 pt-1 space-y-1">
                    <div className="text-zinc-500">Sem abates diretos por skill</div>
                    <div className="text-[10px] text-zinc-600 leading-tight">
                      Casts totais disponíveis no resumo da partida
                    </div>
                  </div>
                );
              })()}
            </div>
          </div>

          {/* Killfeed Timeline */}
          <div className="space-y-2 pt-2">
            <h4 className="text-xs font-bold uppercase tracking-wider text-zinc-400 flex items-center gap-1.5">
              Killfeed do Round ({selectedRound.kills.length})
            </h4>

            {selectedRound.kills.length === 0 ? (
              <div className="text-xs text-zinc-500 py-3 text-center bg-zinc-900/40 rounded-lg border border-zinc-800/50">
                Nenhum abate registrado neste round.
              </div>
            ) : (
              <div className="space-y-1.5">
                {selectedRound.kills.map((k) => {
                  const winningTeamName =
                    match.winner_team ||
                    (match.score_a > match.score_b ? match.team_a : match.team_b);

                  const isKillerWinner =
                    k.killer_team.toLowerCase() === winningTeamName.toLowerCase();
                  const isVictimWinner =
                    k.victim_team.toLowerCase() === winningTeamName.toLowerCase();

                  let assistants: string[] = [];
                  try {
                    assistants = JSON.parse(k.assistants_json || "[]");
                  } catch {
                    assistants = [];
                  }

                  return (
                    <div
                      key={k.id}
                      className="flex items-center justify-between gap-1.5 sm:gap-2 bg-zinc-900/70 hover:bg-zinc-900 border border-zinc-800/80 rounded-lg px-2 sm:px-3 py-2 text-xs transition-colors overflow-hidden"
                    >
                      {/* Left: Timing & Killer */}
                      <div className="flex items-center gap-1.5 sm:gap-2 min-w-0 flex-1">
                        <span className="font-mono text-zinc-500 text-[10px] sm:text-[11px] shrink-0 w-7 sm:w-9">
                          {formatRoundTime(k.kill_time_millis)}
                        </span>

                        <div className="flex items-center gap-1 sm:gap-1.5 min-w-0">
                          <span
                            className={`font-semibold text-xs sm:text-sm truncate max-w-[70px] xs:max-w-[110px] sm:max-w-[150px] ${
                              isKillerWinner ? "text-emerald-400" : "text-red-400"
                            }`}
                          >
                            {k.killer_name}
                          </span>
                          <span className="inline-flex items-center text-[10px] sm:text-[11px] text-zinc-400 font-mono bg-zinc-800/60 p-0.5 sm:px-1.5 sm:py-0.5 rounded border border-zinc-700/40 shrink-0">
                            {k.killer_character_id && (
                              <img
                                src={`/agents/${k.killer_character_id.toLowerCase()}.png`}
                                alt={k.killer_agent}
                                className="w-4 h-4 sm:w-5 sm:h-5 object-contain"
                                onError={(e) => {
                                  e.currentTarget.style.display = "none";
                                }}
                              />
                            )}
                          </span>
                        </div>
                      </div>

                      {/* Middle: Weapon Badge */}
                      <div className="flex items-center gap-1 sm:gap-1.5 shrink-0 px-0.5 sm:px-1">
                        <span
                          className={`flex items-center gap-1 sm:gap-1.5 px-1.5 sm:px-2 py-0.5 rounded text-[9px] sm:text-[10px] font-mono font-semibold border ${
                            k.damage_type === "Ability"
                              ? "bg-zinc-500/20 text-zinc-300 border-zinc-500/30"
                              : "bg-zinc-800 text-zinc-300 border-zinc-700/60"
                          }`}
                        >
                          {k.damage_type === "Ability" ? (
                            "Skill"
                          ) : (
                            <>
                              {k.weapon_id && (
                                <img
                                  src={`/weapons/${k.weapon_id.toLowerCase()}.png`}
                                  alt={k.weapon_name}
                                  className="h-2.5 sm:h-3.5 w-auto max-w-8 sm:max-w-10 object-contain scale-x-[-1]"
                                  onError={(e) => {
                                    e.currentTarget.style.display = "none";
                                  }}
                                />
                              )}
                              <span className="hidden sm:inline">{k.weapon_name}</span>
                            </>
                          )}
                        </span>
                        <span className="text-zinc-600 text-xs sm:text-sm">→</span>
                      </div>

                      {/* Right: Victim */}
                      <div className="flex items-center justify-end gap-1 sm:gap-2 min-w-0 flex-1">
                        <div className="flex items-center gap-1 sm:gap-1.5 min-w-0">
                          <span className="inline-flex items-center text-[10px] sm:text-[11px] text-zinc-400 font-mono bg-zinc-800/60 p-0.5 sm:px-1.5 sm:py-0.5 rounded border border-zinc-700/40 shrink-0">
                            {k.victim_character_id && (
                              <img
                                src={`/agents/${k.victim_character_id.toLowerCase()}.png`}
                                alt={k.victim_agent}
                                className="w-4 h-4 sm:w-5 sm:h-5 object-contain"
                                onError={(e) => {
                                  e.currentTarget.style.display = "none";
                                }}
                              />
                            )}
                          </span>
                          <span
                            className={`font-semibold text-xs sm:text-sm truncate max-w-[70px] xs:max-w-[110px] sm:max-w-[150px] ${
                              isVictimWinner ? "text-emerald-400" : "text-red-400"
                            }`}
                          >
                            {k.victim_name}
                          </span>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
