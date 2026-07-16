import { lookup } from "dns/promises";
import { isIP } from "net";

// Blocks the app server from being used as an SSRF proxy against internal
// infrastructure (cloud metadata endpoints, localhost, private subnets)
// when it fetches a caller-supplied URL, e.g. /api/stream/extract.
function isPrivateOrReservedIp(ip: string): boolean {
  const version = isIP(ip);

  if (version === 4) {
    const parts = ip.split(".").map(Number);
    const [a, b] = parts;
    if (a === 10) return true; // 10.0.0.0/8
    if (a === 172 && b >= 16 && b <= 31) return true; // 172.16.0.0/12
    if (a === 192 && b === 168) return true; // 192.168.0.0/16
    if (a === 127) return true; // loopback
    if (a === 169 && b === 254) return true; // link-local incl. cloud metadata (169.254.169.254)
    if (a === 100 && b >= 64 && b <= 127) return true; // 100.64.0.0/10 CGNAT
    if (a === 0) return true; // 0.0.0.0/8
    return false;
  }

  if (version === 6) {
    const lower = ip.toLowerCase();
    if (lower === "::1") return true; // loopback
    if (lower.startsWith("fc") || lower.startsWith("fd")) return true; // fc00::/7 unique local
    if (lower.startsWith("fe80")) return true; // fe80::/10 link-local
    if (lower.startsWith("::ffff:")) return isPrivateOrReservedIp(lower.slice(7)); // IPv4-mapped
    return false;
  }

  return true; // not a parseable IP — treat as unsafe
}

/**
 * Validates that `url` is http(s) and does not point at loopback/private/
 * link-local/cloud-metadata addresses, resolving the hostname first so a
 * plain domain name can't be used to reach internal infrastructure.
 */
export async function assertSafeExternalUrl(url: string): Promise<void> {
  let parsed: URL;
  try {
    parsed = new URL(url);
  } catch {
    throw new Error("Invalid URL");
  }

  if (parsed.protocol !== "http:" && parsed.protocol !== "https:") {
    throw new Error("Only http/https URLs are allowed");
  }

  const hostname = parsed.hostname;
  if (hostname === "localhost" || hostname.endsWith(".localhost")) {
    throw new Error("URL host is not allowed");
  }

  if (isIP(hostname)) {
    if (isPrivateOrReservedIp(hostname)) throw new Error("URL host is not allowed");
    return;
  }

  let addresses: string[];
  try {
    const results = await lookup(hostname, { all: true });
    addresses = results.map((r) => r.address);
  } catch {
    throw new Error("Could not resolve URL host");
  }

  if (addresses.length === 0 || addresses.some(isPrivateOrReservedIp)) {
    throw new Error("URL host is not allowed");
  }
}
