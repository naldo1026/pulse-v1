// What My Week last showed on this device: the calendar week and the
// newsKeys() keys (lib/insights.js). Anything since earns the tab a dot.
// Kept per user, so a shared phone doesn't mix people up. Storage can be
// missing or full (native, private browsing): then nothing's remembered and
// nothing breaks.

const key = (uid) => `pulse.myWeekSeen.${uid}`;

export function loadSeen(uid) {
  try {
    const seen = JSON.parse(globalThis.localStorage.getItem(key(uid)));
    return seen && typeof seen.week === "string" && Array.isArray(seen.keys) ? seen : null;
  } catch {
    return null;
  }
}

export function saveSeen(uid, seen) {
  try {
    globalThis.localStorage.setItem(key(uid), JSON.stringify(seen));
  } catch {
    // Not remembered. The worst case is a dot that comes back.
  }
}
