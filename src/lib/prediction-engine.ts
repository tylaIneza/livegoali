import { prisma } from "@/lib/prisma";

interface TeamStats {
  wins: number;
  draws: number;
  losses: number;
  goalsFor: number;
  goalsAgainst: number;
  played: number;
}

// Elo-style strength ratings (1000–2000 scale) based on real-world club quality.
// Higher = stronger. 1550 ≈ average top-flight team.
const TEAM_RATINGS: Record<string, number> = {
  // ── Premier League ──────────────────────────────────────────────────────────
  "manchester city": 1960,
  "liverpool": 1925,
  "arsenal": 1915,
  "chelsea": 1810,
  "manchester united": 1770,
  "tottenham hotspur": 1750,
  "tottenham": 1750,
  "spurs": 1750,
  "newcastle united": 1740,
  "newcastle": 1740,
  "aston villa": 1730,
  "brighton": 1690,
  "brighton & hove albion": 1690,
  "nottingham forest": 1620,
  "west ham united": 1640,
  "west ham": 1640,
  "brentford": 1590,
  "wolves": 1600,
  "wolverhampton wanderers": 1600,
  "fulham": 1570,
  "crystal palace": 1550,
  "everton": 1545,
  "bournemouth": 1540,
  "leicester city": 1545,
  "leicester": 1545,
  "ipswich town": 1500,
  "ipswich": 1500,
  "leeds united": 1525,
  "leeds": 1525,
  "southampton": 1480,
  "sheffield united": 1420,
  "burnley": 1435,
  "luton town": 1430,

  // ── La Liga ─────────────────────────────────────────────────────────────────
  "real madrid": 1990,
  "barcelona": 1905,
  "atletico madrid": 1845,
  "girona": 1700,
  "real sociedad": 1695,
  "athletic bilbao": 1685,
  "athletic club": 1685,
  "villarreal": 1695,
  "real betis": 1665,
  "sevilla": 1665,
  "celta vigo": 1555,
  "valencia": 1575,
  "osasuna": 1545,
  "getafe": 1525,
  "rayo vallecano": 1515,
  "mallorca": 1525,
  "las palmas": 1490,
  "deportivo alaves": 1480,
  "alaves": 1480,
  "granada": 1460,
  "cadiz": 1445,

  // ── Bundesliga ───────────────────────────────────────────────────────────────
  "bayer leverkusen": 1885,
  "bayer 04 leverkusen": 1885,
  "bayern munich": 1965,
  "fc bayern munchen": 1965,
  "fc bayern münchen": 1965,
  "borussia dortmund": 1830,
  "rb leipzig": 1815,
  "rasenballsport leipzig": 1815,
  "vfb stuttgart": 1785,
  "stuttgart": 1785,
  "eintracht frankfurt": 1725,
  "sc freiburg": 1675,
  "freiburg": 1675,
  "union berlin": 1590,
  "1. fc union berlin": 1590,
  "werder bremen": 1595,
  "sv werder bremen": 1595,
  "hoffenheim": 1585,
  "tsg hoffenheim": 1585,
  "wolfsburg": 1575,
  "vfl wolfsburg": 1575,
  "borussia mönchengladbach": 1585,
  "borussia monchengladbach": 1585,
  "mainz": 1555,
  "1. fsv mainz 05": 1555,
  "augsburg": 1490,
  "fc augsburg": 1490,
  "fc koln": 1480,
  "1. fc koln": 1480,
  "heidenheim": 1505,
  "1. fc heidenheim": 1505,
  "darmstadt": 1440,
  "sv darmstadt 98": 1440,

  // ── Serie A ──────────────────────────────────────────────────────────────────
  "inter milan": 1885,
  "internazionale": 1885,
  "fc internazionale": 1885,
  "napoli": 1805,
  "juventus": 1795,
  "atalanta": 1815,
  "ac milan": 1765,
  "milan": 1765,
  "roma": 1745,
  "as roma": 1745,
  "lazio": 1735,
  "ss lazio": 1735,
  "fiorentina": 1695,
  "bologna": 1680,
  "torino": 1595,
  "monza": 1545,
  "udinese": 1530,
  "genoa": 1515,
  "cagliari": 1515,
  "empoli": 1505,
  "lecce": 1490,
  "sassuolo": 1530,
  "hellas verona": 1480,
  "verona": 1480,
  "frosinone": 1460,
  "salernitana": 1435,

  // ── Ligue 1 ──────────────────────────────────────────────────────────────────
  "paris saint-germain": 1910,
  "psg": 1910,
  "paris sg": 1910,
  "brest": 1640,
  "stade brestois": 1640,
  "monaco": 1765,
  "as monaco": 1765,
  "lille": 1745,
  "losc lille": 1745,
  "marseille": 1735,
  "olympique marseille": 1735,
  "olympique de marseille": 1735,
  "lyon": 1715,
  "olympique lyonnais": 1715,
  "nice": 1695,
  "ogc nice": 1695,
  "lens": 1675,
  "rc lens": 1675,
  "rennes": 1655,
  "stade rennais": 1655,
  "reims": 1575,
  "stade de reims": 1575,
  "strasbourg": 1575,
  "rc strasbourg": 1575,
  "toulouse": 1565,
  "nantes": 1555,
  "montpellier": 1545,
  "lorient": 1510,
  "metz": 1490,
  "le havre": 1500,
  "clermont": 1470,

  // ── Portugal ────────────────────────────────────────────────────────────────
  "benfica": 1825,
  "sl benfica": 1825,
  "porto": 1815,
  "fc porto": 1815,
  "sporting cp": 1795,
  "sporting lisbon": 1795,
  "sporting clube de portugal": 1795,
  "braga": 1655,
  "sc braga": 1655,
  "vitoria sc": 1545,

  // ── Netherlands ─────────────────────────────────────────────────────────────
  "psv eindhoven": 1805,
  "psv": 1805,
  "feyenoord": 1800,
  "ajax": 1785,
  "afc ajax": 1785,
  "az alkmaar": 1685,
  "az": 1685,
  "fc twente": 1625,
  "twente": 1625,
  "fc utrecht": 1585,
  "utrecht": 1585,

  // ── Scotland ────────────────────────────────────────────────────────────────
  // ── Belgium ─────────────────────────────────────────────────────────────────
  "club brugge": 1725,
  "anderlecht": 1675,
  "rsc anderlecht": 1675,
  "union saint-gilloise": 1660,
  "gent": 1625,
  "kaa gent": 1625,

  // ── Turkey ──────────────────────────────────────────────────────────────────
  "galatasaray": 1735,
  "fenerbahce": 1710,
  "fenerbahçe": 1710,
  "besiktas": 1660,
  "beşiktaş": 1660,
  "trabzonspor": 1595,

  // ── Other CL regulars ───────────────────────────────────────────────────────
  "red bull salzburg": 1655,
  "fc salzburg": 1655,
  "shakhtar donetsk": 1685,
  "dinamo zagreb": 1615,
  "young boys": 1585,
  "bsc young boys": 1585,
};

// Home advantage in Elo points (~65-75 is historically accurate in football)
const HOME_ADVANTAGE = 72;

function lookupTeamRating(name: string): number | null {
  const key = name.toLowerCase().trim();
  if (TEAM_RATINGS[key] !== undefined) return TEAM_RATINGS[key];

  // Partial match: check if DB name contains a known key or vice versa
  for (const [k, v] of Object.entries(TEAM_RATINGS)) {
    if (key.includes(k) || k.includes(key)) return v;
  }

  return null;
}

function teamTierLabel(rating: number): string {
  if (rating >= 1900) return "world-class";
  if (rating >= 1820) return "Champions League elite";
  if (rating >= 1750) return "top European";
  if (rating >= 1680) return "solid top-flight";
  if (rating >= 1580) return "mid-table";
  return "lower-tier";
}

// Convert Elo ratings to win/draw/loss probabilities
function eloProbabilities(homeRating: number, awayRating: number) {
  const diff = homeRating + HOME_ADVANTAGE - awayRating;

  // Logistic Elo expected score
  const homeExpect = 1 / (1 + Math.pow(10, -diff / 400));

  // Draw probability shrinks as rating gap grows (realistic for football)
  const absDiff = Math.abs(diff - HOME_ADVANTAGE); // compare pure skill gap
  const drawProb = Math.max(0.11, 0.28 - absDiff / 4200);

  const homeWin = homeExpect * (1 - drawProb);
  const awayWin = (1 - homeExpect) * (1 - drawProb);

  return {
    homeWin: parseFloat((homeWin * 100).toFixed(2)),
    draw: parseFloat((drawProb * 100).toFixed(2)),
    awayWin: parseFloat((awayWin * 100).toFixed(2)),
  };
}

// Expected goals from rating differential
function ratingToXG(attackerRating: number, defenderRating: number): number {
  const base = 1.38; // average top-flight goals per game per team
  const diff = (attackerRating - defenderRating) / 400;
  return Math.max(0.35, parseFloat((base + diff * 0.9).toFixed(2)));
}

async function getTeamRecentForm(teamId: string, limit = 5): Promise<TeamStats> {
  const matches = await prisma.match.findMany({
    where: {
      OR: [{ homeTeamId: teamId }, { awayTeamId: teamId }],
      status: "FINISHED",
    },
    orderBy: { scheduledAt: "desc" },
    take: limit,
    select: { homeTeamId: true, homeScore: true, awayScore: true },
  });

  let wins = 0, draws = 0, losses = 0, goalsFor = 0, goalsAgainst = 0;
  for (const m of matches) {
    const isHome = m.homeTeamId === teamId;
    const gf = isHome ? (m.homeScore ?? 0) : (m.awayScore ?? 0);
    const ga = isHome ? (m.awayScore ?? 0) : (m.homeScore ?? 0);
    goalsFor += gf; goalsAgainst += ga;
    if (gf > ga) wins++;
    else if (gf === ga) draws++;
    else losses++;
  }
  return { wins, draws, losses, goalsFor, goalsAgainst, played: matches.length };
}

async function getH2HStats(homeTeamId: string, awayTeamId: string) {
  const matches = await prisma.match.findMany({
    where: {
      OR: [
        { homeTeamId, awayTeamId },
        { homeTeamId: awayTeamId, awayTeamId: homeTeamId },
      ],
      status: "FINISHED",
    },
    orderBy: { scheduledAt: "desc" },
    take: 6,
    select: { homeTeamId: true, homeScore: true, awayScore: true },
  });

  let homeWins = 0, draws = 0, awayWins = 0;
  for (const m of matches) {
    const hs = m.homeScore ?? 0, as_ = m.awayScore ?? 0;
    if (m.homeTeamId === homeTeamId) {
      if (hs > as_) homeWins++; else if (hs === as_) draws++; else awayWins++;
    } else {
      if (as_ > hs) homeWins++; else if (hs === as_) draws++; else awayWins++;
    }
  }
  return { homeWins, draws, awayWins, total: matches.length };
}

export async function generateAIPrediction(matchId: string) {
  const match = await prisma.match.findUnique({
    where: { id: matchId },
    include: {
      homeTeam: { select: { id: true, name: true } },
      awayTeam: { select: { id: true, name: true } },
      league: { select: { name: true } },
    },
  });
  if (!match) throw new Error("Match not found");

  const [homeForm, awayForm, h2h] = await Promise.all([
    getTeamRecentForm(match.homeTeamId, 5),
    getTeamRecentForm(match.awayTeamId, 5),
    getH2HStats(match.homeTeamId, match.awayTeamId),
  ]);

  // Base ratings from the knowledge table
  const homeBaseRating = lookupTeamRating(match.homeTeam.name) ?? 1550;
  const awayBaseRating = lookupTeamRating(match.awayTeam.name) ?? 1550;

  // Adjust ratings by recent form (+15 per win, -15 per loss)
  const formAdj = (stats: TeamStats) =>
    stats.played > 0 ? (stats.wins - stats.losses) * 15 : 0;

  let homeRating = homeBaseRating + formAdj(homeForm);
  let awayRating = awayBaseRating + formAdj(awayForm);

  // H2H adjustment (only when enough games to be meaningful)
  if (h2h.total >= 3) {
    const h2hDelta = ((h2h.homeWins - h2h.awayWins) / h2h.total) * 30;
    homeRating += h2hDelta;
    awayRating -= h2hDelta;
  }

  const probs = eloProbabilities(homeRating, awayRating);
  const expectedHomeGoals = ratingToXG(homeRating, awayRating);
  const expectedAwayGoals = ratingToXG(awayRating, homeRating);

  // Confidence: 65% baseline if both teams are in our knowledge base, boosted by local data
  const knownTeams = lookupTeamRating(match.homeTeam.name) !== null &&
                     lookupTeamRating(match.awayTeam.name) !== null;
  const dataQuality = Math.min((homeForm.played + awayForm.played + h2h.total) / 15, 1);
  const confidence = parseFloat(((knownTeams ? 65 : 50) + dataQuality * 20).toFixed(2));

  let recommendation: "HOME_WIN" | "DRAW" | "AWAY_WIN";
  if (probs.homeWin >= probs.awayWin && probs.homeWin >= probs.draw) {
    recommendation = "HOME_WIN";
  } else if (probs.awayWin >= probs.homeWin && probs.awayWin >= probs.draw) {
    recommendation = "AWAY_WIN";
  } else {
    recommendation = "DRAW";
  }

  const aiExplanation = buildExplanation(
    match.homeTeam.name, match.awayTeam.name,
    homeBaseRating, awayBaseRating,
    homeForm, awayForm, h2h,
    recommendation,
    expectedHomeGoals, expectedAwayGoals,
    probs,
  );

  return prisma.prediction.upsert({
    where: { matchId },
    create: {
      matchId,
      homeWinProb: probs.homeWin,
      drawProb: probs.draw,
      awayWinProb: probs.awayWin,
      expectedHomeGoals,
      expectedAwayGoals,
      confidence,
      aiExplanation,
      recommendation,
    },
    update: {
      homeWinProb: probs.homeWin,
      drawProb: probs.draw,
      awayWinProb: probs.awayWin,
      expectedHomeGoals,
      expectedAwayGoals,
      confidence,
      aiExplanation,
      recommendation,
    },
  });
}

function buildExplanation(
  home: string, away: string,
  homeBase: number, awayBase: number,
  homeForm: TeamStats, awayForm: TeamStats,
  h2h: { homeWins: number; draws: number; awayWins: number; total: number },
  recommendation: string,
  xgHome: number, xgAway: number,
  probs: { homeWin: number; draw: number; awayWin: number },
): string {
  const parts: string[] = [];

  // Team quality description
  const homeTier = teamTierLabel(homeBase);
  const awayTier = teamTierLabel(awayBase);
  const ratingDiff = homeBase - awayBase;

  if (Math.abs(ratingDiff) >= 150) {
    const stronger = ratingDiff > 0 ? home : away;
    const weaker = ratingDiff > 0 ? away : home;
    const strongerTier = ratingDiff > 0 ? homeTier : awayTier;
    parts.push(`${stronger} (${strongerTier} side) are significantly stronger than ${weaker} on paper, with a rating gap of ${Math.abs(ratingDiff)} points.`);
  } else if (Math.abs(ratingDiff) >= 60) {
    const edge = ratingDiff > 0 ? home : away;
    parts.push(`${edge} hold a moderate quality edge, though both sides are evenly matched enough to make this competitive.`);
  } else {
    parts.push(`${home} and ${away} are closely matched — this is expected to be a tight contest.`);
  }

  // Form
  if (homeForm.played > 0) {
    const pts = homeForm.wins * 3 + homeForm.draws;
    const max = homeForm.played * 3;
    parts.push(`${home} earned ${pts}/${max} points in their last ${homeForm.played} games.`);
  }
  if (awayForm.played > 0) {
    const pts = awayForm.wins * 3 + awayForm.draws;
    const max = awayForm.played * 3;
    parts.push(`${away} earned ${pts}/${max} points in their last ${awayForm.played} games.`);
  }

  // H2H
  if (h2h.total >= 3) {
    parts.push(`Head-to-head (last ${h2h.total}): ${home} ${h2h.homeWins}W – ${h2h.draws}D – ${h2h.awayWins}W ${away}.`);
  }

  // xG and verdict
  parts.push(`xG projection: ${home} ${xgHome.toFixed(1)} – ${xgAway.toFixed(1)} ${away}.`);

  const recLabel = recommendation === "HOME_WIN" ? `${home} to win (${probs.homeWin.toFixed(0)}%)`
    : recommendation === "AWAY_WIN" ? `${away} to win (${probs.awayWin.toFixed(0)}%)`
    : `a draw (${probs.draw.toFixed(0)}%)`;
  parts.push(`Our model predicts ${recLabel}, factoring in team quality, home advantage, form, and H2H record.`);

  return parts.join(" ");
}
