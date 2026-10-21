import { db } from "./db";

export interface MatchSummary {
  id: string;
  slug: string;
  stage_code: string;
  stage_name: string;
  match_code: string;
  game_date: string;
  team_a: string;
  team_b: string;
  score_a: number;
  score_b: number;
  winner_team: string;
  map_name: string;
  rounds_played: number;
  duration_millis: number;
  file_path: string;
}

export interface PlayerStat {
  id: number;
  match_id: string;
  puuid: string;
  game_name: string;
  tag_line: string;
  team_id: string;
  team_name: string;
  character_id: string;
  agent_name: string;
  kills: number;
  deaths: number;
  assists: number;
  score: number;
  damage_dealt: number;
  headshots: number;
  bodyshots: number;
  legshots: number;
  first_bloods: number;
  rounds_played: number;
  kd_ratio: number;
  acs: number;
  adr: number;
  hs_pct: number;
}

export interface MatchRound {
  id: number;
  match_id: string;
  round_num: number;
  winning_team_id: string;
  winning_team_name: string;
  round_result: string | null;
  round_ceremony: string | null;
  plant_site: string | null;
  bomb_planter: string | null;
  bomb_defuser: string | null;
}

export interface LeaderboardPlayer {
  puuid: string;
  game_name: string;
  tag_line: string;
  matches_played: number;
  total_kills: number;
  total_deaths: number;
  total_assists: number;
  avg_acs: number;
  avg_kd: number;
  avg_adr: number;
  avg_hs_pct: number;
  most_played_agent: string;
}

export function getOverviewStats() {
  const totalMatches = (
    db.prepare("SELECT COUNT(*) as count FROM matches").get() as { count: number }
  ).count;

  const totalPlayers = (
    db.prepare("SELECT COUNT(DISTINCT puuid) as count FROM player_stats").get() as { count: number }
  ).count;

  const mostPlayedMap = db
    .prepare("SELECT map_name, COUNT(*) as count FROM matches GROUP BY map_name ORDER BY count DESC LIMIT 1")
    .get() as { map_name: string; count: number } | undefined;

  const stages = db
    .prepare("SELECT stage_name, stage_code, COUNT(*) as count FROM matches GROUP BY stage_name, stage_code ORDER BY stage_code")
    .all() as { stage_name: string; stage_code: string; count: number }[];

  const maps = db
    .prepare("SELECT DISTINCT map_name FROM matches ORDER BY map_name")
    .all() as { map_name: string }[];

  return {
    totalMatches,
    totalPlayers,
    mostPlayedMap: mostPlayedMap?.map_name || "Nenhum",
    stages,
    maps: maps.map((m) => m.map_name),
  };
}

export function getMatches(filters?: {
  stage?: string;
  map?: string;
  search?: string;
  limit?: number;
  offset?: number;
}): { matches: MatchSummary[]; total: number } {
  const conditions: string[] = [];
  const params: Record<string, any> = {};

  if (filters?.stage && filters.stage !== "all") {
    conditions.push("(stage_code = @stage OR stage_name = @stage)");
    params.stage = filters.stage;
  }

  if (filters?.map && filters.map !== "all") {
    conditions.push("map_name = @map");
    params.map = filters.map;
  }

  if (filters?.search && filters.search.trim() !== "") {
    conditions.push(
      "(team_a LIKE @search OR team_b LIKE @search OR slug LIKE @search OR match_code LIKE @search)"
    );
    params.search = `%${filters.search.trim()}%`;
  }

  const whereClause = conditions.length > 0 ? `WHERE ${conditions.join(" AND ")}` : "";

  const totalRow = db
    .prepare(`SELECT COUNT(*) as count FROM matches ${whereClause}`)
    .get(params) as { count: number };

  const limit = filters?.limit ?? 50;
  const offset = filters?.offset ?? 0;

  const matches = db
    .prepare(
      `SELECT * FROM matches ${whereClause} ORDER BY game_date DESC, match_code ASC LIMIT ${limit} OFFSET ${offset}`
    )
    .all(params) as MatchSummary[];

  return {
    matches,
    total: totalRow.count,
  };
}

export function getMatchById(id: string): {
  match: MatchSummary | null;
  players: PlayerStat[];
  rounds: MatchRound[];
} {
  const match = (db
    .prepare("SELECT * FROM matches WHERE id = ? OR slug = ?")
    .get(id, id) as MatchSummary) || null;

  if (!match) {
    return { match: null, players: [], rounds: [] };
  }

  const players = db
    .prepare("SELECT * FROM player_stats WHERE match_id = ? ORDER BY score DESC")
    .all(match.id) as PlayerStat[];

  const rounds = db
    .prepare("SELECT * FROM match_rounds WHERE match_id = ? ORDER BY round_num ASC")
    .all(match.id) as MatchRound[];

  return { match, players, rounds };
}

export function getLeaderboard(limit = 20, minMatches = 2): LeaderboardPlayer[] {
  return db
    .prepare(
      `
    SELECT
      ps.puuid,
      ps.game_name,
      ps.tag_line,
      COUNT(*) as matches_played,
      SUM(ps.kills) as total_kills,
      SUM(ps.deaths) as total_deaths,
      SUM(ps.assists) as total_assists,
      ROUND(AVG(ps.acs), 1) as avg_acs,
      ROUND(CAST(SUM(ps.kills) AS REAL) / MAX(SUM(ps.deaths), 1), 2) as avg_kd,
      ROUND(AVG(ps.adr), 1) as avg_adr,
      ROUND(AVG(ps.hs_pct), 1) as avg_hs_pct,
      (
        SELECT agent_name
        FROM player_stats p2
        WHERE p2.puuid = ps.puuid
        GROUP BY agent_name
        ORDER BY COUNT(*) DESC
        LIMIT 1
      ) as most_played_agent
    FROM player_stats ps
    GROUP BY ps.puuid, ps.game_name, ps.tag_line
    HAVING matches_played >= ?
    ORDER BY avg_acs DESC
    LIMIT ?
  `
    )
    .all(minMatches, limit) as LeaderboardPlayer[];
}
