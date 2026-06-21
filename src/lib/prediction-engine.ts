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

// ── National / International team ratings ────────────────────────────────────
// Based on FIFA World Rankings + recent tournament performance (2025/2026 era).
// Used for World Cup, international friendlies, qualifiers, etc.
const NATIONAL_RATINGS: Record<string, number> = {
  // Tier 1 — World Cup favourites
  "argentina": 1975,
  "france": 1945,
  "england": 1930,
  "spain": 1925,
  "brazil": 1910,
  "portugal": 1900,
  "netherlands": 1895,
  "germany": 1880,

  // Tier 2 — Strong contenders
  "belgium": 1860,
  "croatia": 1845,
  "italy": 1840,
  "morocco": 1835,
  "colombia": 1825,
  "uruguay": 1820,
  "switzerland": 1815,
  "denmark": 1800,
  "united states": 1790,
  "usa": 1790,
  "japan": 1785,
  "senegal": 1780,
  "mexico": 1775,
  "austria": 1765,
  "south korea": 1760,
  "korea republic": 1760,
  "serbia": 1755,
  "ecuador": 1750,
  "poland": 1745,
  "canada": 1740,
  "ukraine": 1735,
  "turkey": 1725,
  "sweden": 1730,
  "hungary": 1720,
  "wales": 1715,
  "czech republic": 1710,
  "czechia": 1710,
  "scotland": 1705,
  "norway": 1710,
  "australia": 1705,
  "egypt": 1700,

  // Tier 3 — Competitive nations
  "nigeria": 1695,
  "ivory coast": 1690,
  "côte d'ivoire": 1690,
  "cote d'ivoire": 1690,
  "chile": 1685,
  "romania": 1680,
  "iran": 1670,
  "south africa": 1665,
  "algeria": 1660,
  "cameroon": 1655,
  "ghana": 1650,
  "mali": 1645,
  "greece": 1640,
  "slovakia": 1640,
  "russia": 1635,
  "peru": 1635,
  "venezuela": 1625,
  "ireland": 1620,
  "costa rica": 1615,
  "tunisia": 1615,
  "saudi arabia": 1610,
  "iraq": 1600,
  "bolivia": 1595,
  "finland": 1590,
  "paraguay": 1590,
  "indonesia": 1565,
  "new zealand": 1550,
  "jordan": 1545,
  "qatar": 1545,
  "jamaica": 1540,
  "panama": 1540,
  "albania": 1535,
  "north korea": 1500,
  "rwanda": 1440,
  "ethiopia": 1420,
  "zimbabwe": 1410,
  "tanzania": 1410,
  "uganda": 1415,
  "kenya": 1400,
  "zambia": 1420,
  "guinea": 1450,
  "burkina faso": 1445,
};

// Leagues where matches are at a neutral venue (no home advantage)
const NEUTRAL_VENUE_KEYWORDS = ["world cup", "euro", "afcon", "copa america", "olympics", "nations league final", "continental"];

// Home advantage in Elo points (~65-75 is historically accurate in club football)
const HOME_ADVANTAGE = 72;

function isNeutralVenue(leagueName: string): boolean {
  const lower = leagueName.toLowerCase();
  return NEUTRAL_VENUE_KEYWORDS.some((k) => lower.includes(k));
}

function lookupTeamRating(name: string): number | null {
  const key = name.toLowerCase().trim();

  // Check national teams first (more specific match needed to avoid false positives)
  if (NATIONAL_RATINGS[key] !== undefined) return NATIONAL_RATINGS[key];

  // Then club teams
  if (TEAM_RATINGS[key] !== undefined) return TEAM_RATINGS[key];

  // Partial match on national teams
  for (const [k, v] of Object.entries(NATIONAL_RATINGS)) {
    if (key === k || key.includes(k) || k.includes(key)) return v;
  }

  // Partial match on club teams
  for (const [k, v] of Object.entries(TEAM_RATINGS)) {
    if (key.includes(k) || k.includes(key)) return v;
  }

  return null;
}

function isNationalTeam(name: string): boolean {
  const key = name.toLowerCase().trim();
  return Object.keys(NATIONAL_RATINGS).some((k) => key === k || key.includes(k) || k.includes(key));
}

function teamTierLabel(rating: number, international: boolean): string {
  if (international) {
    if (rating >= 1920) return "world-class favourite";
    if (rating >= 1840) return "top-10 nation";
    if (rating >= 1760) return "strong contender";
    if (rating >= 1680) return "competitive nation";
    if (rating >= 1580) return "developing nation";
    return "underdog nation";
  }
  if (rating >= 1900) return "world-class";
  if (rating >= 1820) return "Champions League elite";
  if (rating >= 1750) return "top European";
  if (rating >= 1680) return "solid top-flight";
  if (rating >= 1580) return "mid-table";
  return "lower-tier";
}

// Convert Elo ratings to win/draw/loss probabilities
function eloProbabilities(homeRating: number, awayRating: number, homeAdv: number) {
  const diff = homeRating + homeAdv - awayRating;

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

// International matches score fewer goals on average (1.15/game vs 1.38 for clubs)
function ratingToXGIntl(attackerRating: number, defenderRating: number): number {
  const base = 1.15;
  const diff = (attackerRating - defenderRating) / 400;
  return Math.max(0.25, parseFloat((base + diff * 0.75).toFixed(2)));
}

// Expected goals from rating differential (club matches)
function ratingToXG(attackerRating: number, defenderRating: number): number {
  const base = 1.38;
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
    getTeamRecentForm(match.homeTeamId, 6),
    getTeamRecentForm(match.awayTeamId, 6),
    getH2HStats(match.homeTeamId, match.awayTeamId),
  ]);

  // Detect if this is an international / World Cup match
  const neutral = isNeutralVenue(match.league.name);
  const international = neutral ||
    isNationalTeam(match.homeTeam.name) ||
    isNationalTeam(match.awayTeam.name);
  const homeAdv = neutral ? 0 : HOME_ADVANTAGE; // no home advantage at neutral venues

  // Base ratings — national team table takes priority for international matches
  const homeBaseRating = lookupTeamRating(match.homeTeam.name) ??
    (international ? 1580 : 1550);
  const awayBaseRating = lookupTeamRating(match.awayTeam.name) ??
    (international ? 1580 : 1550);

  // Form adjustment: international form counts slightly more (fewer games played)
  const formWeight = international ? 20 : 15;
  const formAdj = (stats: TeamStats) =>
    stats.played > 0 ? (stats.wins - stats.losses) * formWeight : 0;

  let homeRating = homeBaseRating + formAdj(homeForm);
  let awayRating = awayBaseRating + formAdj(awayForm);

  // H2H adjustment (only when enough head-to-heads exist)
  if (h2h.total >= 3) {
    const h2hDelta = ((h2h.homeWins - h2h.awayWins) / h2h.total) * 30;
    homeRating += h2hDelta;
    awayRating -= h2hDelta;
  }

  const probs = eloProbabilities(homeRating, awayRating, homeAdv);
  const xgFn = international ? ratingToXGIntl : ratingToXG;
  const expectedHomeGoals = xgFn(homeRating, awayRating);
  const expectedAwayGoals = xgFn(awayRating, homeRating);

  // Confidence: known teams = 65% base, international = +5% (more predictable patterns)
  const knownTeams = lookupTeamRating(match.homeTeam.name) !== null &&
                     lookupTeamRating(match.awayTeam.name) !== null;
  const dataQuality = Math.min((homeForm.played + awayForm.played + h2h.total) / 15, 1);
  const baseConf = knownTeams ? (international ? 70 : 65) : 50;
  const confidence = parseFloat((baseConf + dataQuality * 20).toFixed(2));

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
    international,
    neutral,
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
  international: boolean,
  neutral: boolean,
): string {
  const parts: string[] = [];
  const ratingDiff = homeBase - awayBase;
  const homeTier = teamTierLabel(homeBase, international);
  const awayTier = teamTierLabel(awayBase, international);

  // Opening — quality comparison
  if (Math.abs(ratingDiff) >= 200) {
    const stronger = ratingDiff > 0 ? home : away;
    const weaker = ratingDiff > 0 ? away : home;
    const strongerTier = ratingDiff > 0 ? homeTier : awayTier;
    parts.push(`${stronger} are a ${strongerTier} and hold a clear advantage over ${weaker} on the world stage.`);
  } else if (Math.abs(ratingDiff) >= 80) {
    const edge = ratingDiff > 0 ? home : away;
    parts.push(`${edge} have a moderate quality edge but ${ratingDiff > 0 ? away : home} are capable of causing an upset.`);
  } else {
    parts.push(`${home} and ${away} are closely matched ${international ? "nations" : "sides"} — expect a tight and competitive match.`);
  }

  // Neutral venue note
  if (neutral) {
    parts.push(`Playing at a neutral venue removes any home advantage from the equation.`);
  }

  // Recent form from this platform's recorded results
  if (homeForm.played > 0) {
    const pts = homeForm.wins * 3 + homeForm.draws;
    const max = homeForm.played * 3;
    const formStr = homeForm.wins > homeForm.losses ? "good recent form" : homeForm.wins < homeForm.losses ? "poor recent form" : "inconsistent form";
    parts.push(`${home} are in ${formStr} (${pts}/${max} pts from last ${homeForm.played} games).`);
  }
  if (awayForm.played > 0) {
    const pts = awayForm.wins * 3 + awayForm.draws;
    const max = awayForm.played * 3;
    const formStr = awayForm.wins > awayForm.losses ? "good recent form" : awayForm.wins < awayForm.losses ? "poor recent form" : "inconsistent form";
    parts.push(`${away} are in ${formStr} (${pts}/${max} pts from last ${awayForm.played} games).`);
  }

  // H2H
  if (h2h.total >= 3) {
    const dominant = h2h.homeWins > h2h.awayWins ? home : h2h.awayWins > h2h.homeWins ? away : null;
    if (dominant) {
      parts.push(`History favours ${dominant} — they lead the head-to-head ${h2h.homeWins > h2h.awayWins ? h2h.homeWins : h2h.awayWins}–${h2h.homeWins > h2h.awayWins ? h2h.awayWins : h2h.homeWins} (${h2h.draws} draws) in the last ${h2h.total} meetings.`);
    } else {
      parts.push(`The head-to-head is evenly balanced over the last ${h2h.total} meetings (${h2h.homeWins}W–${h2h.draws}D–${h2h.awayWins}W).`);
    }
  }

  // xG and verdict
  parts.push(`Expected goals: ${home} ${xgHome.toFixed(1)} – ${xgAway.toFixed(1)} ${away}.`);

  const context = international
    ? (neutral ? "tournament form, FIFA ranking, and H2H record" : "FIFA ranking, home support, form, and H2H record")
    : "team quality, home advantage, recent form, and H2H record";
  const recLabel = recommendation === "HOME_WIN"
    ? `${home} to win (${probs.homeWin.toFixed(0)}%)`
    : recommendation === "AWAY_WIN"
    ? `${away} to win (${probs.awayWin.toFixed(0)}%)`
    : `a draw (${probs.draw.toFixed(0)}%)`;
  parts.push(`Our model predicts ${recLabel}, based on ${context}.`);

  return parts.join(" ");
}
