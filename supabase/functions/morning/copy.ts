// What the morning push says. On a Monday in the person's own time zone it
// says their week's in, and its link opens My Week once the check-in's done.
// Still one push a day: each person gets one of these, never both. No Deno
// APIs here, so scripts/morning-check.mjs can run it in Node.

export type Morning = { title: string; body: string; url: string; tag: string };

export const MORNING: Morning = {
  title: "Morning. How are you feeling?",
  body: "Tap to set your level.",
  url: "/?morning=1",
  tag: "morning",
};

export const MONDAY_MORNING: Morning = {
  title: "Morning. Your week's in.",
  body: "Tap to set your level, then see your week.",
  url: "/?morning=1&week=1",
  tag: "morning",
};

// Whether it's Monday at `now` in an IANA time zone. An unknown zone counts
// as not Monday, so it falls back to the everyday text.
export function isLocalMonday(now: Date, timeZone: string): boolean {
  try {
    return new Intl.DateTimeFormat("en-US", { timeZone, weekday: "short" }).format(now) === "Mon";
  } catch {
    return false;
  }
}

// Splits the people due a push into Monday and every other day. Each id
// lands in exactly one group. Anyone without a time zone counts as UTC,
// the settings default.
export function splitMornings(ids: string[], zones: Map<string, string>, now: Date) {
  const monday: string[] = [];
  const other: string[] = [];
  for (const id of ids) (isLocalMonday(now, zones.get(id) || "UTC") ? monday : other).push(id);
  return { monday, other };
}
