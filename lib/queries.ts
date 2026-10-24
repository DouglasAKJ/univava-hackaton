import { db } from "./db";
import { getWeaponName } from "./agents";

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
  first_deaths: number;
  plants: number;
  defuses: number;
  grenade_casts: number;
  ability1_casts: number;
  ability2_casts: number;
  ultimate_casts: number;
  total_abilities_cast: number;
  rounds_played: number;
  kd_ratio: number;
  acs: number;
  adr: number;
  hs_pct: number;
}

export interface RoundKill {
  id: number;
  match_id: string;
  round_num: number;
  killer_puuid: string;
  killer_name: string;
  killer_agent: string;
  killer_character_id: string;
  killer_team: string;
  victim_puuid: string;
  victim_name: string;
  victim_agent: string;
  victim_character_id: string;
  victim_team: string;
  kill_time_millis: number;
  damage_type: string | null;
  damage_item: string | null;
  weapon_id: string | null;
  weapon_name: string;
  assistants_json: string;
}

export interface MatchFirstBloodLeaders {
  matchId: string;
  slug?: string;
  topFirstBlood: PlayerStat | null;
  topFirstDeath: PlayerStat | null;
}

export interface MatchHighlights {
  topKiller: PlayerStat | null;
  topDamage: PlayerStat | null;
  topAbilities: PlayerStat | null;
  topFirstBlood: PlayerStat | null;
  topFirstDeath: PlayerStat | null;
  topPlanter: PlayerStat | null;
  topDefuser: PlayerStat | null;
}

export interface DuelStat {
  killer_name: string;
  killer_agent: string;
  killer_team: string;
  victim_name: string;
  victim_agent: string;
  victim_team: string;
  kills: number;
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
  most_played_agent_id: string;
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
      (
        SELECT p_name.game_name
        FROM player_stats p_name
        WHERE p_name.puuid = ps.puuid
        ORDER BY p_name.id DESC
        LIMIT 1
      ) as game_name,
      (
        SELECT p_tag.tag_line
        FROM player_stats p_tag
        WHERE p_tag.puuid = ps.puuid
        ORDER BY p_tag.id DESC
        LIMIT 1
      ) as tag_line,
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
      ) as most_played_agent,
      (
        SELECT character_id
        FROM player_stats p3
        WHERE p3.puuid = ps.puuid
        GROUP BY character_id
        ORDER BY COUNT(*) DESC
        LIMIT 1
      ) as most_played_agent_id
    FROM player_stats ps
    GROUP BY ps.puuid
    HAVING matches_played >= ?
    ORDER BY avg_acs DESC
    LIMIT ?
  `
    )
    .all(minMatches, limit) as LeaderboardPlayer[];
}

export function getMatchFirstBloodLeaders(matchIdOrSlug: string): MatchFirstBloodLeaders {
  const match = db
    .prepare("SELECT id, slug FROM matches WHERE id = ? OR slug = ?")
    .get(matchIdOrSlug, matchIdOrSlug) as { id: string; slug: string } | undefined;

  if (!match) {
    return { matchId: matchIdOrSlug, topFirstBlood: null, topFirstDeath: null };
  }

  const topFirstBlood = (db
    .prepare(
      "SELECT * FROM player_stats WHERE match_id = ? ORDER BY first_bloods DESC, kills DESC LIMIT 1"
    )
    .get(match.id) as PlayerStat | undefined) || null;

  const topFirstDeath = (db
    .prepare(
      "SELECT * FROM player_stats WHERE match_id = ? ORDER BY first_deaths DESC, deaths DESC LIMIT 1"
    )
    .get(match.id) as PlayerStat | undefined) || null;

  return {
    matchId: match.id,
    slug: match.slug,
    topFirstBlood,
    topFirstDeath,
  };
}

export function getMatchHighlights(matchIdOrSlug: string): MatchHighlights | null {
  const match = db
    .prepare("SELECT id FROM matches WHERE id = ? OR slug = ?")
    .get(matchIdOrSlug, matchIdOrSlug) as { id: string } | undefined;

  if (!match) return null;

  const players = db
    .prepare("SELECT * FROM player_stats WHERE match_id = ?")
    .all(match.id) as PlayerStat[];

  if (players.length === 0) return null;

  const topKiller = [...players].sort((a, b) => b.kills - a.kills)[0] || null;
  const topDamage = [...players].sort((a, b) => b.damage_dealt - a.damage_dealt)[0] || null;
  const topAbilities = [...players].sort((a, b) => b.total_abilities_cast - a.total_abilities_cast)[0] || null;
  const topFirstBlood = [...players].sort((a, b) => b.first_bloods - a.first_bloods)[0] || null;
  const topFirstDeath = [...players].sort((a, b) => b.first_deaths - a.first_deaths)[0] || null;
  const topPlanter = [...players].filter((p) => p.plants > 0).sort((a, b) => b.plants - a.plants)[0] || null;
  const topDefuser = [...players].filter((p) => p.defuses > 0).sort((a, b) => b.defuses - a.defuses)[0] || null;

  return {
    topKiller,
    topDamage,
    topAbilities,
    topFirstBlood,
    topFirstDeath,
    topPlanter,
    topDefuser,
  };
}

export function getMatchObjectiveLeaders(matchIdOrSlug: string): {
  topPlanter: PlayerStat | null;
  topDefuser: PlayerStat | null;
} {
  const match = db
    .prepare("SELECT id FROM matches WHERE id = ? OR slug = ?")
    .get(matchIdOrSlug, matchIdOrSlug) as { id: string } | undefined;

  if (!match) return { topPlanter: null, topDefuser: null };

  const topPlanter = (db
    .prepare("SELECT * FROM player_stats WHERE match_id = ? AND plants > 0 ORDER BY plants DESC LIMIT 1")
    .get(match.id) as PlayerStat | undefined) || null;

  const topDefuser = (db
    .prepare("SELECT * FROM player_stats WHERE match_id = ? AND defuses > 0 ORDER BY defuses DESC LIMIT 1")
    .get(match.id) as PlayerStat | undefined) || null;

  return { topPlanter, topDefuser };
}

export function getRoundKills(matchIdOrSlug: string, roundNum?: number): RoundKill[] {
  const match = db
    .prepare("SELECT id FROM matches WHERE id = ? OR slug = ?")
    .get(matchIdOrSlug, matchIdOrSlug) as { id: string } | undefined;

  if (!match) return [];

  let query = `
    SELECT
      rk.id,
      rk.match_id,
      rk.round_num,
      rk.killer_puuid,
      COALESCE(pk.game_name, 'Jogador') as killer_name,
      COALESCE(pk.agent_name, 'Desconhecido') as killer_agent,
      COALESCE(pk.character_id, '') as killer_character_id,
      COALESCE(pk.team_name, '') as killer_team,
      rk.victim_puuid,
      COALESCE(pv.game_name, 'Jogador') as victim_name,
      COALESCE(pv.agent_name, 'Desconhecido') as victim_agent,
      COALESCE(pv.character_id, '') as victim_character_id,
      COALESCE(pv.team_name, '') as victim_team,
      rk.kill_time_millis,
      rk.damage_type,
      rk.damage_item,
      rk.assistants_json
    FROM round_kills rk
    LEFT JOIN player_stats pk ON pk.match_id = rk.match_id AND pk.puuid = rk.killer_puuid
    LEFT JOIN player_stats pv ON pv.match_id = rk.match_id AND pv.puuid = rk.victim_puuid
    WHERE rk.match_id = ?
  `;

  const params: any[] = [match.id];
  if (roundNum !== undefined) {
    query += ` AND rk.round_num = ?`;
    params.push(roundNum);
  }

  query += ` ORDER BY rk.round_num ASC, rk.kill_time_millis ASC`;

  const rows = db.prepare(query).all(...params) as any[];

  return rows.map((r) => ({
    ...r,
    weapon_id: r.damage_item || null,
    weapon_name: getWeaponName(r.damage_item),
  }));
}

export function getMatchDuels(matchIdOrSlug: string): DuelStat[] {
  const match = db
    .prepare("SELECT id FROM matches WHERE id = ? OR slug = ?")
    .get(matchIdOrSlug, matchIdOrSlug) as { id: string } | undefined;

  if (!match) return [];

  return db
    .prepare(
      `
      SELECT
        pk.game_name as killer_name,
        pk.agent_name as killer_agent,
        pk.team_name as killer_team,
        pv.game_name as victim_name,
        pv.agent_name as victim_agent,
        pv.team_name as victim_team,
        COUNT(*) as kills
      FROM round_kills rk
      JOIN player_stats pk ON pk.match_id = rk.match_id AND pk.puuid = rk.killer_puuid
      JOIN player_stats pv ON pv.match_id = rk.match_id AND pv.puuid = rk.victim_puuid
      WHERE rk.match_id = ?
      GROUP BY rk.killer_puuid, rk.victim_puuid
      ORDER BY kills DESC
    `
    )
    .all(match.id) as DuelStat[];
}

export function getAllMatchesFirstBloodLeaders(limit = 50): MatchFirstBloodLeaders[] {
  const matches = db
    .prepare("SELECT id, slug FROM matches ORDER BY game_date DESC LIMIT ?")
    .all(limit) as { id: string; slug: string }[];

  return matches.map((m) => getMatchFirstBloodLeaders(m.id));
}

export interface RoundSummary {
  id: number;
  round_num: number;
  winning_team_id: string;
  winning_team_name: string;
  round_result: string | null;
  round_ceremony: string | null;
  plant_site: string | null;
  planter: {
    puuid: string;
    game_name: string;
    agent_name: string;
    character_id: string;
    team_name: string;
  } | null;
  defuser: {
    puuid: string;
    game_name: string;
    agent_name: string;
    character_id: string;
    team_name: string;
  } | null;
  mvp: {
    puuid: string;
    game_name: string;
    agent_name: string;
    character_id: string;
    team_name: string;
    score: number;
    kills: number;
    damage: number;
  } | null;
  first_blood: {
    killer_name: string;
    killer_agent: string;
    killer_character_id: string;
    killer_team: string;
    victim_name: string;
    victim_agent: string;
    victim_character_id: string;
    victim_team: string;
    timing_seconds: number;
    weapon_id: string | null;
    weapon_name: string;
  } | null;
  kills: RoundKill[];
}

export function getMatchRoundsSummary(matchIdOrSlug: string): RoundSummary[] {
  const match = db
    .prepare("SELECT id FROM matches WHERE id = ? OR slug = ?")
    .get(matchIdOrSlug, matchIdOrSlug) as { id: string } | undefined;

  if (!match) return [];

  const rounds = db
    .prepare("SELECT * FROM match_rounds WHERE match_id = ? ORDER BY round_num ASC")
    .all(match.id) as MatchRound[];

  const players = db
    .prepare("SELECT puuid, game_name, agent_name, character_id, team_name FROM player_stats WHERE match_id = ?")
    .all(match.id) as { puuid: string; game_name: string; agent_name: string; character_id: string; team_name: string }[];

  const playerMap = new Map(players.map((p) => [p.puuid, p]));

  const allKills = getRoundKills(match.id);

  const killsByRound = new Map<number, RoundKill[]>();
  for (const k of allKills) {
    const list = killsByRound.get(k.round_num) || [];
    list.push(k);
    killsByRound.set(k.round_num, list);
  }

  const roundMvpsRaw = db
    .prepare(
      `
      SELECT rps.*, p.game_name, p.agent_name, p.character_id, p.team_name
      FROM round_player_stats rps
      JOIN player_stats p ON p.match_id = rps.match_id AND p.puuid = rps.puuid
      WHERE rps.match_id = ?
      ORDER BY rps.round_num ASC, rps.score DESC, rps.damage DESC
    `
    )
    .all(match.id) as any[];

  const mvpByRound = new Map<number, any>();
  for (const row of roundMvpsRaw) {
    if (!mvpByRound.has(row.round_num)) {
      mvpByRound.set(row.round_num, row);
    }
  }

  return rounds.map((r) => {
    const roundKills = killsByRound.get(r.round_num) || [];
    const fbKill = roundKills[0] || null;

    const planterPlayer = r.bomb_planter ? playerMap.get(r.bomb_planter) || null : null;
    const defuserPlayer = r.bomb_defuser ? playerMap.get(r.bomb_defuser) || null : null;
    const mvpRaw = mvpByRound.get(r.round_num) || null;

    return {
      id: r.id,
      round_num: r.round_num,
      winning_team_id: r.winning_team_id,
      winning_team_name: r.winning_team_name,
      round_result: r.round_result,
      round_ceremony: r.round_ceremony,
      plant_site: r.plant_site,
      planter: planterPlayer
        ? {
            puuid: planterPlayer.puuid,
            game_name: planterPlayer.game_name,
            agent_name: planterPlayer.agent_name,
            character_id: planterPlayer.character_id,
            team_name: planterPlayer.team_name,
          }
        : null,
      defuser: defuserPlayer
        ? {
            puuid: defuserPlayer.puuid,
            game_name: defuserPlayer.game_name,
            agent_name: defuserPlayer.agent_name,
            character_id: defuserPlayer.character_id,
            team_name: defuserPlayer.team_name,
          }
        : null,
      mvp: mvpRaw
        ? {
            puuid: mvpRaw.puuid,
            game_name: mvpRaw.game_name,
            agent_name: mvpRaw.agent_name,
            character_id: mvpRaw.character_id,
            team_name: mvpRaw.team_name,
            score: mvpRaw.score,
            kills: mvpRaw.kills,
            damage: mvpRaw.damage,
          }
        : null,
      first_blood: fbKill
        ? {
            killer_name: fbKill.killer_name,
            killer_agent: fbKill.killer_agent,
            killer_character_id: fbKill.killer_character_id,
            killer_team: fbKill.killer_team,
            victim_name: fbKill.victim_name,
            victim_agent: fbKill.victim_agent,
            victim_character_id: fbKill.victim_character_id,
            victim_team: fbKill.victim_team,
            timing_seconds: parseFloat((fbKill.kill_time_millis / 1000).toFixed(1)),
            weapon_id: fbKill.weapon_id,
            weapon_name: fbKill.weapon_name,
          }
        : null,
      kills: roundKills,
    };
  });
}
