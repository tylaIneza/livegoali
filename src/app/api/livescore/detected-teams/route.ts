import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { fetchMatches } from "@/lib/livescoreService";

export async function GET(req: NextRequest) {
  const session = await auth();
  if (!session || !["ADMIN", "SUPER_ADMIN"].includes(session.user.role)) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { searchParams } = new URL(req.url);
  const dateParam = searchParams.get("date"); // YYYY-MM-DD, defaults to today
  const countryCode = searchParams.get("countryCode") ?? "KE";

  const d = dateParam ? new Date(`${dateParam}T00:00:00`) : new Date();
  if (Number.isNaN(d.getTime())) {
    return NextResponse.json({ error: "Invalid date" }, { status: 400 });
  }

  try {
    const matches = await fetchMatches(d.getDate(), d.getMonth() + 1, d.getFullYear(), countryCode);

    const teamsById = new Map<string, { id: string; name: string; league: string }>();
    for (const m of matches) {
      teamsById.set(m.homeId, { id: m.homeId, name: m.homeTeam, league: m.league });
      teamsById.set(m.awayId, { id: m.awayId, name: m.awayTeam, league: m.league });
    }

    const teams = Array.from(teamsById.values()).sort((a, b) => a.name.localeCompare(b.name));
    return NextResponse.json({ teams, matchCount: matches.length });
  } catch (err) {
    console.error("[livescore] detected-teams fetch failed:", err);
    return NextResponse.json({ error: "Failed to reach Livescore — it may be rate-limited or unavailable right now" }, { status: 502 });
  }
}
