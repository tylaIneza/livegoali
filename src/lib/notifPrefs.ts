const REMINDERS_KEY = "livegoali:notif:reminders";
const SEEN_LIVE_KEY = "livegoali:notif:seenLive";

function readList(key: string): string[] {
  if (typeof window === "undefined") return [];
  try {
    const raw = window.localStorage.getItem(key);
    return raw ? (JSON.parse(raw) as string[]) : [];
  } catch {
    return [];
  }
}

function writeList(key: string, list: string[]) {
  try {
    window.localStorage.setItem(key, JSON.stringify(list));
  } catch {
    // storage unavailable (private mode / quota) — reminders just won't persist
  }
}

export function getReminders(): string[] {
  return readList(REMINDERS_KEY);
}

export function addReminder(matchId: string) {
  const list = readList(REMINDERS_KEY);
  if (!list.includes(matchId)) writeList(REMINDERS_KEY, [...list, matchId]);
}

export function removeReminder(matchId: string) {
  writeList(REMINDERS_KEY, readList(REMINDERS_KEY).filter((id) => id !== matchId));
}

export function isReminded(matchId: string): boolean {
  return readList(REMINDERS_KEY).includes(matchId);
}

export function clearReminders() {
  writeList(REMINDERS_KEY, []);
}

export function getSeenLive(): string[] {
  return readList(SEEN_LIVE_KEY);
}

export function markSeenLive(matchId: string) {
  const list = readList(SEEN_LIVE_KEY);
  if (!list.includes(matchId)) {
    // cap at 200 so this never grows unbounded over a long session
    writeList(SEEN_LIVE_KEY, [...list, matchId].slice(-200));
  }
}

export function notificationsGranted(): boolean {
  return typeof window !== "undefined" && "Notification" in window && window.Notification.permission === "granted";
}
