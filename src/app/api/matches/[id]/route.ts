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
    select: { status: true },
  });
  if (!current) return NextResponse.json({ error: "Not found" }, { status: 404 });

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const data: Record<string, any> = {};

  // ── Status ──────────────────────────────────────────────────
  if (body.status !== undefined) {
    data.status = body.status;

    if (body.status === "LIVE" && current.status !== "LIVE") {
      data.startedAt = new Date();
    }
  }

  // ── Score ────────────────────────────────────────────────────
  if (body.homeScore !== undefined) data.homeScore = body.homeScore;
  if (body.awayScore !== undefined) data.awayScore = body.awayScore;

  // ── Kickoff time ─────────────────────────────────────────────
  if (body.scheduledAt !== undefined) data.scheduledAt = new Date(body.scheduledAt);

  // ── Stream / event fields ────────────────────────────────────
  // Accept either a bare URL or a full <iframe> tag — store only the URL.
  if (body.streamUrl !== undefined) {
    const raw: string = body.streamUrl ?? "";
    if (raw.trimStart().startsWith("<")) {
      const m = raw.match(/src="([^"]+)"/);
      data.streamUrl = m?.[1] ?? raw;
    } else {
      data.streamUrl = raw;
    }
  }
  if (body.streamType !== undefined) data.streamType = body.streamType;
  if (body.streamQuality !== undefined) data.streamQuality = body.streamQuality;
  if (body.title !== undefined) data.title = body.title;
  if (body.participant1 !== undefined) data.participant1 = body.participant1;
  if (body.participant2 !== undefined) data.participant2 = body.participant2;

  // ── Other fields ─────────────────────────────────────────────
  if (body.isFeatured !== undefined) data.isFeatured = body.isFeatured;
  if (body.isPublished !== undefined) data.isPublished = body.isPublished;
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

  // Read views before deletion so we can persist them permanently
  const match = await prisma.match.findUnique({
    where: { id },
    select: { views: true },
  });

  if (match && match.views > 0) {
    const month = new Date().toISOString().slice(0, 7); // YYYY-MM
    // Atomic upsert: adds to running total, never loses counts on concurrent deletes
    await Promise.all([
      prisma.$executeRaw`
        INSERT INTO Settings (id, \`key\`, value, updatedAt)
        VALUES (UUID(), 'match_views_archived_total', ${String(match.views)}, NOW())
        ON DUPLICATE KEY UPDATE value = CAST(CAST(value AS UNSIGNED) + ${match.views} AS CHAR), updatedAt = NOW()
      `,
      prisma.$executeRaw`
        INSERT INTO Settings (id, \`key\`, value, updatedAt)
        VALUES (UUID(), ${`match_views_month_${month}`}, ${String(match.views)}, NOW())
        ON DUPLICATE KEY UPDATE value = CAST(CAST(value AS UNSIGNED) + ${match.views} AS CHAR), updatedAt = NOW()
      `,
    ]);
  }

  await prisma.match.delete({ where: { id } });
  return NextResponse.json({ success: true });
}
