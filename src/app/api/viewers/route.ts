import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { heartbeat, leave, getAllViewers, getViewers } from "@/lib/viewerStore";

export async function POST(req: NextRequest) {
  try {
    const { action, matchId, sessionId } = await req.json();
    if (!matchId || !sessionId) return NextResponse.json({ ok: false });

    let isUser = false;
    try {
      const session = await auth();
      isUser = !!session?.user;
    } catch {}

    if (action === "heartbeat") heartbeat(matchId, sessionId, isUser);
    if (action === "leave") leave(matchId, sessionId);

    return NextResponse.json({ ok: true, ...getViewers(matchId) });
  } catch {
    return NextResponse.json({ ok: false });
  }
}

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const matchId = searchParams.get("matchId");

  if (matchId) return NextResponse.json(getViewers(matchId));
  return NextResponse.json(getAllViewers());
}
