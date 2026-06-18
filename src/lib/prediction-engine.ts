import { prisma } from "@/lib/prisma";

interface TeamStats {
  wins: number;
  draws: number;
  losses: number;
  goalsFor: number;
  goalsAgainst: number;
  played: number;
}

async function getTeamRecentForm(teamId: string, isHome: boolean, limit = 5): Promise<TeamStats> {
  const where = isHome
    ? { homeTeamId: teamId, status: "FINISHED" as const }
    : { awayTeamId: teamId, status: "FINISHED" as const };

  const matches = await prisma.match.findMany({
    where,
    orderBy: { scheduledAt: "desc" },
    take: limit,
    select: {
      homeTeamId: true,
      awayTeamId: true,
      homeScore: true,
      awayScore: true,
    },
  });

  let wins = 0, draws = 0, losses = 0, goalsFor = 0, goalsAgainst = 0;

  for (const m of matches) {
    const isHomeTeam = m.homeTeamId === teamId;
    const scored = isHomeTeam ? (m.homeScore ?? 0) : (m.awayScore ?? 0);
    const conceded = isHomeTeam ? (m.awayScore ?? 0) : (m.homeScore ?? 0);
    goalsFor += scored;
    goalsAgainst += conceded;
    if (scored > conceded) wins++;
    else if (scored === conceded) draws++;
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
    take: 5,
    select: { homeTeamId: true, homeScore: true, awayScore: true },
  });

  let homeWins = 0, draws = 0, awayWins = 0;
  let homeGoals = 0, awayGoals = 0;

  for (const m of matches) {
    const hs = m.homeScore ?? 0;
    const as_ = m.awayScore ?? 0;
    if (m.homeTeamId === homeTeamId) {
      homeGoals += hs; awayGoals += as_;
      if (hs > as_) homeWins++;
      else if (hs === as_) draws++;
      else awayWins++;
    } else {
      homeGoals += as_; awayGoals += hs;
      if (as_ > hs) homeWins++;
      else if (hs === as_) draws++;
      else awayWins++;
    }
  }

  return { homeWins, draws, awayWins, homeGoals, awayGoals, total: matches.length };
}

function calculateXG(form: TeamStats, h2hGoals: number, h2hPlayed: number): number {
  if (form.played === 0) return 1.2;
  const formXG = form.goalsFor / Math.max(form.played, 1);
  const h2hXG = h2hPlayed > 0 ? h2hGoals / h2hPlayed : formXG;
  return formXG * 0.7 + h2hXG * 0.3;
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

  const [homeFormAll, awayFormAll, homeFormRecent, awayFormRecent, h2h] = await Promise.all([
    getTeamRecentForm(match.homeTeamId, true, 10),
    getTeamRecentForm(match.awayTeamId, false, 10),
    getTeamRecentForm(match.homeTeamId, true, 5),
    getTeamRecentForm(match.awayTeamId, false, 5),
    getH2HStats(match.homeTeamId, match.awayTeamId),
  ]);

  const homeStanding = await prisma.standing.findFirst({
    where: { teamId: match.homeTeamId, leagueId: match.leagueId },
    select: { position: true, points: true },
  });

  const awayStanding = await prisma.standing.findFirst({
    where: { teamId: match.awayTeamId, leagueId: match.leagueId },
    select: { position: true, points: true },
  });

  // Calculate form scores (0–1)
  const homeFormScore = homeFormRecent.played > 0
    ? (homeFormRecent.wins * 3 + homeFormRecent.draws) / (homeFormRecent.played * 3)
    : 0.5;
  const awayFormScore = awayFormRecent.played > 0
    ? (awayFormRecent.wins * 3 + awayFormRecent.draws) / (awayFormRecent.played * 3)
    : 0.5;

  // Home advantage factor
  const homeAdvantage = 0.1;

  // H2H factor
  const h2hFactor = h2h.total > 0
    ? (h2h.homeWins / h2h.total) - (h2h.awayWins / h2h.total)
    : 0;

  // League position factor
  const homePositionFactor = homeStanding
    ? Math.max(0, (20 - homeStanding.position) / 20) * 0.1
    : 0;
  const awayPositionFactor = awayStanding
    ? Math.max(0, (20 - awayStanding.position) / 20) * 0.1
    : 0;

  // Raw scores
  const homeScore = 0.5 + homeFormScore * 0.4 + homeAdvantage + h2hFactor * 0.15 + homePositionFactor;
  const awayScore = 0.5 + awayFormScore * 0.4 - homeAdvantage + (-h2hFactor) * 0.15 + awayPositionFactor;
  const drawFactor = 1 - Math.abs(homeScore - awayScore) * 0.5;

  // Normalize to probabilities
  const rawTotal = homeScore + awayScore + drawFactor;
  let homeWinProb = (homeScore / rawTotal) * 100;
  let awayWinProb = (awayScore / rawTotal) * 100;
  let drawProb = (drawFactor / rawTotal) * 100;

  // Ensure sum = 100
  const sum = homeWinProb + awayWinProb + drawProb;
  homeWinProb = (homeWinProb / sum) * 100;
  awayWinProb = (awayWinProb / sum) * 100;
  drawProb = (drawProb / sum) * 100;

  // Expected goals
  const expectedHomeGoals = calculateXG(homeFormRecent, h2h.homeGoals, h2h.total);
  const expectedAwayGoals = calculateXG(awayFormRecent, h2h.awayGoals, h2h.total);

  // Confidence based on data quality
  const dataQuality = Math.min(
    (homeFormRecent.played + awayFormRecent.played + h2h.total) / 15,
    1
  );
  const confidence = 50 + dataQuality * 35;

  // Determine recommendation
  let recommendation: "HOME_WIN" | "DRAW" | "AWAY_WIN";
  if (homeWinProb >= awayWinProb && homeWinProb >= drawProb) {
    recommendation = "HOME_WIN";
  } else if (awayWinProb >= homeWinProb && awayWinProb >= drawProb) {
    recommendation = "AWAY_WIN";
  } else {
    recommendation = "DRAW";
  }

  const aiExplanation = buildExplanation(
    match.homeTeam.name,
    match.awayTeam.name,
    homeFormRecent,
    awayFormRecent,
    h2h,
    recommendation,
    expectedHomeGoals,
    expectedAwayGoals
  );

  const prediction = await prisma.prediction.upsert({
    where: { matchId },
    create: {
      matchId,
      homeWinProb: parseFloat(homeWinProb.toFixed(2)),
      drawProb: parseFloat(drawProb.toFixed(2)),
      awayWinProb: parseFloat(awayWinProb.toFixed(2)),
      expectedHomeGoals: parseFloat(expectedHomeGoals.toFixed(2)),
      expectedAwayGoals: parseFloat(expectedAwayGoals.toFixed(2)),
      confidence: parseFloat(confidence.toFixed(2)),
      aiExplanation,
      recommendation,
    },
    update: {
      homeWinProb: parseFloat(homeWinProb.toFixed(2)),
      drawProb: parseFloat(drawProb.toFixed(2)),
      awayWinProb: parseFloat(awayWinProb.toFixed(2)),
      expectedHomeGoals: parseFloat(expectedHomeGoals.toFixed(2)),
      expectedAwayGoals: parseFloat(expectedAwayGoals.toFixed(2)),
      confidence: parseFloat(confidence.toFixed(2)),
      aiExplanation,
      recommendation,
    },
  });

  return prediction;
}

function buildExplanation(
  home: string,
  away: string,
  homeForm: TeamStats,
  awayForm: TeamStats,
  h2h: { homeWins: number; draws: number; awayWins: number; total: number },
  recommendation: string,
  xgHome: number,
  xgAway: number
): string {
  const parts: string[] = [];

  if (homeForm.played > 0) {
    parts.push(`${home} has won ${homeForm.wins} of their last ${homeForm.played} home games, scoring ${homeForm.goalsFor} goals.`);
  }

  if (awayForm.played > 0) {
    parts.push(`${away} has won ${awayForm.wins} of their last ${awayForm.played} away games.`);
  }

  if (h2h.total > 0) {
    parts.push(`Head-to-head: ${home} won ${h2h.homeWins}, Drew ${h2h.draws}, ${away} won ${h2h.awayWins} in last ${h2h.total} meetings.`);
  }

  parts.push(`Expected goals: ${home} ${xgHome.toFixed(1)} vs ${away} ${xgAway.toFixed(1)}.`);

  const recLabel = recommendation === "HOME_WIN" ? `${home} win` : recommendation === "AWAY_WIN" ? `${away} win` : "a draw";
  parts.push(`Our model favors ${recLabel} based on current form, home advantage, and historical data.`);

  return parts.join(" ");
}
