import fs from "fs";
import path from "path";
import Database from "better-sqlite3";
import { AGENT_MAP, getAgentName } from "../lib/agents";

const DB_PATH = path.join(process.cwd(), "univava.db");
const BASE_DATA_DIR = path.join(process.cwd(), "db");

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

function formatMapName(rawMap: string): string {
  const mapClean = rawMap.toLowerCase().trim();
  const mapCapitalized = mapClean.charAt(0).toUpperCase() + mapClean.slice(1);
  return mapCapitalized;
}

function formatDate(dateStr: string): string {
  // Format usually dd-mm-yy (e.g. 27-06-26 -> 2026-06-27)
  const parts = dateStr.split("-");
  if (parts.length === 3) {
    const [day, month, year] = parts;
    const fullYear = year.length === 2 ? `20${year}` : year;
    return `${fullYear}-${month.padStart(2, "0")}-${day.padStart(2, "0")}`;
  }
  return dateStr;
}

function formatTeamName(raw: string): string {
  return raw
    .split("_")
    .map((w) => w.charAt(0).toUpperCase() + w.slice(1))
    .join(" ");
}

function getAllJsonFiles(dir: string): string[] {
  let results: string[] = [];
  if (!fs.existsSync(dir)) return results;

  const list = fs.readdirSync(dir);
  for (const file of list) {
    const fullPath = path.join(dir, file);
    const stat = fs.statSync(fullPath);
    if (stat.isDirectory()) {
      results = results.concat(getAllJsonFiles(fullPath));
    } else if (file.endsWith(".json")) {
      results.push(fullPath);
    }
  }
  return results;
}

function initDb(db: Database.Database) {
  db.exec(`
    DROP TABLE IF EXISTS round_player_stats;
    DROP TABLE IF EXISTS round_kills;
    DROP TABLE IF EXISTS match_rounds;
    DROP TABLE IF EXISTS player_stats;
    DROP TABLE IF EXISTS matches;

    CREATE TABLE matches (
      id TEXT PRIMARY KEY,
      slug TEXT UNIQUE NOT NULL,
      stage_code TEXT NOT NULL,
      stage_name TEXT NOT NULL,
      match_code TEXT NOT NULL,
      game_date TEXT NOT NULL,
      team_a TEXT NOT NULL,
      team_b TEXT NOT NULL,
      score_a INTEGER NOT NULL,
      score_b INTEGER NOT NULL,
      winner_team TEXT NOT NULL,
      map_name TEXT NOT NULL,
      rounds_played INTEGER NOT NULL,
      duration_millis INTEGER NOT NULL,
      file_path TEXT NOT NULL
    );

    CREATE TABLE player_stats (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      match_id TEXT NOT NULL,
      puuid TEXT NOT NULL,
      game_name TEXT NOT NULL,
      tag_line TEXT NOT NULL,
      team_id TEXT NOT NULL,
      team_name TEXT NOT NULL,
      character_id TEXT NOT NULL,
      agent_name TEXT NOT NULL,
      kills INTEGER NOT NULL,
      deaths INTEGER NOT NULL,
      assists INTEGER NOT NULL,
      score INTEGER NOT NULL,
      damage_dealt INTEGER NOT NULL,
      headshots INTEGER NOT NULL,
      bodyshots INTEGER NOT NULL,
      legshots INTEGER NOT NULL,
      first_bloods INTEGER NOT NULL,
      first_deaths INTEGER NOT NULL,
      plants INTEGER NOT NULL DEFAULT 0,
      defuses INTEGER NOT NULL DEFAULT 0,
      grenade_casts INTEGER NOT NULL DEFAULT 0,
      ability1_casts INTEGER NOT NULL DEFAULT 0,
      ability2_casts INTEGER NOT NULL DEFAULT 0,
      ultimate_casts INTEGER NOT NULL DEFAULT 0,
      total_abilities_cast INTEGER NOT NULL DEFAULT 0,
      rounds_played INTEGER NOT NULL,
      kd_ratio REAL NOT NULL,
      acs REAL NOT NULL,
      adr REAL NOT NULL,
      hs_pct REAL NOT NULL,
      FOREIGN KEY (match_id) REFERENCES matches(id) ON DELETE CASCADE
    );

    CREATE TABLE match_rounds (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      match_id TEXT NOT NULL,
      round_num INTEGER NOT NULL,
      winning_team_id TEXT NOT NULL,
      winning_team_name TEXT NOT NULL,
      round_result TEXT,
      round_ceremony TEXT,
      plant_site TEXT,
      bomb_planter TEXT,
      bomb_defuser TEXT,
      FOREIGN KEY (match_id) REFERENCES matches(id) ON DELETE CASCADE
    );

    CREATE TABLE round_kills (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      match_id TEXT NOT NULL,
      round_num INTEGER NOT NULL,
      killer_puuid TEXT NOT NULL,
      victim_puuid TEXT NOT NULL,
      kill_time_millis INTEGER NOT NULL,
      damage_type TEXT,
      damage_item TEXT,
      assistants_json TEXT,
      FOREIGN KEY (match_id) REFERENCES matches(id) ON DELETE CASCADE
    );

    CREATE TABLE round_player_stats (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      match_id TEXT NOT NULL,
      round_num INTEGER NOT NULL,
      puuid TEXT NOT NULL,
      score INTEGER NOT NULL,
      kills INTEGER NOT NULL,
      damage INTEGER NOT NULL,
      FOREIGN KEY (match_id) REFERENCES matches(id) ON DELETE CASCADE
    );

    CREATE INDEX idx_matches_stage ON matches(stage_code);
    CREATE INDEX idx_matches_map ON matches(map_name);
    CREATE INDEX idx_matches_date ON matches(game_date);
    CREATE INDEX idx_matches_team_a ON matches(team_a);
    CREATE INDEX idx_matches_team_b ON matches(team_b);
    CREATE INDEX idx_matches_winner ON matches(winner_team);

    CREATE INDEX idx_player_stats_match ON player_stats(match_id);
    CREATE INDEX idx_player_stats_puuid ON player_stats(puuid);
    CREATE INDEX idx_player_stats_name ON player_stats(game_name);
    CREATE INDEX idx_player_stats_team ON player_stats(team_name);
    CREATE INDEX idx_player_stats_agent ON player_stats(agent_name);

    CREATE INDEX idx_match_rounds_match ON match_rounds(match_id);

    CREATE INDEX idx_round_kills_match ON round_kills(match_id);
    CREATE INDEX idx_round_kills_match_round ON round_kills(match_id, round_num);
    CREATE INDEX idx_round_kills_killer ON round_kills(killer_puuid);
    CREATE INDEX idx_round_kills_victim ON round_kills(victim_puuid);

    CREATE INDEX idx_round_player_stats_match ON round_player_stats(match_id);
    CREATE INDEX idx_round_player_stats_match_round ON round_player_stats(match_id, round_num);
  `);
}

async function seed() {
  console.log("🚀 Starting database seeding...");
  const startTime = Date.now();

  const db = new Database(DB_PATH);
  db.pragma("journal_mode = WAL");
  db.pragma("synchronous = NORMAL");

  console.log("📦 Creating database tables...");
  initDb(db);

  const insertMatch = db.prepare(`
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

  const files = getAllJsonFiles(BASE_DATA_DIR);
  console.log(`📁 Found ${files.length} JSON match files.`);

  const filenameRegex =
    /^UNIVAVA_([A-Za-z0-9]+)_([^_]+)_([^_]+)_(.+)_(\d+)_x_(\d+)_(.+)_([^_]+)\.json$/;

  const insertAll = db.transaction(() => {
    let matchCount = 0;
    let playerCount = 0;
    let roundCount = 0;
    let killCount = 0;

    for (const filePath of files) {
      const filename = path.basename(filePath);
      const matchRegex = filename.match(filenameRegex);

      if (!matchRegex) {
        console.warn(`⚠️ Skipping unmatched filename: ${filename}`);
        continue;
      }

      const [, stageCode, matchCode, rawDate, rawTeamA, rawScoreA, rawScoreB, rawTeamB, rawMap] =
        matchRegex;

      const scoreA = parseInt(rawScoreA, 10);
      const scoreB = parseInt(rawScoreB, 10);
      const teamAName = formatTeamName(rawTeamA);
      const teamBName = formatTeamName(rawTeamB);
      const gameDate = formatDate(rawDate);
      const mapName = formatMapName(rawMap);
      const stageName = STAGE_LABELS[stageCode] || stageCode;
      const slug = filename.replace(/\.json$/, "");

      const rawContent = fs.readFileSync(filePath, "utf-8");
      const matchData = JSON.parse(rawContent);

      const matchInfo = matchData.matchInfo || {};
      const matchId = matchInfo.matchId || slug;
      const durationMillis = matchInfo.gameLengthMillis || 0;
      const teams = matchData.teams || [];
      const players = matchData.players || [];
      const roundResults = matchData.roundResults || [];

      // Determine Red/Blue mapping to Team A/B
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

      const winnerTeam = scoreA > scoreB ? teamAName : teamBName;
      const roundsPlayed = roundResults.length || scoreA + scoreB;

      // Insert Match
      insertMatch.run({
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
        file_path: path.relative(process.cwd(), filePath),
      });
      matchCount++;

      // Compute round-level aggregations (damage, headshots, first bloods, plants, defuses)
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
        roundCount++;

        // Track kills for first blood in this round
        let earliestKillTime = Infinity;
        let firstKillerPuuid: string | null = null;
        let firstDeathPuuid: string | null = null;

        const roundPlayerStats = r.playerStats || [];
        for (const ps of roundPlayerStats) {
          const puuid = ps.puuid;
          if (!puuid || !playerDamageMap[puuid]) continue;

          let roundDmg = 0;

          // Damage stats
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

          // First blood tracking and round kills
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
              killCount++;
            }
          }
        }

        if (firstKillerPuuid && playerDamageMap[firstKillerPuuid]) {
          playerDamageMap[firstKillerPuuid].firstBloods += 1;
        }

        if (firstDeathPuuid && playerDamageMap[firstDeathPuuid]){
          playerDamageMap[firstDeathPuuid].firstDeaths += 1;
        }

        if (r.bombPlanter && playerDamageMap[r.bombPlanter]) {
          playerDamageMap[r.bombPlanter].plants += 1;
        }

        if (r.bombDefuser && playerDamageMap[r.bombDefuser]) {
          playerDamageMap[r.bombDefuser].defuses += 1;
        }

      }

      // Insert Players
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
        playerCount++;
      }
    }

    return { matchCount, playerCount, roundCount, killCount };
  });

  const stats = insertAll();
  const elapsed = ((Date.now() - startTime) / 1000).toFixed(2);

  console.log("✅ Seeding completed successfully!");
  console.log(`⏱️  Duration: ${elapsed}s`);
  console.log(`🎮 Matches inserted: ${stats.matchCount}`);
  console.log(`👤 Player stats inserted: ${stats.playerCount}`);
  console.log(`🎯 Rounds inserted: ${stats.roundCount}`);
  console.log(`⚔️  Kills inserted: ${stats.killCount}`);

  db.close();
}

seed().catch((err) => {
  console.error("❌ Seeding failed:", err);
  process.exit(1);
});
