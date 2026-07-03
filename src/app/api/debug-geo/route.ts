import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";

export async function GET(req: NextRequest) {
  const session = await auth();
  if (!session || !["ADMIN", "SUPER_ADMIN"].includes(session.user.role)) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const ip =
    req.headers.get("cf-connecting-ip") ??
    req.headers.get("x-forwarded-for")?.split(",")[0].trim() ??
    req.headers.get("x-real-ip") ??
    "not found";

  const headers: Record<string, string> = {};
  req.headers.forEach((value, key) => { headers[key] = value; });

  // Try ip-api.com live
  let geoResult = null;
  if (ip && ip !== "not found") {
    try {
      const res = await fetch(`http://ip-api.com/json/${ip}?fields=countryCode,country,status,message`, { signal: AbortSignal.timeout(3000) });
      geoResult = await res.json();
    } catch (e) {
      geoResult = { error: String(e) };
    }
  }

  return NextResponse.json({
    detectedIp: ip,
    cfIpcountry: req.headers.get("cf-ipcountry"),
    xForwardedFor: req.headers.get("x-forwarded-for"),
    xRealIp: req.headers.get("x-real-ip"),
    xCountryCode: req.headers.get("x-country-code"),
    geoLookup: geoResult,
    allHeaders: headers,
  });
}
