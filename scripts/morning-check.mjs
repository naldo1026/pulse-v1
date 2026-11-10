// Checks the morning push copy in supabase/functions/morning/copy.ts: the
// Monday text goes only to people for whom it's Monday, and each person gets
// exactly one push. Node 24 runs the TypeScript file directly.
//
//   node scripts/morning-check.mjs
//
// Exits 1 if a check fails. The function's database calls and the actual
// sending aren't covered: those need the local Supabase stack.

const { MORNING, MONDAY_MORNING, isLocalMonday, splitMornings } = await import("../supabase/functions/morning/copy.ts");

const results = [];
const check = (name, ok, detail = "") => results.push({ name, ok: !!ok, detail });

// Monday 9 Nov 2026, 07:40 in London. The same moment is still Sunday in
// Los Angeles and already Monday evening in Auckland.
const mondayLondon = new Date("2026-11-09T07:40:00Z");
check("07:40 Monday in London is Monday", isLocalMonday(mondayLondon, "Europe/London"));
check("...while it's still Sunday night in Los Angeles", !isLocalMonday(mondayLondon, "America/Los_Angeles"));
check("...and Monday evening in Auckland", isLocalMonday(mondayLondon, "Pacific/Auckland"));
check("An unknown time zone gets the everyday text", !isLocalMonday(mondayLondon, "Not/AZone"));

// Every other day of that week, at 07:40 London time, is not Monday.
for (let d = 10; d <= 15; d++) {
  const at = new Date(`2026-11-${d}T07:40:00Z`);
  check(`${at.toUTCString().slice(0, 3)} ${d} Nov in London is not Monday`, !isLocalMonday(at, "Europe/London"));
}

// The 25-hour day: Monday 26 Oct 2026, just after the UK clocks went back.
check("Monday 26 Oct (after the UK clock change) is Monday", isLocalMonday(new Date("2026-10-26T07:40:00Z"), "Europe/London"));

const ids = ["london", "la", "auckland", "nozone", "badzone"];
const zones = new Map([["london", "Europe/London"], ["la", "America/Los_Angeles"], ["auckland", "Pacific/Auckland"], ["badzone", "Not/AZone"]]);
const { monday, other } = splitMornings(ids, zones, mondayLondon);
check("Monday push goes to London, Auckland, and no-zone (UTC, where it's Monday 07:40)", monday.join() === "london,auckland,nozone", monday.join());
check("Los Angeles (still Sunday) and an unknown zone get the everyday push", other.join() === "la,badzone", other.join());
check("Nobody is missed", monday.length + other.length === ids.length);
const all = [...monday, ...other];
check("Nobody gets two pushes", new Set(all).size === all.length);
check("No zone at all counts as UTC", splitMornings(["x"], new Map(), mondayLondon).monday.join() === "x");

check("Monday text is \"Morning. Your week's in.\"", MONDAY_MORNING.title === "Morning. Your week's in.");
check("Monday link opens the check-in, then My Week", MONDAY_MORNING.url === "/?morning=1&week=1");
check("Everyday text and link are unchanged", MORNING.title === "Morning. How are you feeling?" && MORNING.body === "Tap to set your level." && MORNING.url === "/?morning=1");
check("Both use the same tag, so a phone only ever shows one", MORNING.tag === MONDAY_MORNING.tag);

for (const r of results) console.log(`  ${r.ok ? "PASS" : "FAIL"}  ${r.name}${!r.ok && r.detail ? `\n          ${r.detail}` : ""}`);
const failed = results.filter((r) => !r.ok).length;
console.log(`\n${results.length - failed} passed, ${failed} failed`);
process.exit(failed ? 1 : 0);
