import { db } from "./db";
import { getAgentName } from "./agents";

const STAGE_LABELS: Record<string, string> = {
  C1: "Classificatória 1",
  C2: "Classificatória 2",
  C3: "Classificatória 3",
  C4: "Classificatória 4",
  G: "Fase de Grupos",
  classificatoria1: "Classificatória 1",
  classificatoria2: "Classificatória 2",
  classificatoria3: "Classificatória 3",
  classificatoria4: "Classificatória 4",
  fasedegrupos: "Fase de Grupos",
};

export function formatMapName(rawMap: string): string {
  const mapClean = rawMap.toLowerCase().trim();
  return mapClean.charAt(0).toUpperCase() + mapClean.slice(1);
}

export function formatDate(dateStr: string): string {
  const parts = dateStr.split("-");
  if (parts.length === 3) {
    const [day, month, year] = parts;
    const fullYear = year.length === 2 ? `20${year}` : year;
    return `${fullYear}-${month.padStart(2, "0")}-${day.padStart(2, "0")}`;
  }
  return dateStr;
}

export function formatTeamName(raw: string): string {
  return raw
    .split("_")
    .map((w) => w.charAt(0).toUpperCase() + w.slice(1))
    .join(" ");
}

export interface ImportMatchResult {
  success: boolean;
  matchId: string;
  slug: string;
  teamA: string;
  teamB: string;
  scoreA: number;
  scoreB: number;
  mapName: string;
  isExisting: boolean;
  message?: string;
}

export function importMatch(matchData: any, filename?: string): ImportMatchResult {
  if (!matchData || typeof matchData !== "object") {
    throw new Error("Arquivo JSON inválido ou vazio.");
  }

  const matchInfo = matchData.matchInfo || {};
  const teams = matchData.teams || [];
  const players = matchData.players || [];
  const roundResults = matchData.roundResults || [];

  if (!players.length) {
    throw new Error("O JSON não contém dados de jogadores (players).");
  }

  const filenameRegex =
    /^UNIVAVA_([A-Za-z0-9]+)_([^_]+)_([^_]+)_(.+)_(\d+)_x_(\d+)_(.+)_([^_]+)\.json$/;

  const cleanFilename = filename ? filename.trim() : "";
  const matchRegex = cleanFilename.match(filenameRegex);

  let stageCode = "CUSTOM";
  let stageName = "Partida Importada";
  let matchCode = "";
  let gameDate = "";
  let teamAName = "Time Vermelho";
  let teamBName = "Time Azul";
  let scoreA = 0;
  let scoreB = 0;
  let mapName = "Ascent";
  let slug = "";

  if (matchRegex) {
    const [, rawStage, rawMatchCode, rawDate, rawTeamA, rawScoreA, rawScoreB, rawTeamB, rawMap] =
      matchRegex;
    stageCode = rawStage;
    stageName = STAGE_LABELS[rawStage] || `Etapa ${rawStage}`;
    matchCode = rawMatchCode;
    gameDate = formatDate(rawDate);
    teamAName = formatTeamName(rawTeamA);
    teamBName = formatTeamName(rawTeamB);
    scoreA = parseInt(rawScoreA, 10);
    scoreB = parseInt(rawScoreB, 10);
    mapName = formatMapName(rawMap);
    slug = cleanFilename.replace(/\.json$/, "");
  } else {
    // Fallback: extrai do matchInfo e dos arrays internos
    const rawMap = matchInfo.mapId ? matchInfo.mapId.split("/").pop() : "Desconhecido";
    mapName = formatMapName(rawMap || "Desconhecido");

    if (matchInfo.gameStartMillis) {
      gameDate = new Date(matchInfo.gameStartMillis).toISOString().split("T")[0];
    } else {
      gameDate = new Date().toISOString().split("T")[0];
    }

    const team0 = teams[0] || {};
    const team1 = teams[1] || {};
    scoreA = team0.roundsWon ?? 0;
    scoreB = team1.roundsWon ?? 0;
    teamAName = team0.teamId === "Red" ? "Time Vermelho" : "Time Azul";
    teamBName = team1.teamId === "Blue" ? "Time Azul" : "Time Vermelho";

    const matchIdPartial = (matchInfo.matchId || "").slice(0, 6).toUpperCase();
    matchCode = matchIdPartial || "MATCH";
    stageCode = "IMPORT";
    stageName = "Partida Importada";

    const baseSlug = cleanFilename
      ? cleanFilename.replace(/\.json$/, "").replace(/[^a-zA-Z0-9_-]/g, "_")
      : `match_${matchInfo.matchId || Date.now()}`;
    slug = baseSlug;
  }

  const matchId = matchInfo.matchId || slug;
  if (!slug) slug = matchId;

  const durationMillis = matchInfo.gameLengthMillis || 0;
  const winnerTeam = scoreA > scoreB ? teamAName : teamBName;
  const roundsPlayed = roundResults.length || scoreA + scoreB;

  // Determine Red/Blue mapping
  let redTeamName = teamAName;
  let blueTeamName = teamBName;

  if (teams.length === 2) {
    const team0 = teams[0];
    const team1 = teams[1];
    if (team0.roundsWon === scoreA && team1.roundsWon === scoreB) {
      if (team0.teamId === "Red") {
        redTeamName = teamAName;
        blueTeamName = teamBName;
      } else {
        blueTeamName = teamAName;
        redTeamName = teamBName;
      }
    } else if (team0.roundsWon === scoreB && team1.roundsWon === scoreA) {
      if (team0.teamId === "Red") {
        redTeamName = teamBName;
        blueTeamName = teamAName;
      } else {
        blueTeamName = teamBName;
        redTeamName = teamAName;
      }
    }
  }

  const checkExisting = db.prepare("SELECT id FROM matches WHERE id = ? OR slug = ?");
  const existingMatch = checkExisting.get(matchId, slug) as { id: string } | undefined;

  const deleteExisting = db.prepare("DELETE FROM matches WHERE id = ? OR slug = ?");

  const insertMatchStmt = db.prepare(`
    INSERT INTO matches (
      id, slug, stage_code, stage_name, match_code, game_date,
      team_a, team_b, score_a, score_b, winner_team,
      map_name, rounds_played, duration_millis, file_path
    ) VALUES (
      @id, @slug, @stage_code, @stage_name, @match_code, @game_date,
      @team_a, @team_b, @score_a, @score_b, @winner_team,
      @map_name, @rounds_played, @duration_millis, @file_path
    )
  `);

  const insertPlayerStat = db.prepare(`
    INSERT INTO player_stats (
      match_id, puuid, game_name, tag_line, team_id, team_name,
      character_id, agent_name, kills, deaths, assists, score,
      damage_dealt, headshots, bodyshots, legshots, first_bloods, first_deaths,
      plants, defuses,
      grenade_casts, ability1_casts, ability2_casts, ultimate_casts, total_abilities_cast,
      rounds_played, kd_ratio, acs, adr, hs_pct
    ) VALUES (
      @match_id, @puuid, @game_name, @tag_line, @team_id, @team_name,
      @character_id, @agent_name, @kills, @deaths, @assists, @score,
      @damage_dealt, @headshots, @bodyshots, @legshots, @first_bloods, @first_deaths,
      @plants, @defuses,
      @grenade_casts, @ability1_casts, @ability2_casts, @ultimate_casts, @total_abilities_cast,
      @rounds_played, @kd_ratio, @acs, @adr, @hs_pct
    )
  `);

  const insertRound = db.prepare(`
    INSERT INTO match_rounds (
      match_id, round_num, winning_team_id, winning_team_name,
      round_result, round_ceremony, plant_site, bomb_planter, bomb_defuser
    ) VALUES (
      @match_id, @round_num, @winning_team_id, @winning_team_name,
      @round_result, @round_ceremony, @plant_site, @bomb_planter, @bomb_defuser
    )
  `);

  const insertRoundKill = db.prepare(`
    INSERT INTO round_kills (
      match_id, round_num, killer_puuid, victim_puuid,
      kill_time_millis, damage_type, damage_item, assistants_json
    ) VALUES (
      @match_id, @round_num, @killer_puuid, @victim_puuid,
      @kill_time_millis, @damage_type, @damage_item, @assistants_json
    )
  `);

  const insertRoundPlayerStat = db.prepare(`
    INSERT INTO round_player_stats (
      match_id, round_num, puuid, score, kills, damage
    ) VALUES (
      @match_id, @round_num, @puuid, @score, @kills, @damage
    )
  `);

  const executeTransaction = db.transaction(() => {
    if (existingMatch) {
      deleteExisting.run(matchId, slug);
    }

    insertMatchStmt.run({
      id: matchId,
      slug,
      stage_code: stageCode,
      stage_name: stageName,
      match_code: matchCode,
      game_date: gameDate,
      team_a: teamAName,
      team_b: teamBName,
      score_a: scoreA,
      score_b: scoreB,
      winner_team: winnerTeam,
      map_name: mapName,
      rounds_played: roundsPlayed,
      duration_millis: durationMillis,
      file_path: cleanFilename || `upload/${matchId}.json`,
    });

    const playerDamageMap: Record<
      string,
      {
        damage: number;
        headshots: number;
        bodyshots: number;
        legshots: number;
        firstBloods: number;
        firstDeaths: number;
        plants: number;
        defuses: number;
      }
    > = {};

    for (const p of players) {
      playerDamageMap[p.puuid] = {
        damage: 0,
        headshots: 0,
        bodyshots: 0,
        legshots: 0,
        firstBloods: 0,
        firstDeaths: 0,
        plants: 0,
        defuses: 0,
      };
    }

    for (const r of roundResults) {
      const roundNum = r.roundNum ?? 0;
      const winningTeamId = r.winningTeam || "";
      const winningTeamName =
        winningTeamId === "Red" ? redTeamName : winningTeamId === "Blue" ? blueTeamName : "Empate";

      insertRound.run({
        match_id: matchId,
        round_num: roundNum,
        winning_team_id: winningTeamId,
        winning_team_name: winningTeamName,
        round_result: r.roundResult || null,
        round_ceremony: r.roundCeremony || null,
        plant_site: r.plantSite || null,
        bomb_planter: r.bombPlanter || null,
        bomb_defuser: r.bombDefuser || null,
      });

      let earliestKillTime = Infinity;
      let firstKillerPuuid: string | null = null;
      let firstDeathPuuid: string | null = null;

      const roundPlayerStats = r.playerStats || [];
      for (const ps of roundPlayerStats) {
        const puuid = ps.puuid;
        if (!puuid || !playerDamageMap[puuid]) continue;

        let roundDmg = 0;

        if (Array.isArray(ps.damage)) {
          for (const dmg of ps.damage) {
            const d = dmg.damage || 0;
            roundDmg += d;
            playerDamageMap[puuid].damage += d;
            playerDamageMap[puuid].headshots += dmg.headshots || 0;
            playerDamageMap[puuid].bodyshots += dmg.bodyshots || 0;
            playerDamageMap[puuid].legshots += dmg.legshots || 0;
          }
        }

        insertRoundPlayerStat.run({
          match_id: matchId,
          round_num: roundNum,
          puuid,
          score: ps.score || 0,
          kills: Array.isArray(ps.kills) ? ps.kills.length : 0,
          damage: roundDmg,
        });

        if (Array.isArray(ps.kills)) {
          for (const k of ps.kills) {
            const killTime = k.timeSinceRoundStartMillis ?? 0;
            if (killTime < earliestKillTime) {
              earliestKillTime = killTime;
              firstKillerPuuid = k.killer;
              firstDeathPuuid = k.victim;
            }

            insertRoundKill.run({
              match_id: matchId,
              round_num: roundNum,
              killer_puuid: k.killer || "",
              victim_puuid: k.victim || "",
              kill_time_millis: killTime,
              damage_type: k.finishingDamage?.damageType || null,
              damage_item: k.finishingDamage?.damageItem || null,
              assistants_json: JSON.stringify(k.assistants || []),
            });
          }
        }
      }

      if (firstKillerPuuid && playerDamageMap[firstKillerPuuid]) {
        playerDamageMap[firstKillerPuuid].firstBloods += 1;
      }

      if (firstDeathPuuid && playerDamageMap[firstDeathPuuid]) {
        playerDamageMap[firstDeathPuuid].firstDeaths += 1;
      }

      if (r.bombPlanter && playerDamageMap[r.bombPlanter]) {
        playerDamageMap[r.bombPlanter].plants += 1;
      }

      if (r.bombDefuser && playerDamageMap[r.bombDefuser]) {
        playerDamageMap[r.bombDefuser].defuses += 1;
      }
    }

    for (const p of players) {
      const puuid = p.puuid || "";
      const gameName = p.gameName || "Jogador";
      const tagLine = p.tagLine || "";
      const teamId = p.teamId || "";
      const teamName = teamId === "Red" ? redTeamName : teamId === "Blue" ? blueTeamName : "Sem time";
      const characterId = p.characterId || "";
      const agentName = getAgentName(characterId);

      const stats = p.stats || {};
      const kills = stats.kills || 0;
      const deaths = stats.deaths || 0;
      const assists = stats.assists || 0;
      const score = stats.score || 0;
      const playerRounds = stats.roundsPlayed || roundsPlayed || 1;

      const abilityCasts = stats.abilityCasts || {};
      const grenadeCasts = abilityCasts.grenadeCasts || 0;
      const ability1Casts = abilityCasts.ability1Casts || 0;
      const ability2Casts = abilityCasts.ability2Casts || 0;
      const ultimateCasts = abilityCasts.ultimateCasts || 0;
      const totalAbilitiesCast = grenadeCasts + ability1Casts + ability2Casts + ultimateCasts;

      const dmgStats = playerDamageMap[puuid] || {
        damage: 0,
        headshots: 0,
        bodyshots: 0,
        legshots: 0,
        firstBloods: 0,
        firstDeaths: 0,
        plants: 0,
        defuses: 0,
      };

      const kdRatio = deaths === 0 ? kills : parseFloat((kills / deaths).toFixed(2));
      const acs = playerRounds > 0 ? parseFloat((score / playerRounds).toFixed(1)) : 0;
      const adr = playerRounds > 0 ? parseFloat((dmgStats.damage / playerRounds).toFixed(1)) : 0;
      const totalHits = dmgStats.headshots + dmgStats.bodyshots + dmgStats.legshots;
      const hsPct = totalHits > 0 ? parseFloat(((dmgStats.headshots / totalHits) * 100).toFixed(1)) : 0;

      insertPlayerStat.run({
        match_id: matchId,
        puuid,
        game_name: gameName,
        tag_line: tagLine,
        team_id: teamId,
        team_name: teamName,
        character_id: characterId,
        agent_name: agentName,
        kills,
        deaths,
        assists,
        score,
        damage_dealt: dmgStats.damage,
        headshots: dmgStats.headshots,
        bodyshots: dmgStats.bodyshots,
        legshots: dmgStats.legshots,
        first_bloods: dmgStats.firstBloods,
        first_deaths: dmgStats.firstDeaths,
        plants: dmgStats.plants,
        defuses: dmgStats.defuses,
        grenade_casts: grenadeCasts,
        ability1_casts: ability1Casts,
        ability2_casts: ability2Casts,
        ultimate_casts: ultimateCasts,
        total_abilities_cast: totalAbilitiesCast,
        rounds_played: playerRounds,
        kd_ratio: kdRatio,
        acs,
        adr,
        hs_pct: hsPct,
      });
    }
  });

  executeTransaction();

  return {
    success: true,
    matchId,
    slug,
    teamA: teamAName,
    teamB: teamBName,
    scoreA,
    scoreB,
    mapName,
    isExisting: !!existingMatch,
  };
}
