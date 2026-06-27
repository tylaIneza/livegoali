import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { auth } from "@/lib/auth";

export async function GET(_req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const match = await prisma.match.findUnique({
    where: { id },
    select: { id: true, status: true },
  });
  if (!match) return NextResponse.json({ error: "Not found" }, { status: 404 });
  return NextResponse.json(match);
}

export async function PATCH(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const session = await auth();
  if (!session || !["ADMIN", "SUPER_ADMIN"].includes(session.user.role)) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { id } = await params;
  const body = await req.json();

  // Fetch current state so we can react to transitions
  const current = await prisma.match.findUnique({
    where: { id },
    select: { status: true, matchMinute: true, scheduledAt: true },
  });
  if (!current) return NextResponse.json({ error: "Not found" }, { status: 404 });

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const data: Record<string, any> = {};

  // ── Status ──────────────────────────────────────────────────
  if (body.status !== undefined) {
    data.status = body.status;

    const goingLive = body.status === "LIVE" && current.status !== "LIVE";
    if (goingLive) {
      if (current.status === "HALFTIME") {
        // Second half — timer starts NOW (halftime just ended)
        data.startedAt = new Date();
        data.matchMinute = 45;
      } else {
        // First half — use scheduledAt so the counter starts exactly at kickoff
        // even if admin sets LIVE early to prepare streams
        data.startedAt = current.scheduledAt;
        data.matchMinute = null;
      }
    }
  }

  // ── Score ────────────────────────────────────────────────────
  if (body.homeScore !== undefined) data.homeScore = body.homeScore;
  if (body.awayScore !== undefined) data.awayScore = body.awayScore;

  // ── Minute recalibration ─────────────────────────────────────
  // When admin manually sends matchMinute (not during a LIVE transition),
  // adjust startedAt so the auto-timer shows the desired minute immediately.
  const isLiveTransition = body.status === "LIVE" && current.status !== "LIVE";
  if (body.matchMinute !== undefined && !isLiveTransition) {
    if (typeof body.matchMinute === "number" && body.matchMinute >= 0) {
      const base = current.matchMinute ?? 0; // 0 = first half, 45 = second half
      const desiredElapsed = Math.max(0, body.matchMinute - base - 1);
      data.startedAt = new Date(Date.now() - desiredElapsed * 60_000);
      // Keep the half-base (matchMinute in DB) unchanged — only adjust startedAt
    }
  }

  // ── Kickoff time ─────────────────────────────────────────────
  if (body.scheduledAt !== undefined) data.scheduledAt = new Date(body.scheduledAt);

  // ── Other fields ─────────────────────────────────────────────
  if (body.isFeatured !== undefined) data.isFeatured = body.isFeatured;
  if (body.enableComments !== undefined) data.enableComments = body.enableComments;
  if (body.enableChat !== undefined) data.enableChat = body.enableChat;
  if (body.enablePrediction !== undefined) data.enablePrediction = body.enablePrediction;

  const match = await prisma.match.update({ where: { id }, data });
  return NextResponse.json(match);
}

export async function DELETE(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const session = await auth();
  if (!session || !["ADMIN", "SUPER_ADMIN"].includes(session.user.role)) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { id } = await params;
  await prisma.match.delete({ where: { id } });

  return NextResponse.json({ success: true });
}
