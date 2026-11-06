// Fake data for scripts/insights-check.mjs, shaped like the rows
// lib/api.js loadHistory() returns. Generated from a fixed seed, so every
// run prints the same numbers.

export const TODAY = "2026-11-06"; // a Friday, 12 days after the UK clocks went back

// The questions as seeded in supabase/migrations/20261106000000_check_ins.sql.
const scale = (n, from = 1) => [...Array(n)].map((_, i) => ({ id: String(i + from), label: String(i + from), value: i + from }));
const yesNo = [{ id: "yes", label: "Yes", value: 1 }, { id: "no", label: "No", value: 0 }];
export const QUESTIONS = [
  { id: "sleep", kind: "fixed", prompt: "How did you sleep?", options: scale(5) },
  { id: "social_yesterday", kind: "fixed", prompt: "How social was yesterday?", options: [
    { id: "barely", label: "Barely saw anyone", value: 0 }, { id: "a_bit", label: "A bit", value: 1 },
    { id: "fair", label: "A fair amount", value: 2 }, { id: "lot", label: "A lot", value: 3 }] },
  { id: "busy_today", kind: "rotating", prompt: "How busy is today looking?", options: [
    { id: "quiet", label: "Quiet", value: 0 }, { id: "normal", label: "Normal", value: 1 }, { id: "packed", label: "Packed", value: 2 }] },
  { id: "alone_time", kind: "rotating", prompt: "Any time alone planned today?", options: yesNo },
  { id: "stress", kind: "rotating", prompt: "How's your stress right now?", options: scale(5) },
  { id: "exercise", kind: "rotating", prompt: "Did you exercise yesterday?", options: yesNo },
  { id: "social_plans", kind: "rotating", prompt: "Anything social planned today?", options: yesNo },
  { id: "screen_time", kind: "rotating", prompt: "How much screen time last night?", options: [
    { id: "little", label: "Little", value: 0 }, { id: "some", label: "Some", value: 1 }, { id: "lots", label: "Lots", value: 2 }] },
];
const ROTATING = QUESTIONS.filter((q) => q.kind === "rotating");

// --------------------------------------------------------------- helpers

function mulberry32(seed) {
  return () => {
    seed |= 0;
    seed = (seed + 0x6d2b79f5) | 0;
    let t = Math.imul(seed ^ (seed >>> 15), 1 | seed);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

export function addDays(date, n) {
  const [y, m, d] = date.split("-").map(Number);
  return new Date(Date.UTC(y, m - 1, d + n)).toISOString().slice(0, 10);
}
const weekday = (date) => new Date(`${date}T00:00:00Z`).getUTCDay();
const clamp = (x) => Math.max(0, Math.min(100, Math.round(x)));

function offsetAt(ms, timeZone) {
  const f = new Intl.DateTimeFormat("en-US", { timeZone, hourCycle: "h23", year: "numeric", month: "2-digit", day: "2-digit", hour: "2-digit", minute: "2-digit", second: "2-digit" });
  const p = {};
  for (const { type, value } of f.formatToParts(new Date(ms))) p[type] = value;
  return Date.UTC(+p.year, +p.month - 1, +p.day, +p.hour % 24, +p.minute, +p.second) - ms;
}

// The UTC instant for a wall-clock time in a time zone, as a phone there
// would have stored it.
export function at(date, hh, mm, timeZone) {
  const [y, m, d] = date.split("-").map(Number);
  const guess = Date.UTC(y, m - 1, d, hh, mm);
  let t = guess - offsetAt(guess, timeZone);
  t = guess - offsetAt(t, timeZone);
  return new Date(t).toISOString();
}

// Collects rows the way the app writes them: every level gets a log row,
// and a level change can get a level_reasons row.
function recorder(timeZone) {
  const data = { levels: [], checkIns: [], reasons: [], pulses: [], nudges: [], around: [], questions: QUESTIONS };
  let id = 1000;
  let last = null;
  return {
    data,
    get level() { return last; },
    set(date, hh, mm, level, reason) {
      const created = at(date, hh, mm, timeZone);
      const row = { id: ++id, level: clamp(level), created_at: created };
      data.levels.push(row);
      if (last != null && reason !== undefined && last !== row.level) {
        data.reasons.push({
          level_log_id: row.id, before_level: last, after_level: row.level,
          reason, source: reason ? "chip" : null, shown_at: new Date(+new Date(created) + 60000).toISOString(),
        });
      }
      last = row.level;
      return row;
    },
    checkIn(date, status, answers) {
      data.checkIns.push({ id: `c-${date}`, local_date: date, status, answers: Object.entries(answers).map(([question_id, value]) => ({ question_id, option_id: String(value), value })) });
    },
  };
}

// ---------------------------------------------------------------- fixtures

// Two personalities, one per 28-day half. The current half is higher, with
// shallower lows, but slower bounce-backs, so small wins has a real
// "getting worse" item it must leave out. Every pattern moves between the
// halves: lowest weekday, top drain, top boost and dip time.
const PROFILES = {
  before: { base: 53, lowWeekday: 1, dropHour: 19, drain: "Too many people", altDrain: "Long day", boost: "Time alone", lowMorning: 30, bounce: "nextMorning" },
  after: { base: 68, lowWeekday: 4, dropHour: 14, drain: "Long day", altDrain: "Too many people", boost: "Saw a friend", lowMorning: 39, bounce: "nextEvening" },
};

// 56 days. improving: false swaps the halves, so the current half is the
// worse one.
export function full({ timeZone = "Europe/London", improving = true, seed = 7 } = {}) {
  const rand = mulberry32(seed);
  const pick = (xs) => xs[Math.floor(rand() * xs.length)];
  const r = recorder(timeZone);
  const skipped = new Set([50, 33, 20, 10]); // days with nothing logged
  const marks = {};
  let slowBounce = null; // set on a low day: how the next day climbs back

  for (let i = 55; i >= 0; i--) {
    const date = addDays(TODAY, -i);
    if (skipped.has(i)) continue;
    const p = (i >= 28) === improving ? PROFILES.before : PROFILES.after;
    const wd = weekday(date);

    // A clock-change day: a level just after midnight while the UK is still
    // on BST, whose UTC date is the day before.
    if (date === "2026-10-25") marks.bstMidnight = r.set(date, 0, 30, r.level + 2);

    // A holiday in the earlier half: high and steady all week, so it's the
    // longest stretch above 60 and the steadiest week.
    if (i <= 45 && i >= 40) {
      r.set(date, 8, 0, 68 + Math.round(rand() * 3));
      r.set(date, 18, 0, 70 + Math.round(rand() * 2));
      r.checkIn(date, "done", { sleep: 5, social_yesterday: 1, [ROTATING[i % ROTATING.length].id]: 1 });
      continue;
    }

    const sleep = 1 + Math.floor(rand() * 5);
    const social = Math.floor(rand() * 4);
    const rot = ROTATING[i % ROTATING.length];
    const answer = pick(rot.options).value;
    let base = p.base + (sleep - 3) * 4 - (social - 1.5) * 3;
    if (rot.id === "exercise") base += answer ? 5 : -5;
    if (rot.id === "busy_today") base += answer === 2 ? -6 : answer === 0 ? 3 : 0;

    const status = i % 9 === 4 ? "skipped" : "done";
    r.checkIn(date, status, status === "done" ? { sleep, social_yesterday: social, [rot.id]: answer } : { sleep });

    const low = wd === p.lowWeekday;
    let morning = low ? p.lowMorning + Math.round(rand() * 2) : base + (rand() * 6 - 3);
    if (slowBounce === "nextMorning") morning = Math.max(morning, 61);
    if (slowBounce === "nextEvening") morning = 52;
    r.set(date, 8, 0, morning);

    // The fastest bounce-back, set this week: 35 to 66 in an hour and a half.
    if (i === 2) {
      r.set(date, 12, 0, 35, "Overwhelmed");
      marks.fastBounce = r.set(date, 13, 30, 66, null);
    }

    const drop = low ? 12 : 8 + rand() * 7;
    const tag = rand() < 0.75 ? (rand() < 0.8 ? p.drain : p.altDrain) : null;
    const after = low ? r.level - drop : Math.max(42, r.level - drop);
    const dropRow = r.set(date, p.dropHour, 0, after, tag);
    if (date === "2026-10-26") marks.afterChangeDrop = dropRow;

    let evening = r.level + 10 + rand() * 6;
    if (slowBounce === "nextEvening") evening = Math.max(evening, 62);
    if (low) evening = Math.min(evening, 45);
    r.set(date, 21, 30, evening, rand() < 0.6 ? (rand() < 0.8 ? p.boost : "Fresh air") : null);
    if (date === "2026-10-25") marks.gmtLate = r.set(date, 23, 30, r.level);

    slowBounce = low ? p.bounce : null;

    if (rand() < 0.5) r.data.pulses.push({ created_at: at(date, 12, 30, timeZone) });
    if (rand() < 0.3) r.data.nudges.push({ created_at: at(date, 17, 0, timeZone) });
    if (rand() < 0.15) r.data.around.push({ at: at(date, 18, 0, timeZone), until: at(date, 22, 0, timeZone) });
  }

  return { data: { ...r.data, mbti: "INFP" }, opts: { timeZone, now: at(TODAY, 22, 0, timeZone) }, marks };
}

// A few scattered days: most insights should be locked with a hint.
export function sparse({ timeZone = "Europe/London" } = {}) {
  const r = recorder(timeZone);
  r.set(addDays(TODAY, -20), 9, 0, 60);
  r.set(addDays(TODAY, -12), 9, 0, 45, null);
  r.set(addDays(TODAY, -12), 20, 0, 55, "Time alone");
  r.set(addDays(TODAY, -3), 9, 0, 50);
  r.set(addDays(TODAY, -1), 10, 0, 40, null);
  r.set(addDays(TODAY, -1), 19, 0, 52, "Long day");
  r.checkIn(addDays(TODAY, -3), "done", { sleep: 4, social_yesterday: 1, exercise: 1 });
  r.checkIn(addDays(TODAY, -1), "done", { sleep: 2, social_yesterday: 3, stress: 4 });
  return { data: { ...r.data, mbti: null }, opts: { timeZone, now: at(TODAY, 22, 0, timeZone) } };
}

// Someone's first day.
export function oneDay({ timeZone = "Europe/London" } = {}) {
  const r = recorder(timeZone);
  r.set(TODAY, 9, 0, 70);
  r.set(TODAY, 12, 0, 45, "Work");
  r.set(TODAY, 18, 0, 55, null);
  r.checkIn(TODAY, "done", { sleep: 3, social_yesterday: 1, busy_today: 2 });
  return { data: { ...r.data, mbti: "ESTP" }, opts: { timeZone, now: at(TODAY, 20, 0, timeZone) } };
}

// Nothing logged yet.
export const empty = ({ timeZone = "Europe/London" } = {}) =>
  ({ data: { questions: QUESTIONS }, opts: { timeZone, now: at(TODAY, 20, 0, timeZone) } });
