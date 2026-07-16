import { NextResponse } from "next/server";
import { getFootballStreams } from "@/lib/ppv-football";

export async function GET() {
  try {
    const { matches, stale } = await getFootballStreams();
    return NextResponse.json({ success: true, matches, stale });
  } catch {
    return NextResponse.json(
      { success: false, matches: [], error: "Football streams are temporarily unavailable." },
      { status: 503 },
    );
  }
}
