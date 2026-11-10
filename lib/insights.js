// All of My Week's maths. Plain JavaScript with no imports, so the monthly
// email (a Supabase Edge Function) can run the same code as the app. Rows go
// in, insight objects come out:
//
//   const ctx = prepare({ levels, checkIns, reasons, pulses, nudges, around, questions, mbti }, { timeZone });
//   const week = thisWeek(ctx);
//
// or computeInsights(data, opts) for all of them at once.
//
// Inputs, all optional, with rows shaped as Supabase returns them:
//   levels    level_log rows { id, level, created_at }. May start with one row
//             from before the window, so the first day has a level to carry.
//   checkIns  check_ins rows { local_date, status, answers: [{ question_id, option_id, value }] }
//   reasons   level_reasons rows { level_log_id, before_level, after_level, reason, shown_at }
//   pulses    pulses you sent { created_at }
//   nudges    nudges you received { created_at }
//   around    "I'm around" windows { at, until }, `at` being when it was set
//   questions check_in_questions rows { id, kind, prompt, options }, for labels
//   mbti      personality type, e.g. "INFP", or null
//
// Days are calendar days in the person's time zone (opts.timeZone, an IANA
// name; defaults to this device's). Dates come from Intl and are stepped as
// YYYY-MM-DD strings, and durations come from timestamps, so a clock change
// can't move a level into the wrong day or make a day 23 hours long.
//
// Every insight returns either a result or { locked: true, need, hint }.
// Copy compares and never explains: "After nights you rated 4–5, you
// averaged 68" is fine, "poor sleep drains you" isn't.

// Every minimum-data rule in one place. "Days" means days you set a level,
// not days that only carried one over from before.
export const THRESHOLDS = {
  weekDays: 3, // days in a 7-day week, for "This week" and last week's comparison
  comparisonSide: 3, // answers, or days, on each side of a comparison
  factorDiff: 5, // points between the sides before a factor counts as moving your battery
  headlineShift: 3, // points from last week before the headline calls it up or down
  baselineDays: 7, // days in the last 28 for your usual range
  baselineWeekdayDays: 3, // of one weekday in the last 28, for "your usual Tuesday"
  weekdayDays: 14, // days in 28 for the day-of-the-week pattern
  weekdayMinEach: 2, // of a weekday before it can be the lowest or highest
  rhythmDrops: 5, // drops in 28 days for your daily rhythm
  reasonsTagged: 3, // tagged changes in 28 days for top drains and boosts
  reasonRepeats: 2, // times a tag has to come up to be a top drain or boost
  recordWeekDays: 4, // days in a 7-day stretch before it can be your steadiest week
  winsDays: 7, // days in each 28-day half for small wins
  winsBounces: 2, // bounce-backs in each half to compare bounce-back time
  winLevel: 3, // points up for "average" and "lows" small wins
  winBounceShare: 0.2, // share faster for the bounce-back small win...
  winBounceMinutes: 60, // ...and at least this many minutes faster
};

// The level bounds for bounce-backs and stretches.
export const LOW = 40;
export const HIGH = 60;

const WINDOW = 56; // days loaded: 28 for patterns plus the 28 before
const PATTERN = 28;
const WEEK = 7;
const MINUTE = 60 * 1000;
const HOUR = 60 * MINUTE;
const DAY = 24 * HOUR;

export const WEEKDAYS = ["Sunday", "Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"];

// Local hour ranges for the daily rhythm.
const PARTS = [
  { id: "night", from: 0, to: 5, label: "at night" },
  { id: "morning", from: 5, to: 12, label: "in the morning" },
  { id: "afternoon", from: 12, to: 17, label: "in the afternoon" },
  { id: "evening", from: 17, to: 24, label: "in the evening" },
];

// How each seeded check-in question reads in a comparison, and its option
// values so the split is the same whatever's been answered so far. `hi` and
// `lo` are the two answer groups; {hi} and {lo} fill in a numeric range.
// Questions added later fall back to their prompt and option labels.
const QUESTION_COPY = {
  sleep: { values: [1, 2, 3, 4, 5], hi: "After nights you rated {hi}", lo: "after nights you rated {lo}", topic: "your sleep pattern" },
  social_yesterday: { values: [0, 1, 2, 3], hi: "After more social days", lo: "after quieter ones", topic: "how company lines up with the next day" },
  busy_today: { values: [0, 1, 2], hi: "On packed days", lo: "on quiet ones" },
  alone_time: { values: [0, 1], hi: "On days with time alone planned", lo: "on days without" },
  stress: { values: [1, 2, 3, 4, 5], hi: "When you rated your stress {hi}", lo: "when you rated it {lo}" },
  exercise: { values: [0, 1], hi: "After days you exercised", lo: "after days you didn't" },
  social_plans: { values: [0, 1], hi: "On days with social plans", lo: "on days without" },
  screen_time: { values: [0, 1, 2], hi: "After nights with lots of screen time", lo: "after nights with little" },
};

// ------------------------------------------------------------- helpers

const mean = (xs) => (xs.length ? xs.reduce((a, b) => a + b, 0) / xs.length : null);
const round = (x) => (x == null ? null : Math.round(x));
const cap = (s) => s[0].toUpperCase() + s.slice(1);
const more = (n, one, many = `${one}s`) => `${n} more ${n === 1 ? one : many}`;
const locked = (need, hint) => ({ locked: true, need: Math.max(1, need), hint });

// Linear interpolation between ranks, so the 25th percentile of 4 values
// isn't just one of them.
function percentile(sorted, p) {
  const i = (sorted.length - 1) * p;
  const lo = Math.floor(i);
  return sorted[lo] + (sorted[Math.min(lo + 1, sorted.length - 1)] - sorted[lo]) * (i - lo);
}

const formatters = new Map();

// The wall-clock reading of a moment in a time zone.
function wall(at, timeZone) {
  let f = formatters.get(timeZone);
  if (!f) {
    f = new Intl.DateTimeFormat("en-US", {
      timeZone, year: "numeric", month: "2-digit", day: "2-digit", hour: "2-digit", minute: "2-digit", hourCycle: "h23",
    });
    formatters.set(timeZone, f);
  }
  const p = {};
  for (const { type, value } of f.formatToParts(new Date(at))) p[type] = value;
  return p;
}

// The local calendar date and hour of a moment in a time zone.
function local(at, timeZone) {
  const p = wall(at, timeZone);
  return { date: `${p.year}-${p.month}-${p.day}`, hour: Number(p.hour) % 24 };
}

// The moment a local calendar day starts. The zone's offset is checked
// again at the answer, so a clock change that day still lands on midnight.
export function startOfDay(date, timeZone) {
  const [y, m, d] = date.split("-").map(Number);
  const target = Date.UTC(y, m - 1, d);
  const offset = (at) => {
    const p = wall(at, timeZone);
    return Date.UTC(+p.year, +p.month - 1, +p.day, Number(p.hour) % 24, +p.minute) - Math.floor(at / MINUTE) * MINUTE;
  };
  return target - offset(target - offset(target));
}

// Calendar arithmetic on YYYY-MM-DD strings, done in UTC where every day is
// 24 hours long.
export function addDays(date, n) {
  const [y, m, d] = date.split("-").map(Number);
  return new Date(Date.UTC(y, m - 1, d + n)).toISOString().slice(0, 10);
}
export const weekdayOf = (date) => new Date(`${date}T00:00:00Z`).getUTCDay();

// "5h", "1h 30m", "2.5 days".
export function formatDuration(ms) {
  const m = Math.round(ms / MINUTE);
  if (m < 60) return `${m} min`;
  if (m < 24 * 60) return m % 60 ? `${Math.floor(m / 60)}h ${m % 60}m` : `${m / 60}h`;
  const d = Math.round((ms / DAY) * 10) / 10;
  return `${d} ${d === 1 ? "day" : "days"}`;
}

// ------------------------------------------------------------- prepare

// Sorts and buckets the rows once, so each insight is a small function of
// the result. opts.now is for checking the maths against fixed data.
export function prepare(data = {}, opts = {}) {
  const timeZone = opts.timeZone || Intl.DateTimeFormat().resolvedOptions().timeZone;
  const now = opts.now ? +new Date(opts.now) : Date.now();
  const today = local(now, timeZone).date;
  const start = addDays(today, -(WINDOW - 1));

  const levels = (data.levels || [])
    .map((r) => ({ id: r.id, level: Number(r.level), at: +new Date(r.created_at) }))
    .filter((r) => r.at <= now)
    .sort((a, b) => a.at - b.at || a.id - b.id)
    .map((r) => ({ ...r, ...local(r.at, timeZone) }));

  const tagged = (data.reasons || []).filter((r) => r.reason && r.reason.trim());
  const reasonFor = new Map(tagged.map((r) => [r.level_log_id, r.reason.trim()]));

  // Each level change, from consecutive log rows.
  const changes = [];
  for (let i = 1; i < levels.length; i++) {
    const [a, b] = [levels[i - 1], levels[i]];
    if (a.level !== b.level) {
      changes.push({ id: b.id, from: a.level, to: b.level, change: b.level - a.level, at: b.at, date: b.date, hour: b.hour, reason: reasonFor.get(b.id) || null });
    }
  }

  // One entry per day of the window. avg, low and high cover the level
  // carried into the day plus every level set during it, as on the Week
  // screen. `logged` is whether you set one that day.
  const days = [];
  let carry = null;
  let k = 0;
  while (k < levels.length && levels[k].date < start) carry = levels[k++].level;
  for (let date = start; date <= today; date = addDays(date, 1)) {
    const own = [];
    while (k < levels.length && levels[k].date === date) own.push(levels[k++].level);
    const vals = carry == null ? own : [carry, ...own];
    if (own.length) carry = own[own.length - 1];
    days.push({
      date, weekday: weekdayOf(date), logged: own.length > 0,
      avg: mean(vals), low: vals.length ? Math.min(...vals) : null, high: vals.length ? Math.max(...vals) : null,
    });
  }

  const checkIns = new Map();
  for (const c of data.checkIns || []) {
    checkIns.set(c.local_date, {
      status: c.status,
      answers: new Map((c.answers || []).map((a) => [a.question_id, Number(a.value)])),
    });
  }

  const reasons = tagged.map((r) => ({
    reason: r.reason.trim(), change: r.after_level - r.before_level, ...local(+new Date(r.shown_at), timeZone),
  })).filter((r) => r.change !== 0);

  // Pulses sent, nudges received and "I'm around" windows, per local date.
  const social = new Map();
  const count = (at) => {
    if (!at) return;
    const d = local(+new Date(at), timeZone).date;
    social.set(d, (social.get(d) || 0) + 1);
  };
  for (const p of data.pulses || []) count(p.created_at);
  for (const n of data.nudges || []) count(n.created_at);
  for (const w of data.around || []) count(w.at || w.until);

  const mbti = typeof data.mbti === "string" && /^[EI][NS][TF][JP]$/.test(data.mbti) ? data.mbti : null;

  return {
    now, today, timeZone, levels, changes, days, checkIns, reasons, social, mbti,
    questions: new Map((data.questions || []).map((q) => [q.id, q])),
  };
}

// `n` days of the window, ending `skip` days before today.
const lastDays = (ctx, skip, n) => ctx.days.slice(ctx.days.length - skip - n, ctx.days.length - skip);
const current = (ctx) => lastDays(ctx, 0, PATTERN);
const previous = (ctx) => lastDays(ctx, PATTERN, PATTERN);
const within = (days) => (date) => days.length > 0 && date >= days[0].date && date <= days[days.length - 1].date;
const logged = (days) => days.filter((d) => d.logged);

// "today", "yesterday" or "on Tuesday".
function when(ctx, date) {
  if (date === ctx.today) return "today";
  if (date === addDays(ctx.today, -1)) return "yesterday";
  return `on ${WEEKDAYS[weekdayOf(date)]}`;
}

// ------------------------------------------------------- this week

// The rolling last 7 days: each day's average and range, the week's
// average, and its lowest and highest day.
export function thisWeek(ctx) {
  const days = lastDays(ctx, 0, WEEK);
  const n = logged(days).length;
  if (n < THRESHOLDS.weekDays) return locked(THRESHOLDS.weekDays - n, `${more(THRESHOLDS.weekDays - n, "day")} of levels to see your week`);
  const usual = baseline(ctx);
  const known = days.filter((d) => d.avg != null);
  const lowest = known.reduce((a, b) => (b.avg < a.avg ? b : a));
  const highest = known.reduce((a, b) => (b.avg > a.avg ? b : a));
  const pick = (d) => ({ date: d.date, weekday: WEEKDAYS[d.weekday], value: round(d.avg) });
  return {
    days: days.map((d) => ({
      date: d.date, weekday: WEEKDAYS[d.weekday], logged: d.logged,
      avg: round(d.avg), low: d.low, high: d.high,
      vsUsual: compareToBaseline(usual, round(d.avg), d.date),
    })),
    average: round(mean(known.map((d) => d.avg))),
    lowest: pick(lowest),
    highest: pick(highest),
  };
}

// One template sentence for the top of My Week.
export function headline(ctx) {
  const week = thisWeek(ctx);
  if (week.locked) return week;
  const cmp = weekComparison(ctx);
  let text = `You averaged ${week.average} this week`;
  if (cmp.locked) text += ".";
  else if (cmp.diff >= THRESHOLDS.headlineShift) text += `, ${cmp.diff} up on last week.`;
  else if (cmp.diff <= -THRESHOLDS.headlineShift) text += `, ${-cmp.diff} below last week.`;
  else text += ", about the same as last week.";
  const low = week.lowest;
  const usual = week.days.find((d) => d.date === low.date).vsUsual;
  const far = usual?.diff ? `, ${usual.text}` : "";
  text += low.date === ctx.today ? ` Today's your low point so far, at ${low.value}${far}.` : ` ${low.weekday} was your low point, at ${low.value}${far}.`;
  return { text };
}

// The days of the rolling last 7, for insights that take a period.
export const thisWeekDays = (ctx) => lastDays(ctx, 0, WEEK);

// The biggest single drop and recharge in the last 7 days, with the reason
// you gave for each, if any. Either can be null when there wasn't one. Once
// the baseline unlocks, each says how that day compared with your usual.
export function biggestMoves(ctx) {
  const week = thisWeekDays(ctx);
  const inWeek = within(week);
  const moves = ctx.changes.filter((c) => inWeek(c.date));
  if (!moves.length) return locked(1, `${more(1, "level change")} to see your biggest moves`);
  const usual = baseline(ctx);
  const describe = (c, what) => {
    if (!c) return null;
    const dayAvg = round(week.find((d) => d.date === c.date).avg);
    const vsUsual = compareToBaseline(usual, dayAvg, c.date);
    return {
      from: c.from, to: c.to, change: c.change, date: c.date, weekday: WEEKDAYS[weekdayOf(c.date)], hour: c.hour, reason: c.reason,
      dayAvg, vsUsual,
      text: `Your biggest ${what}: ${c.from} → ${c.to} ${when(ctx, c.date)}${c.reason ? `, tagged “${c.reason}”` : ""}.`
        + (vsUsual ? ` That day averaged ${dayAvg}, ${vsUsual.text}.` : ""),
    };
  };
  const drops = moves.filter((c) => c.change < 0);
  const rises = moves.filter((c) => c.change > 0);
  return {
    drop: describe(drops.length ? drops.reduce((a, b) => (b.change < a.change ? b : a)) : null, "drop"),
    recharge: describe(rises.length ? rises.reduce((a, b) => (b.change > a.change ? b : a)) : null, "recharge"),
  };
}

// This week against the 7 days before it: the average, its % change, and
// the number of low days (a daily average of LOW or below).
export function weekComparison(ctx) {
  const [a, b] = [lastDays(ctx, 0, WEEK), lastDays(ctx, WEEK, WEEK)];
  const [na, nb] = [logged(a).length, logged(b).length];
  const need = Math.max(0, THRESHOLDS.weekDays - na) + Math.max(0, THRESHOLDS.weekDays - nb);
  if (need) return locked(need, `${more(need, "day")} of levels to compare with last week`);
  const avg = (days) => round(mean(days.filter((d) => d.avg != null).map((d) => d.avg)));
  const lows = (days) => days.filter((d) => d.avg != null && round(d.avg) <= LOW).length;
  const [now, before] = [avg(a), avg(b)];
  const pct = before ? Math.round(((now - before) / before) * 100) : null;
  const lowDays = { thisWeek: lows(a), lastWeek: lows(b) };
  const fewer = lowDays.lastWeek - lowDays.thisWeek;
  const dayWord = (n) => (n === 1 ? "day" : "days");
  return {
    thisWeek: now, lastWeek: before, diff: now - before, pct, lowDays,
    text: pct == null || pct === 0
      ? `This week you averaged ${now}. Last week, ${before}.`
      : `This week you averaged ${now}, ${Math.abs(pct)}% ${pct > 0 ? "up on" : "down from"} last week's ${before}.`,
    lowText: `${lowDays.thisWeek} low ${dayWord(lowDays.thisWeek)} this week, `
      + (fewer > 0 ? `${fewer} fewer than last week.` : fewer < 0 ? `${-fewer} more than last week.` : "the same as last week."),
  };
}

// ------------------------------------------------------ week at a glance

// The app's own states, by level, as on the Me tab.
export const MOODS = [
  { id: "drained", max: 20, label: "Drained" },
  { id: "low", max: 40, label: "Low" },
  { id: "okay", max: 60, label: "Okay" },
  { id: "good", max: 80, label: "Good" },
  { id: "full", max: 100, label: "Full" },
];
const moodOf = (level) => MOODS.find((m) => level <= m.max).id;

// Whole percentages that add up to exactly 100 (largest remainder).
function percents(values) {
  const total = values.reduce((a, b) => a + b, 0);
  if (!total) return values.map(() => 0);
  const raw = values.map((v) => (v / total) * 100);
  const out = raw.map(Math.floor);
  const order = raw.map((r, i) => [r - out[i], i]).sort((a, b) => b[0] - a[0]);
  const short = 100 - out.reduce((a, b) => a + b, 0);
  for (let k = 0; k < short; k++) out[order[k][1]]++;
  return out;
}

// How the last 7 days split between states, by time: each level counts
// from when you set it until the next one, or now. Time before your first
// level isn't counted. `alone` is the share at LOW or below ("Texting's
// fine. Plans aren't."), `chill` the share in the Good band ("Down for
// something chill").
export function weekMoods(ctx) {
  const days = thisWeekDays(ctx);
  const n = logged(days).length;
  if (n < THRESHOLDS.weekDays) return locked(THRESHOLDS.weekDays - n, `${more(THRESHOLDS.weekDays - n, "day")} of levels to see your week`);
  const start = startOfDay(days[0].date, ctx.timeZone);
  const ms = Object.fromEntries(MOODS.map((m) => [m.id, 0]));
  let level = null;
  let since = start;
  for (const r of ctx.levels) {
    if (r.at <= start) {
      level = r.level;
      continue;
    }
    if (level != null) ms[moodOf(level)] += r.at - since;
    level = r.level;
    since = r.at;
  }
  if (level != null) ms[moodOf(level)] += ctx.now - since;
  const pcts = percents(MOODS.map((m) => ms[m.id]));
  const bands = MOODS.map((m, i) => ({ id: m.id, label: m.label, max: m.max, pct: pcts[i], hours: Math.round(ms[m.id] / HOUR) }));
  const top = bands.reduce((a, b) => (b.pct > a.pct ? b : a));
  const pct = (ids) => bands.filter((b) => ids.includes(b.id)).reduce((a, b) => a + b.pct, 0);
  return { bands, top: top.id, alone: pct(["drained", "low"]), chill: pct(["good"]) };
}

// How many days this week you saw people, from the check-in's "How social
// was yesterday?": "A fair amount" or "A lot" counts. Each answer is about
// the day before it, so this covers the 7 days up to yesterday.
export function sawPeople(ctx) {
  const answers = [];
  for (const d of thisWeekDays(ctx)) {
    const v = ctx.checkIns.get(d.date)?.answers.get("social_yesterday");
    if (v != null) answers.push({ date: addDays(d.date, -1), value: v });
  }
  if (!answers.length) return locked(1, `${more(1, "check-in")} to see how much you saw people`);
  const days = answers.filter((a) => a.value >= 2).length;
  return { days, of: answers.length, pct: Math.round((days / answers.length) * 100), answers };
}

// One reflective line tying your type to the gauge it speaks to: alone time
// for introverts, seeing people for extraverts. Only your own numbers, never
// a figure for "your type". Null without a type.
export function personalityLink(ctx) {
  const type = ctx.mbti;
  if (!type) return null;
  if (type[0] === "I") {
    const moods = weekMoods(ctx);
    return {
      type, focus: "alone",
      text: moods.locked
        ? "People with your type often need time alone to recharge."
        : `People with your type often need time alone to recharge. You spent ${moods.alone}% of your week wanting it.`,
    };
  }
  const people = sawPeople(ctx);
  return {
    type, focus: "people",
    text: people.locked
      ? "People with your type often recharge around others."
      : `People with your type often recharge around others. You saw people on ${people.days} of ${people.of} days.`,
  };
}

// --------------------------------------------------- personal baseline

// Your usual range: the 25th to 75th percentile of daily averages over the
// last 28 days, overall and for each weekday that has enough days.
export function baseline(ctx) {
  const days = logged(current(ctx));
  if (days.length < THRESHOLDS.baselineDays) {
    const need = THRESHOLDS.baselineDays - days.length;
    return locked(need, `${more(need, "day")} of levels to learn your usual range`);
  }
  const range = (ds) => {
    const s = ds.map((d) => d.avg).sort((x, y) => x - y);
    return { low: round(percentile(s, 0.25)), high: round(percentile(s, 0.75)), days: s.length };
  };
  const overall = range(days);
  return {
    overall,
    byWeekday: WEEKDAYS.map((_, w) => {
      const ds = days.filter((d) => d.weekday === w);
      return ds.length >= THRESHOLDS.baselineWeekdayDays ? range(ds) : null;
    }),
    text: `Your usual range is ${overall.low}–${overall.high}.`,
  };
}

// "12 below your usual Tuesday", or null without a baseline. Uses the
// weekday's range when there is one, otherwise the overall range.
export function compareToBaseline(usual, value, date) {
  if (!usual || usual.locked || value == null) return null;
  const w = weekdayOf(date);
  const range = usual.byWeekday[w] || usual.overall;
  const label = usual.byWeekday[w] ? `your usual ${WEEKDAYS[w]}` : "your usual range";
  if (value < range.low) return { diff: value - range.low, text: `${range.low - value} below ${label}` };
  if (value > range.high) return { diff: value - range.high, text: `${value - range.high} above ${label}` };
  return { diff: 0, text: `within ${label}` };
}

// ------------------------------------------------ check-in comparisons

// Splits a question's answers into a high and a low group: the top and
// bottom half of its option values, leaving the middle one out when
// there's an odd number. 1–5 gives 4–5 against 1–2.
function split(ctx, id, seen) {
  const q = ctx.questions.get(id);
  const opts = q?.options?.length
    ? q.options.map((o) => ({ value: Number(o.value), label: o.label }))
    : (QUESTION_COPY[id]?.values || [...new Set(seen)]).map((v) => ({ value: v, label: String(v) }));
  const values = [...new Set(opts.map((o) => o.value))].sort((a, b) => a - b);
  if (values.length < 2) return null;
  const half = Math.floor(values.length / 2);
  const group = (vs) => {
    const numeric = vs.every((v) => /^\d+$/.test(opts.find((o) => o.value === v).label));
    const labels = vs.map((v) => opts.find((o) => o.value === v).label);
    return { values: new Set(vs), label: numeric && vs.length > 1 ? `${labels[0]}–${labels[labels.length - 1]}` : labels.join(" or ") };
  };
  return { hi: group(values.slice(values.length - half)), lo: group(values.slice(0, half)) };
}

// Average battery on the days you gave a high answer to a question against
// the days you gave a low one. All 56 days count: a rotating question only
// comes up about once a week.
export function compareAnswers(ctx, id, topic) {
  const copy = QUESTION_COPY[id];
  topic = topic || copy?.topic || "what moves your battery";
  const pairs = [];
  for (const d of ctx.days) {
    const v = ctx.checkIns.get(d.date)?.answers.get(id);
    if (v != null && d.avg != null) pairs.push([v, d.avg]);
  }
  const groups = split(ctx, id, pairs.map(([v]) => v));
  const hi = groups ? pairs.filter(([v]) => groups.hi.values.has(v)).map(([, a]) => a) : [];
  const lo = groups ? pairs.filter(([v]) => groups.lo.values.has(v)).map(([, a]) => a) : [];
  const need = Math.max(0, THRESHOLDS.comparisonSide - hi.length) + Math.max(0, THRESHOLDS.comparisonSide - lo.length);
  if (!groups || need) return locked(need || 2 * THRESHOLDS.comparisonSide, `${more(need || 2 * THRESHOLDS.comparisonSide, "check-in")} to see ${topic}`);
  const [a, b] = [round(mean(hi)), round(mean(lo))];
  const q = ctx.questions.get(id);
  const fill = (s) => s.replace("{hi}", groups.hi.label).replace("{lo}", groups.lo.label);
  const text = copy
    ? `${fill(copy.hi)}, you averaged ${a}; ${fill(copy.lo)}, ${b}.`
    : `${q?.prompt || id} ${groups.hi.label}: you averaged ${a}. ${cap(groups.lo.label)}: ${b}.`;
  return {
    question: id,
    high: { label: groups.hi.label, avg: a, answers: hi.length },
    low: { label: groups.lo.label, avg: b, answers: lo.length },
    diff: a - b,
    text,
  };
}

export const sleepVsBattery = (ctx) => compareAnswers(ctx, "sleep");
export const socialYesterdayVsToday = (ctx) => compareAnswers(ctx, "social_yesterday");

// Every question's comparison that's over the threshold, biggest first,
// with its sign. Replaces a separate card per rotating question.
export function whatMovesYourBattery(ctx) {
  const ids = new Set(ctx.questions.keys());
  for (const c of ctx.checkIns.values()) for (const id of c.answers.keys()) ids.add(id);
  const all = [...ids].map((id) => compareAnswers(ctx, id));
  const open = all.filter((c) => !c.locked);
  if (!open.length) {
    const need = all.length ? Math.min(...all.map((c) => c.need)) : 2 * THRESHOLDS.comparisonSide;
    return locked(need, `${more(need, "check-in")} to see what moves your battery`);
  }
  return {
    factors: open.filter((c) => Math.abs(c.diff) >= THRESHOLDS.factorDiff).sort((a, b) => Math.abs(b.diff) - Math.abs(a.diff)),
  };
}

// ---------------------------------------------------------- patterns

function tally(reasons) {
  const groups = new Map();
  for (const r of reasons) {
    const key = `${r.change < 0 ? "-" : "+"}${r.reason.toLowerCase()}`;
    const g = groups.get(key) || { reason: r.reason, drop: r.change < 0, changes: [] };
    g.changes.push(Math.abs(r.change));
    groups.set(key, g);
  }
  const top = (drop) => [...groups.values()]
    .filter((g) => g.drop === drop && g.changes.length >= THRESHOLDS.reasonRepeats)
    .map((g) => ({ reason: g.reason, count: g.changes.length, avgChange: round(mean(g.changes)) }))
    .sort((a, b) => b.count - a.count || b.avgChange - a.avgChange)
    .slice(0, 3);
  return { drains: top(true), boosts: top(false) };
}

// The tags that come up most on drops and on recharges in the last 28 days.
// A tag is a drain or a boost by which way the level moved, not by the tag.
export function drainsAndBoosts(ctx, days = current(ctx)) {
  const inRange = within(days);
  const reasons = ctx.reasons.filter((r) => inRange(r.date));
  if (reasons.length < THRESHOLDS.reasonsTagged) {
    const need = THRESHOLDS.reasonsTagged - reasons.length;
    return locked(need, `${more(need, "tagged change")} to see your drains and boosts`);
  }
  const { drains, boosts } = tally(reasons);
  const line = (what) => (t) => ({ ...t, text: `“${t.reason}” came up on ${t.count} ${what}, ${t.avgChange} points on average.` });
  return { drains: drains.map(line("drops")), boosts: boosts.map(line("recharges")) };
}

// The part of the day most of your drops happen in, over the last 28 days.
export function dailyRhythm(ctx, days = current(ctx)) {
  const inRange = within(days);
  const drops = ctx.changes.filter((c) => c.change < 0 && inRange(c.date));
  if (drops.length < THRESHOLDS.rhythmDrops) {
    const need = THRESHOLDS.rhythmDrops - drops.length;
    return locked(need, `${more(need, "drop")} in your level to see your daily rhythm`);
  }
  const byPart = PARTS.map((p) => {
    const ds = drops.filter((c) => c.hour >= p.from && c.hour < p.to);
    return { part: p.id, label: p.label, drops: ds.length, total: ds.reduce((a, c) => a - c.change, 0) };
  });
  const top = byPart.reduce((a, b) => (b.drops > a.drops || (b.drops === a.drops && b.total > a.total) ? b : a));
  return {
    part: top.part, label: top.label, drops: top.drops, of: drops.length,
    byPart: byPart.map(({ part, drops: n }) => ({ part, drops: n })),
    text: `Most of your drops come ${top.label}: ${top.drops} of ${drops.length} in the last 4 weeks.`,
  };
}

// Average battery by weekday over the last 28 days.
export function dayOfWeek(ctx, days = current(ctx)) {
  const ds = logged(days);
  if (ds.length < THRESHOLDS.weekdayDays) {
    const need = THRESHOLDS.weekdayDays - ds.length;
    return locked(need, `${more(need, "day")} of levels to see your week's shape`);
  }
  const byWeekday = WEEKDAYS.map((name, w) => {
    const vs = ds.filter((d) => d.weekday === w).map((d) => d.avg);
    return { weekday: name, avg: vs.length >= THRESHOLDS.weekdayMinEach ? round(mean(vs)) : null, days: vs.length };
  });
  const known = byWeekday.map((d, w) => ({ ...d, w })).filter((d) => d.avg != null);
  if (known.length < 2) return locked(1, `${more(1, "day")} of levels to see your week's shape`);
  const lowest = known.reduce((a, b) => (b.avg < a.avg ? b : a));
  const highest = known.reduce((a, b) => (b.avg > a.avg ? b : a));
  return {
    byWeekday,
    lowest: { weekday: lowest.weekday, avg: lowest.avg },
    highest: { weekday: highest.weekday, avg: highest.avg },
    text: `${lowest.weekday}s are usually your lowest day, at ${lowest.avg} on average. ${highest.weekday}s are your highest, at ${highest.avg}.`,
  };
}

// Days with pulses sent, nudges received or an "I'm around" window,
// against days with none, over the last 28 days. Adds a reflective line
// for your personality type if you've set one.
export function socialActivity(ctx) {
  const ds = logged(current(ctx));
  const busy = ds.filter((d) => ctx.social.get(d.date)).map((d) => d.avg);
  const quiet = ds.filter((d) => !ctx.social.get(d.date)).map((d) => d.avg);
  const need = Math.max(0, THRESHOLDS.comparisonSide - busy.length) + Math.max(0, THRESHOLDS.comparisonSide - quiet.length);
  if (need) return locked(need, `${more(need, "day")} of levels to compare your social days`);
  const [a, b] = [round(mean(busy)), round(mean(quiet))];
  const type = ctx.mbti;
  return {
    social: { avg: a, days: busy.length },
    quiet: { avg: b, days: quiet.length },
    diff: a - b,
    text: `On days you sent a pulse, got a nudge or were around, you averaged ${a}. On other days, ${b}.`,
    personality: type && {
      type,
      text: type[0] === "I"
        ? `People with your type often find quiet time restoring.`
        : `People with your type often find company gives them energy.`,
    },
  };
}

// How many of the last 28 days you set a level, counted from your first
// level if that's more recent. Never framed as a streak to keep.
export function consistency(ctx) {
  const days = current(ctx);
  const first = days.findIndex((d) => d.logged);
  if (first < 0) return locked(1, "Set your level to start your week");
  const span = days.length - first;
  const n = logged(days).length;
  const checkIns = days.filter((d) => ctx.checkIns.get(d.date)?.status === "done").length;
  return {
    daysLogged: n, of: span, checkIns,
    text: span === days.length
      ? `You set your level on ${n} of the last ${span} days.`
      : `You set your level on ${n} of ${span} ${span === 1 ? "day" : "days"} since you started.`,
  };
}

// --------------------------------------------------------------- records

// Each time you went from LOW or below back to HIGH or above, timed from
// when you first hit LOW.
function bounces(levels) {
  const out = [];
  let from = null;
  for (const r of levels) {
    if (r.level <= LOW && from == null) from = r.at;
    else if (r.level >= HIGH && from != null) {
      out.push({ ms: r.at - from, at: r.at, date: r.date });
      from = null;
    }
  }
  return out;
}

// All-time bests from everything loaded. Each is { value, display, date,
// setThisWeek } or null if there isn't one yet. A tie keeps the older
// record: equalling a best doesn't set a new one.
export function records(ctx) {
  if (!ctx.levels.length) return locked(1, "Set your level to start your records");
  const weekStart = addDays(ctx.today, -(WEEK - 1));
  const record = (value, display, date, extra) => ({ value, display, date, setThisWeek: date >= weekStart, ...extra });

  let fastest = null;
  for (const b of bounces(ctx.levels)) if (!fastest || b.ms < fastest.ms) fastest = b;

  let steadiest = null;
  for (let i = WEEK; i <= ctx.days.length; i++) {
    const week = ctx.days.slice(i - WEEK, i);
    if (week.some((d) => d.avg == null) || logged(week).length < THRESHOLDS.recordWeekDays) continue;
    const avgs = week.map((d) => round(d.avg));
    const range = Math.max(...avgs) - Math.min(...avgs);
    if (!steadiest || range < steadiest.range) steadiest = { range, from: week[0].date, date: week[WEEK - 1].date };
  }

  let stretch = null;
  let since = null;
  const close = (end, date, ongoing) => {
    if (since && (!stretch || end - since.at > stretch.ms)) stretch = { ms: end - since.at, date, ongoing, from: since.date };
  };
  for (const r of ctx.levels) {
    if (r.level >= HIGH && !since) since = r;
    else if (r.level < HIGH && since) {
      close(r.at, r.date, false);
      since = null;
    }
  }
  close(ctx.now, ctx.today, true);

  let run = null;
  let n = 0;
  for (const d of ctx.days) {
    n = d.logged ? n + 1 : 0;
    if (n && (!run || n > run.n)) run = { n, date: d.date };
  }

  return {
    fastestBounceBack: fastest && record(fastest.ms, formatDuration(fastest.ms), fastest.date),
    steadiestWeek: steadiest && record(steadiest.range, `a range of ${steadiest.range}`, steadiest.date, { from: steadiest.from }),
    longestStretchAboveHigh: stretch && record(stretch.ms, formatDuration(stretch.ms), stretch.date, { from: stretch.from, ongoing: stretch.ongoing }),
    mostDaysInARow: run && record(run.n, `${run.n} ${run.n === 1 ? "day" : "days"}`, run.date),
  };
}

// -------------------------------------------------- change over time

// The last 28 days against the 28 before. Only ever returns improvements:
// a measure that got worse, or moved less than its minimum, is left out.
export function smallWins(ctx) {
  const [cur, prev] = [current(ctx), previous(ctx)];
  const [lc, lp] = [logged(cur), logged(prev)];
  const need = Math.max(0, THRESHOLDS.winsDays - lc.length) + Math.max(0, THRESHOLDS.winsDays - lp.length);
  if (need) return locked(need, `${more(need, "day")} of levels to see how you're changing`);
  const wins = [];
  const level = (id, key, text) => {
    const [from, to] = [round(mean(lp.map((d) => d[key]))), round(mean(lc.map((d) => d[key])))];
    if (to - from >= THRESHOLDS.winLevel) wins.push({ id, from, to, text: `${text}: ${from} → ${to}` });
  };
  level("average", "avg", "Your average is up");
  level("lows", "low", "Your lows are getting shallower");
  const all = bounces(ctx.levels);
  const [bc, bp] = [all.filter((b) => within(cur)(b.date)), all.filter((b) => within(prev)(b.date))];
  if (bc.length >= THRESHOLDS.winsBounces && bp.length >= THRESHOLDS.winsBounces) {
    const [from, to] = [mean(bp.map((b) => b.ms)), mean(bc.map((b) => b.ms))];
    if (from - to >= Math.max(from * THRESHOLDS.winBounceShare, THRESHOLDS.winBounceMinutes * MINUTE)) {
      wins.push({ id: "bounceBack", from, to, text: `You're bouncing back faster: ${formatDuration(from)} → ${formatDuration(to)}` });
    }
  }
  return { wins };
}

// The headline patterns in the last 28 days against the 28 before. Only
// returns the ones that actually changed.
export function patternChanges(ctx) {
  const [cur, prev] = [current(ctx), previous(ctx)];
  const changes = [];
  let comparable = 0;
  const check = (id, a, b, text) => {
    if (a == null || b == null) return;
    comparable++;
    if (a.toLowerCase() !== b.toLowerCase()) changes.push({ id, before: a, now: b, text: text(a, b) });
  };

  const [wp, wc] = [dayOfWeek(ctx, prev), dayOfWeek(ctx, cur)];
  check("lowestWeekday", wp.lowest?.weekday, wc.lowest?.weekday, (a, b) => `${a}s used to be your lowest day. Now it's ${b}.`);

  const [tp, tc] = [drainsAndBoosts(ctx, prev), drainsAndBoosts(ctx, cur)];
  check("topDrain", tp.drains?.[0]?.reason, tc.drains?.[0]?.reason, (a, b) => `“${a}” used to be your most common tag on a drop. Now it's “${b}”.`);
  check("topBoost", tp.boosts?.[0]?.reason, tc.boosts?.[0]?.reason, (a, b) => `“${a}” used to be your most common tag on a recharge. Now it's “${b}”.`);

  const [rp, rc] = [dailyRhythm(ctx, prev), dailyRhythm(ctx, cur)];
  const label = (id) => PARTS.find((p) => p.id === id).label;
  check("dipTime", rp.part, rc.part, (a, b) => `You used to dip most ${label(a)}. Now it's ${label(b)}.`);

  if (!comparable) {
    const n = THRESHOLDS.weekdayDays - logged(prev).length;
    return locked(n, `${more(n, "day")} of levels before you can see your patterns change`);
  }
  return { changes };
}

// One real fact from the most recent day with anything logged, for when
// there isn't enough yet for the rest. Null only if nothing's been logged.
export function firstDay(ctx) {
  const levelDays = ctx.days.filter((d) => d.logged).map((d) => d.date);
  const checkInDays = [...ctx.checkIns.keys()].filter((d) => d <= ctx.today);
  const date = [...levelDays, ...checkInDays].sort().pop();
  if (!date) return null;
  const at = when(ctx, date);
  const change = ctx.changes.find((c) => c.date === date);
  if (change) {
    return { date, text: `Your first change ${at}: ${change.from} → ${change.to}${change.reason ? `, tagged “${change.reason}”` : ""}.` };
  }
  const level = ctx.levels.find((r) => r.date === date);
  if (level) return { date, text: `You set your level ${at}: ${level.level}.` };
  const sleep = ctx.checkIns.get(date)?.answers.get("sleep");
  if (sleep != null) return { date, text: `You rated your sleep ${sleep} out of 5 ${at}.` };
  return { date, text: `You checked in ${at}.` };
}

// ------------------------------------------------------------ everything

export function computeInsights(data, opts) {
  const ctx = prepare(data, opts);
  return {
    thisWeek: thisWeek(ctx),
    headline: headline(ctx),
    biggestMoves: biggestMoves(ctx),
    weekComparison: weekComparison(ctx),
    weekMoods: weekMoods(ctx),
    sawPeople: sawPeople(ctx),
    personalityLink: personalityLink(ctx),
    weekDrainsAndBoosts: drainsAndBoosts(ctx, thisWeekDays(ctx)),
    drainsAndBoosts: drainsAndBoosts(ctx),
    sleep: sleepVsBattery(ctx),
    socialYesterday: socialYesterdayVsToday(ctx),
    dailyRhythm: dailyRhythm(ctx),
    dayOfWeek: dayOfWeek(ctx),
    socialActivity: socialActivity(ctx),
    consistency: consistency(ctx),
    baseline: baseline(ctx),
    whatMovesYourBattery: whatMovesYourBattery(ctx),
    records: records(ctx),
    smallWins: smallWins(ctx),
    patternChanges: patternChanges(ctx),
    firstDay: firstDay(ctx),
  };
}
