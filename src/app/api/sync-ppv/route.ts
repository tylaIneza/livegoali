import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { runPpvSync, getPpvSyncStatus } from "@/lib/sync-ppv";

async function isAdmin() {
  const session = await auth();
  const role = session?.user?.role;
  return role === "ADMIN" || role === "SUPER_ADMIN";
}

export async function GET() {
  if (!await isAdmin()) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const status = await getPpvSyncStatus();
  return NextResponse.json({ status });
}

export async function POST() {
  if (!await isAdmin()) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  try {
    const result = await runPpvSync();
    return NextResponse.json({ ok: true, ...result });
  } catch (err) {
    const message = err instanceof Error ? err.message : "Sync failed";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
