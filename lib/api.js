// Every Supabase read and write the app makes. Rows come back mapped to the
// short shapes the screens already use: people are
// { id, n, l, g, d, note, extra, ago, chat, ph }, where d is the doodle you
// gave them.
import { supabase } from "./supabase";
import { statusFor } from "./data";

const HOUR = 3600 * 1000;

const must = ({ data, error }) => {
  if (error) throw error;
  return data;
};

const since = (ms) => new Date(Date.now() - ms).toISOString();

const agoFor = (iso) => {
  const m = Math.round((Date.now() - new Date(iso)) / 60000);
  if (m < 1) return "just now";
  if (m < 60) return `${m}m ago`;
  if (m < 60 * 24) return `${Math.round(m / 60)}h ago`;
  return `${Math.round(m / 1440)}d ago`;
};

// The line under someone's name in the circle.
export const noteFor = (l, reason, chat) =>
  l <= 40 ? [reason || statusFor(l).s, chat && "Open to a chat"].filter(Boolean).join(" · ") : statusFor(l).s;

// "around till 10", or null once the window has passed.
export const aroundFor = (around, until) =>
  around && until && new Date(until) > new Date() ? `around ${around === "an hour" ? "for an hour" : around}` : null;

// When an "I'm around" window ends.
export function untilFor(w) {
  const now = new Date();
  const end = new Date(now);
  if (w === "an hour") return new Date(+now + HOUR).toISOString();
  if (w === "till 10") end.setHours(22, 0, 0, 0);
  else end.setHours(23, 59, 0, 0);
  return new Date(Math.max(+end, +now + HOUR)).toISOString();
}

export async function loadMe(uid) {
  let profile = must(await supabase.from("profiles").select("*").eq("id", uid).maybeSingle());
  let settings = must(await supabase.from("settings").select("*").eq("user_id", uid).maybeSingle());
  // The sign-up trigger normally creates both. This covers anyone added
  // before the migration ran.
  if (!profile) profile = must(await supabase.from("profiles").insert({ id: uid }).select().single());
  if (!settings) settings = must(await supabase.from("settings").insert({ user_id: uid }).select().single());
  return { profile, settings };
}

export const saveProfile = async (uid, patch) => must(await supabase.from("profiles").update(patch).eq("id", uid));
export const saveSettings = async (uid, patch) => must(await supabase.from("settings").update(patch).eq("user_id", uid));

// Everyone else who's finished onboarding. Anyone you haven't put in a
// group counts as a friend.
export async function loadPeople(uid) {
  const [ps, gs] = await Promise.all([
    supabase.from("profiles").select("id, display_name, level, reason, wants_chat, around, around_until, level_updated_at, phone").neq("id", uid).eq("onboarded", true).order("display_name"),
    supabase.from("groupings").select("member_id, grp, doodle"),
  ]);
  const mine = Object.fromEntries(must(gs).map((g) => [g.member_id, g]));
  return must(ps).map((p) => ({
    id: p.id, n: p.display_name, l: p.level, g: mine[p.id]?.grp || "friends", d: mine[p.id]?.doodle || null,
    note: noteFor(p.level, p.reason, p.wants_chat),
    extra: aroundFor(p.around, p.around_until),
    ago: agoFor(p.level_updated_at),
    chat: p.wants_chat, ph: p.phone,
  }));
}

export const setGroup = async (uid, memberId, grp) =>
  must(await supabase.from("groupings").upsert({ owner_id: uid, member_id: memberId, grp }));

// grp comes along because a row needs one, and someone with no row yet is
// still in a group as far as the screens are concerned.
export const setDoodle = async (uid, memberId, grp, doodle) =>
  must(await supabase.from("groupings").upsert({ owner_id: uid, member_id: memberId, grp, doodle }));

// Recipients are filled in by a trigger from your groupings, and another
// trigger hands the pulse to the notify function.
export const sendPulse = async ({ level, reason, groups }) =>
  must(await supabase.from("pulses").insert({ level, reason, groups }).select("id").single()).id;

// Your latest pulse from the last day, when you sent it, and who's marked
// it seen.
export async function myLatestPulse(uid) {
  const p = must(await supabase.from("pulses").select("id, created_at, pulse_seen(viewer_id)").eq("sender_id", uid)
    .gt("created_at", since(24 * HOUR)).order("created_at", { ascending: false }).limit(1).maybeSingle());
  return p && { id: p.id, at: p.created_at, seen: p.pulse_seen.map((s) => s.viewer_id) };
}

// When you can send again. The database allows one pulse an hour.
export const nextSendFor = (p) => (p?.at ? new Date(+new Date(p.at) + HOUR) : null);

// sender id -> { id, seen } for the latest pulse each person sent you today.
export async function pulsesToMe(uid) {
  const rows = must(await supabase.from("pulses").select("id, sender_id, pulse_seen(viewer_id)").contains("recipient_ids", [uid])
    .gt("created_at", since(24 * HOUR)).order("created_at", { ascending: false }));
  const out = {};
  for (const r of rows) {
    if (!out[r.sender_id]) out[r.sender_id] = { id: r.id, seen: r.pulse_seen.some((s) => s.viewer_id === uid) };
  }
  return out;
}

export const markSeen = async (pulseId) =>
  must(await supabase.from("pulse_seen").upsert({ pulse_id: pulseId }, { ignoreDuplicates: true }));

// kind: "ask" | "in" | "maybe". Pushed to the other person by notify.
export const nudge = async (toId, kind) => must(await supabase.from("nudges").insert({ to_id: toId, kind }));

// YYYY-MM-DD on this phone's calendar. toISOString would give the UTC date.
export const localDate = (d = new Date()) =>
  `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;

// The 2 fixed questions, then the rotating one you answered least recently.
// The pick stays the same all day, even after you've answered it.
export const todaysQuestions = async (date = localDate()) =>
  must(await supabase.rpc("todays_questions", { p_date: date }));

// Whether that day's check-in has been saved, done or skipped.
export const checkedIn = async (uid, date = localDate()) =>
  !!must(await supabase.from("check_ins").select("id").eq("user_id", uid).eq("local_date", date).maybeSingle());

// status: "done" | "skipped". A skip keeps any answers already given.
// answers: [{ question_id, option_id }]. Pass the date the sheet opened, so a
// check-in that crosses midnight stays on the right day. Returns the row's id.
export const saveCheckIn = async ({ status, answers = [], date = localDate() }) =>
  must(await supabase.rpc("save_check_in", { p_date: date, p_status: status, p_answers: answers }));

// Your latest level change, or null until you have two levels. The trigger
// writes level_log, so this is how the app gets the id saveChangeReason needs.
// prevAt is when the level before it was set.
export async function lastLevelChange(uid) {
  const [now, prev] = must(await supabase.from("level_log").select("id, level, created_at").eq("user_id", uid)
    .order("id", { ascending: false }).limit(2));
  return now && prev ? { logId: now.id, before: prev.level, after: now.level, at: now.created_at, prevAt: prev.created_at } : null;
}

// When the "What made this change?" prompt last showed, or null if it never has.
export async function lastReasonAt(uid) {
  const row = must(await supabase.from("level_reasons").select("shown_at").eq("user_id", uid)
    .order("shown_at", { ascending: false }).limit(1).maybeSingle());
  return row && new Date(row.shown_at);
}

// One row per prompt shown. Leave reason and source out for a skip. Private,
// unlike profiles.reason. Unique on the log row, so a retry can't double up.
export const saveChangeReason = async (uid, { logId, before, after, reason = null, source = null, shownAt }) =>
  must(await supabase.from("level_reasons").upsert(
    { user_id: uid, level_log_id: logId, before_level: before, after_level: after, reason, source, shown_at: shownAt },
    { onConflict: "level_log_id" },
  ));

// The last 56 days, today included: 28 for patterns, plus 28 before that to
// compare with. Stepping back on the calendar keeps it to local midnight
// across a clock change. levels starts with the last row before the window,
// so a quiet first day still has a level to carry.
export async function loadHistory(uid) {
  const startDay = new Date();
  startDay.setHours(0, 0, 0, 0);
  startDay.setDate(startDay.getDate() - 55);
  const start = startDay.toISOString();
  const [before, levels, checkIns, reasons, questions, pulses] = await Promise.all([
    supabase.from("level_log").select("id, level, created_at").eq("user_id", uid).lt("created_at", start).order("id", { ascending: false }).limit(1),
    supabase.from("level_log").select("id, level, created_at").eq("user_id", uid).gte("created_at", start).order("id"),
    supabase.from("check_ins").select("id, local_date, status, answers:check_in_answers(question_id, option_id, value)").eq("user_id", uid).gte("local_date", localDate(startDay)).order("local_date"),
    supabase.from("level_reasons").select("level_log_id, before_level, after_level, reason, source, shown_at").eq("user_id", uid).gte("shown_at", start).order("shown_at"),
    // All of them, retired too, so old answers keep their labels.
    supabase.from("check_in_questions").select("id, kind, prompt, options"),
    supabase.from("pulses").select("created_at, level, groups").eq("sender_id", uid).gte("created_at", start).order("created_at"),
  ]);
  return {
    levels: [...must(before), ...must(levels)], checkIns: must(checkIns), reasons: must(reasons),
    questions: must(questions), pulses: must(pulses),
  };
}

// Calls back on any change to levels, pulses or seen marks. With a
// circle this size, refetching everything is simpler than patching state.
export function watch(onChange) {
  const ch = supabase.channel("pulse");
  for (const table of ["profiles", "pulses", "pulse_seen"]) ch.on("postgres_changes", { event: "*", schema: "public", table }, onChange);
  ch.subscribe();
  return () => supabase.removeChannel(ch);
}
