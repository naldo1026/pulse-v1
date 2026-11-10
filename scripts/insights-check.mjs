// Runs lib/insights.js over the fake data in insights-fixtures.mjs, prints
// every insight, then checks the rules the maths has to keep. There are no
// automated tests in this repo, so this is how the insights get checked.
//
//   node scripts/insights-check.mjs          print and check
//   node scripts/insights-check.mjs --json   also dump the raw insight objects
//
// Exits 1 if a check fails.

import { readFileSync } from "node:fs";

// lib/ is ES modules in a package without "type": "module" (Expo needs it
// that way), so Node warns that it's reparsing. Harmless here.
process.removeAllListeners("warning");
process.on("warning", (w) => w.code !== "MODULE_TYPELESS_PACKAGE_JSON" && console.warn(w));

const insights = await import("../lib/insights.js");
const fx = await import("./insights-fixtures.mjs");
const { computeInsights, prepare, THRESHOLDS } = insights;

const json = process.argv.includes("--json");
const results = [];
const check = (name, ok, detail = "") => results.push({ name, ok: !!ok, detail });

// ----------------------------------------------------------------- printing

// Every sentence an insight would put on screen. vsUsual is already part of
// its parent's text.
function texts(v, out = []) {
  if (v && typeof v === "object") {
    for (const k of ["text", "lowText"]) if (typeof v[k] === "string") out.push(v[k]);
    for (const [k, x] of Object.entries(v)) if (!["text", "lowText", "vsUsual"].includes(k)) texts(x, out);
  }
  return out;
}

function show(key, v) {
  const pad = `  ${key}`.padEnd(24);
  if (v == null) return console.log(`${pad}null`);
  if (v.locked) return console.log(`${pad}locked, need ${v.need}: ${v.hint}`);
  if (key === "thisWeek") {
    console.log(`${pad}average ${v.average}, lowest ${v.lowest.weekday} ${v.lowest.value}, highest ${v.highest.weekday} ${v.highest.value}`);
    for (const d of v.days) {
      const range = d.low == null ? "" : `range ${d.low}–${d.high}`;
      console.log(`${"".padEnd(26)}${d.date} ${d.weekday.slice(0, 3)}  avg ${String(d.avg ?? "–").padStart(3)}  ${range.padEnd(12)}${d.logged ? "" : "(carried) "}${d.vsUsual ? d.vsUsual.text : ""}`);
    }
    return;
  }
  if (key === "records") {
    console.log(pad.trimEnd());
    for (const [name, r] of Object.entries(v)) {
      console.log(`${"".padEnd(26)}${name.padEnd(24)}${r ? `${r.display}, ${r.date}${r.setThisWeek ? "  ★ set this week" : ""}${r.ongoing ? " (ongoing)" : ""}` : "none yet"}`);
    }
    return;
  }
  if (key === "weekMoods") {
    console.log(`${pad}${v.bands.map((b) => `${b.label} ${b.pct}% (${b.hours}h)`).join(", ")}. Alone ${v.alone}%, chill ${v.chill}%.`);
    return;
  }
  if (key === "sawPeople") {
    console.log(`${pad}${v.days} of ${v.of} days (${v.pct}%): ${v.answers.map((a) => `${a.date} ${a.value}`).join(", ")}`);
    return;
  }
  if (key === "personalityLink") {
    console.log(`${pad}${v.type}, focus ${v.focus}: ${v.text}`);
    return;
  }
  if (key === "baseline") {
    const days = v.byWeekday.map((r, i) => (r ? `${insights.WEEKDAYS[i].slice(0, 3)} ${r.low}–${r.high}` : null)).filter(Boolean);
    console.log(`${pad}${v.text}${days.length ? ` By weekday: ${days.join(", ")}` : ""}`);
    return;
  }
  const lines = texts(v);
  console.log(`${pad}${lines.length ? lines[0] : "(nothing to show)"}`);
  for (const l of lines.slice(1)) console.log(`${"".padEnd(26)}${l}`);
}

function run(name, fixture) {
  const out = computeInsights(fixture.data, fixture.opts);
  console.log(`\n=== ${name} (${fixture.opts.timeZone}, now ${fixture.opts.now})\n`);
  for (const [k, v] of Object.entries(out)) show(k, v);
  if (json) console.log(JSON.stringify(out, null, 2));
  return out;
}

// ------------------------------------------------------------------ fixtures

const full = fx.full();
const outFull = run("Full 56 days", full);
const declining = fx.full({ improving: false, seed: 11 });
const outDeclining = run("Full 56 days, getting worse", declining);
const outSparse = run("Sparse", fx.sparse());
const outOne = run("First day", fx.oneDay());
const outEmpty = run("Nothing logged", fx.empty());
const newYork = fx.full({ timeZone: "America/New_York", seed: 3 });
const outNewYork = computeInsights(newYork.data, newYork.opts);

// -------------------------------------------------------------------- checks

const changes = outFull.patternChanges.changes || [];
const lowest = changes.find((c) => c.id === "lowestWeekday");
check("Full: pattern changes catch the lowest weekday moving Monday → Thursday",
  lowest && lowest.before === "Monday" && lowest.now === "Thursday", lowest?.text);
for (const id of ["topDrain", "topBoost", "dipTime"]) {
  check(`Full: pattern changes catch ${id}`, changes.some((c) => c.id === id));
}

// Small wins: every win has to point the right way, and a measure that got
// worse can't appear.
const good = (w) => (w.id === "bounceBack" ? w.to < w.from : w.to > w.from);
for (const [name, out] of [["Full", outFull], ["Getting worse", outDeclining], ["New York", outNewYork]]) {
  const wins = out.smallWins.wins || [];
  check(`${name}: small wins are all improvements`, wins.every(good), wins.map((w) => w.text).join(" | "));
}
check("Full: small wins has average and lows", ["average", "lows"].every((id) => outFull.smallWins.wins?.some((w) => w.id === id)));
check("Full: small wins leaves out the slower bounce-back", !outFull.smallWins.wins?.some((w) => w.id === "bounceBack"));
check("Getting worse: small wins leaves out the lower average and lows",
  !outDeclining.smallWins.wins?.some((w) => w.id === "average" || w.id === "lows"));

// Records: the flag matches the date, the fresh one is flagged and the old
// ones aren't.
const weekStart = fx.addDays(fx.TODAY, -6);
for (const [name, r] of Object.entries(outFull.records)) {
  if (r) check(`Full: records.${name} flag matches its date`, r.setThisWeek === (r.date >= weekStart), `${r.date} → ${r.setThisWeek}`);
}
const fast = outFull.records.fastestBounceBack;
check("Full: fastest bounce-back is the 1h 30m one from Wednesday, flagged this week",
  fast?.display === "1h 30m" && fast.date === fx.addDays(fx.TODAY, -2) && fast.setThisWeek === true, `${fast?.display} ${fast?.date}`);
check("Full: older records aren't flagged",
  outFull.records.mostDaysInARow?.setThisWeek === false && outFull.records.longestStretchAboveHigh?.setThisWeek === false);

// Locked hints and the first-day fact.
check("Sparse: This week is locked, needing 1 more day", outSparse.thisWeek.locked && outSparse.thisWeek.need === 1, outSparse.thisWeek.hint);
const lockedSparse = Object.entries(outSparse).filter(([, v]) => v?.locked).map(([k]) => k);
check("Sparse: most insights are locked with a hint", lockedSparse.length >= 10 && lockedSparse.every((k) => outSparse[k].hint), lockedSparse.join(", "));
check("Sparse: there's still a first-day fact", outSparse.firstDay?.text);
check("First day: the first-day fact is the 70 → 45 change", outOne.firstDay?.text?.includes("70 → 45"), outOne.firstDay?.text);
check("Nothing logged: first-day insight is null", outEmpty.firstDay === null);

// No text may claim a cause. Comparisons only.
const CAUSAL = /\b(because|caus\w*|made you|makes you|drains? you|boosts? you|took you|due to|leads? to|led to|thanks to|so you|results? in)\b/i;
const allText = [outFull, outDeclining, outSparse, outOne, outEmpty, outNewYork].flatMap((o) => texts(o));
const bad = allText.filter((t) => CAUSAL.test(t));
check(`No insight text claims a cause (${allText.length} lines)`, !bad.length, bad.join(" | "));

// No React Native in the module, so the Edge Function can import it.
const src = readFileSync(new URL("../lib/insights.js", import.meta.url), "utf8");
check("lib/insights.js has no imports at all", !/^\s*import\s/m.test(src) && !/\brequire\s*\(/.test(src) && !/from\s+["'](react|react-native|expo)/.test(src));

// Clock changes: UK clocks went back on 25 Oct 2026, US clocks on 1 Nov.
for (const [name, f] of [["London", full], ["New York", newYork]]) {
  const ctx = prepare(f.data, f.opts);
  const consecutive = ctx.days.every((d, i) => i === 0 || d.date === fx.addDays(ctx.days[i - 1].date, 1));
  check(`${name}: 56 consecutive calendar days across the clock change`, ctx.days.length === 56 && consecutive);
  const hours = new Set(ctx.levels.map((l) => l.hour));
  check(`${name}: levels keep their wall-clock hours across the change`, [...hours].every((h) => [0, 8, 12, 13, 14, 18, 19, 21, 23].includes(h)), [...hours].sort((a, b) => a - b).join(","));
}
const ctx = prepare(full.data, full.opts);
const bst = ctx.levels.find((l) => l.id === full.marks.bstMidnight.id);
check("London: 00:30 BST on 25 Oct counts on the 25th, though its UTC date is the 24th",
  bst.date === "2026-10-25" && full.marks.bstMidnight.created_at.startsWith("2026-10-24"), full.marks.bstMidnight.created_at);
const late = ctx.levels.find((l) => l.id === full.marks.gmtLate.id);
check("London: 23:30 GMT on 25 Oct, the 25-hour day, counts on the 25th", late.date === "2026-10-25" && late.hour === 23);
const drop = ctx.changes.find((c) => c.id === full.marks.afterChangeDrop.id);
check("London: the 14:00 drop the day after the change is at hour 14", drop?.hour === 14, `hour ${drop?.hour}`);

// Week at a glance: the states cover the whole week, and the gauges are
// slices of them.
for (const [name, out] of [["Full", outFull], ["Getting worse", outDeclining], ["New York", outNewYork]]) {
  const m = out.weekMoods;
  const sum = m.bands.reduce((a, b) => a + b.pct, 0);
  const pick = (ids) => m.bands.filter((b) => ids.includes(b.id)).reduce((a, b) => a + b.pct, 0);
  check(`${name}: week states add up to 100%, and alone/chill are their slices`, sum === 100 && m.alone === pick(["drained", "low"]) && m.chill === pick(["good"]), `sum ${sum}`);
  const hours = m.bands.reduce((a, b) => a + b.hours, 0);
  check(`${name}: week states cover the 7 days up to now (about 166h)`, Math.abs(hours - 166) <= 3, `${hours}h`);
}
check("Sparse and first day: week states stay locked under 3 days", outSparse.weekMoods.locked && outOne.weekMoods.locked);
const saw = outFull.sawPeople;
check("Full: saw people counts answers of 2 or more", saw.days === saw.answers.filter((a) => a.value >= 2).length && saw.of === saw.answers.length);
check("Full (INFP): personality links to alone time", outFull.personalityLink?.focus === "alone" && outFull.personalityLink.text.includes(`${outFull.weekMoods.alone}%`));
check("First day (ESTP): personality links to seeing people", outOne.personalityLink?.focus === "people", outOne.personalityLink?.text);
check("Sparse (no type): no personality line", outSparse.personalityLink === null);
check("London: 25 Oct (25-hour day) starts at 23:00 UTC the day before",
  new Date(insights.startOfDay("2026-10-25", "Europe/London")).toISOString() === "2026-10-24T23:00:00.000Z"
  && new Date(insights.startOfDay("2026-10-26", "Europe/London")).toISOString() === "2026-10-26T00:00:00.000Z");
check("New York: 1 Nov starts at 04:00 UTC, 2 Nov at 05:00",
  new Date(insights.startOfDay("2026-11-01", "America/New_York")).toISOString() === "2026-11-01T04:00:00.000Z"
  && new Date(insights.startOfDay("2026-11-02", "America/New_York")).toISOString() === "2026-11-02T05:00:00.000Z");

// What moves your battery: ranked biggest first, and a question added later
// in the dashboard joins once it has enough answers on each side.
const factors = outFull.whatMovesYourBattery.factors;
check("Full: what moves your battery is ranked by size", factors.every((f, i) => i === 0 || Math.abs(factors[i - 1].diff) >= Math.abs(f.diff)), factors.map((f) => `${f.short} ${f.diff}`).join(", "));
{
  const ctx0 = prepare(full.data, full.opts);
  const median = [...ctx0.days].filter((d) => d.avg != null).map((d) => d.avg).sort((a, b) => a - b)[28];
  const asked = new Set(full.data.checkIns.filter((_, i) => i % 3 === 0).map((c) => c.local_date));
  const withNew = (n) => ({
    ...full.data,
    questions: [...full.data.questions, { id: "outdoors", kind: "rotating", prompt: "Get outside yesterday?", options: [{ id: "yes", label: "Yes", value: 1 }, { id: "no", label: "No", value: 0 }] }],
    checkIns: full.data.checkIns.map((c) => {
      const day = ctx0.days.find((d) => d.date === c.local_date);
      if (!asked.has(c.local_date) || [...asked].indexOf(c.local_date) >= n) return c;
      return { ...c, answers: [...c.answers, { question_id: "outdoors", option_id: "x", value: day.avg >= median ? 1 : 0 }] };
    }),
  });
  const few = computeInsights(withNew(3), full.opts).whatMovesYourBattery.factors;
  const many = computeInsights(withNew(99), full.opts).whatMovesYourBattery.factors;
  const added = many.find((f) => f.question === "outdoors");
  check("A new dashboard question stays out of the ranking with too few answers", !few.some((f) => f.question === "outdoors"));
  check("A new dashboard question joins the ranking once it has enough answers, labelled from its prompt",
    added && added.short === "Get outside yesterday? Yes" && added.vs === "No", added && `${added.short} vs ${added.vs}: ${added.diff}`);
}

// The personality line only appears when the data backs it.
{
  const supported = (out) => {
    const r = out.personalityReflection;
    if (!r) return true;
    const inward = r.type[0] === "I";
    const way = (d) => (inward ? -d : d) >= THRESHOLDS.factorDiff;
    if (r.basis === "socialActivity") return way(out.socialActivity.diff);
    if (r.basis === "socialYesterday") return way(out.socialYesterday.diff);
    if (r.basis === "topBoost") return (inward ? ["alone time", "rest"] : ["good chat", "plans"]).includes(out.drainsAndBoosts.boosts[0].reason.toLowerCase());
    return false;
  };
  let shown = 0;
  const bad = [];
  for (const [name, f] of [["full", full], ["declining", declining], ["sparse", fx.sparse()], ["oneDay", fx.oneDay()], ["newYork", newYork]]) {
    for (const mbti of ["INFP", "ISTJ", "ENFP", "ESTJ"]) {
      const out = computeInsights({ ...f.data, mbti }, f.opts);
      if (out.personalityReflection) shown++;
      if (!supported(out)) bad.push(`${name}/${mbti}`);
    }
  }
  check(`Personality line only when the data backs it (${shown} of 20 shown)`, !bad.length && shown > 0, bad.join(", "));
  check("Full, as an extravert: no personality line (its data leans the other way)", computeInsights({ ...full.data, mbti: "ESTJ" }, full.opts).personalityReflection === null);
}

// ------------------------------------------------------------------- summary

console.log("\n=== Checks\n");
for (const r of results) console.log(`  ${r.ok ? "PASS" : "FAIL"}  ${r.name}${!r.ok && r.detail ? `\n          ${r.detail}` : ""}`);
const failed = results.filter((r) => !r.ok).length;
console.log(`\n${results.length - failed} passed, ${failed} failed`);
process.exit(failed ? 1 : 0);
