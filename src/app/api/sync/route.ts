import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { runLiveSync, runDailySync, getSyncStatus } from "@/lib/sync-football";

async function isAdmin() {
  const session = await auth();
  const role = session?.user?.role;
  return role === "ADMIN" || role === "SUPER_ADMIN";
}

export async function GET() {
  if (!await isAdmin()) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const status = await getSyncStatus();
  return NextResponse.json(status);
}

export async function POST(req: NextRequest) {
  if (!await isAdmin()) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { type } = await req.json().catch(() => ({ type: "live" }));

  try {
    if (type === "daily") {
      const result = await runDailySync();
      return NextResponse.json({ ok: true, ...result });
    }
    const result = await runLiveSync();
    return NextResponse.json({ ok: true, ...result });
  } catch (err) {
    const message = err instanceof Error ? err.message : "Sync failed";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
