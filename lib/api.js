// Every Supabase read and write the app makes. Rows come back mapped to the
// short shapes the screens already use: people are { id, n, l, g, note, extra, ago }.
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
export const aroundFor = (around, until) => (around && until && new Date(until) > new Date() ? `around ${around}` : null);

// When an "I'm around" window ends.
export function untilFor(w) {
  const now = new Date();
  const end = new Date(now);
  if (w === "an hour") return new Date(+now + HOUR).toISOString();
  if (w === "till 10") end.setHours(22, 0, 0, 0);
  else end.setHours(23, 59, 0, 0);
  return new Date(Math.max(+end, +now + HOUR)).toISOString();
}

// Local midnight six days ago: the Week screen's first bar.
export function weekStart() {
  const d = new Date();
  d.setHours(0, 0, 0, 0);
  d.setDate(d.getDate() - 6);
  return d;
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
    supabase.from("profiles").select("id, display_name, level, reason, wants_chat, around, around_until, level_updated_at").neq("id", uid).eq("onboarded", true).order("display_name"),
    supabase.from("groupings").select("member_id, grp"),
  ]);
  const grp = Object.fromEntries(must(gs).map((g) => [g.member_id, g.grp]));
  return must(ps).map((p) => ({
    id: p.id, n: p.display_name, l: p.level, g: grp[p.id] || "friends",
    note: noteFor(p.level, p.reason, p.wants_chat),
    extra: aroundFor(p.around, p.around_until),
    ago: agoFor(p.level_updated_at),
  }));
}

export const setGroup = async (uid, memberId, grp) =>
  must(await supabase.from("groupings").upsert({ owner_id: uid, member_id: memberId, grp }));

// Recipients are filled in by a trigger from your groupings, and another
// trigger hands the pulse to the notify function.
export const sendPulse = async ({ level, reason, groups }) =>
  must(await supabase.from("pulses").insert({ level, reason, groups }).select("id").single()).id;

// Your latest pulse from the last day, and who's marked it seen.
export async function myLatestPulse(uid) {
  const p = must(await supabase.from("pulses").select("id, pulse_seen(viewer_id)").eq("sender_id", uid)
    .gt("created_at", since(24 * HOUR)).order("created_at", { ascending: false }).limit(1).maybeSingle());
  return p && { id: p.id, seen: p.pulse_seen.map((s) => s.viewer_id) };
}

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

// Your level changes this week, plus the last one before it so a week with
// no changes still has a level to carry.
export async function weekLog(uid) {
  const start = weekStart().toISOString();
  const [before, rows] = await Promise.all([
    supabase.from("level_log").select("level, created_at").eq("user_id", uid).lt("created_at", start).order("created_at", { ascending: false }).limit(1),
    supabase.from("level_log").select("level, created_at").eq("user_id", uid).gte("created_at", start).order("created_at"),
  ]);
  return [...must(before), ...must(rows)];
}

// Calls back on any change to levels, pulses or seen marks. With a
// circle this size, refetching everything is simpler than patching state.
export function watch(onChange) {
  const ch = supabase.channel("pulse");
  for (const table of ["profiles", "pulses", "pulse_seen"]) ch.on("postgres_changes", { event: "*", schema: "public", table }, onChange);
  ch.subscribe();
  return () => supabase.removeChannel(ch);
}
