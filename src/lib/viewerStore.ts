// In-memory viewer store — tracks active sessions per match
// Sessions expire after 60 seconds without a heartbeat

interface Session {
  lastSeen: number;
  isUser: boolean;
}

const store = new Map<string, Map<string, Session>>();

const EXPIRY_MS = 60_000;

function cleanup(matchId: string) {
  const sessions = store.get(matchId);
  if (!sessions) return;
  const now = Date.now();
  for (const [sid, s] of sessions) {
    if (now - s.lastSeen > EXPIRY_MS) sessions.delete(sid);
  }
  if (sessions.size === 0) store.delete(matchId);
}

export function heartbeat(matchId: string, sessionId: string, isUser: boolean) {
  if (!store.has(matchId)) store.set(matchId, new Map());
  store.get(matchId)!.set(sessionId, { lastSeen: Date.now(), isUser });
}

export function leave(matchId: string, sessionId: string) {
  store.get(matchId)?.delete(sessionId);
}

export function getViewers(matchId: string): { total: number; users: number; guests: number } {
  cleanup(matchId);
  const sessions = store.get(matchId);
  if (!sessions) return { total: 0, users: 0, guests: 0 };
  let users = 0, guests = 0;
  for (const s of sessions.values()) {
    s.isUser ? users++ : guests++;
  }
  return { total: users + guests, users, guests };
}

export function getAllViewers(): Array<{ matchId: string; total: number; users: number; guests: number }> {
  const result = [];
  for (const matchId of store.keys()) {
    const v = getViewers(matchId);
    if (v.total > 0) result.push({ matchId, ...v });
  }
  return result;
}
