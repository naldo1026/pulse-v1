// Called by triggers on pulses, nudges and circle requests with
// { table, id }, and when a request is accepted with
// { table: "accepted", from, to }. Looks the rows up rather than trusting
// the body, then pushes to whoever it's for.
import { admin, authorized, sendToUsers, statusFor } from "../_shared/push.ts";

const NUDGES: Record<string, [string, string]> = {
  ask: ["wants to meet up", "You're both up for something."],
  in: ["is in", "They're up for joining you."],
  maybe: ["might join", "Not a yes yet, but not a no."],
};

const profileOf = async (id: string) =>
  (await admin.from("profiles").select("display_name, wants_chat, around, around_until").eq("id", id).single()).data!;

Deno.serve(async (req) => {
  if (!authorized(req)) return new Response("unauthorized", { status: 401 });
  const { table, id, from, to } = await req.json();

  if (table === "pulses") {
    const { data: p } = await admin.from("pulses").select("sender_id, level, reason, recipient_ids").eq("id", id).single();
    if (!p) return new Response("no such pulse", { status: 404 });
    const who = await profileOf(p.sender_id);
    const st = statusFor(p.level);
    const bits = p.level <= 40
      ? [p.reason, who.wants_chat && "Open to a chat"]
      : [p.level > 60 && who.around && new Date(who.around_until) > new Date() && `Around ${who.around}`];
    const res = await sendToUsers(p.recipient_ids, {
      title: `${who.display_name} · ${st.t}`,
      body: bits.filter(Boolean).join(". ") || st.s,
      url: `/?person=${p.sender_id}`,
      tag: `pulse-${p.sender_id}`,
    });
    return Response.json(res);
  }

  if (table === "nudges") {
    const { data: n } = await admin.from("nudges").select("from_id, to_id, kind").eq("id", id).single();
    if (!n) return new Response("no such nudge", { status: 404 });
    const who = await profileOf(n.from_id);
    const [what, body] = NUDGES[n.kind];
    const res = await sendToUsers([n.to_id], {
      title: `${who.display_name} ${what}`,
      body,
      url: `/?person=${n.from_id}`,
    }, 3 * 3600);
    return Response.json(res);
  }

  if (table === "circle_requests") {
    const { data: r } = await admin.from("circle_requests").select("from_id, to_id").eq("id", id).maybeSingle();
    // Gone means it was accepted or cancelled before this ran.
    if (!r) return Response.json({ sent: 0, gone: true });
    // Someone they've declined or removed can still ask, but it doesn't buzz.
    const { data: declined } = await admin.from("circle_declines").select("owner_id")
      .eq("owner_id", r.to_id).eq("from_id", r.from_id).maybeSingle();
    if (declined) return Response.json({ sent: 0, declined: true });
    const who = await profileOf(r.from_id);
    const res = await sendToUsers([r.to_id], {
      title: `${who.display_name} wants to add you`,
      body: "Accept and you'll see each other's levels.",
      url: "/?requests=1",
      tag: `request-${r.from_id}`,
    });
    return Response.json(res);
  }

  if (table === "accepted") {
    const { data: c } = await admin.from("connections").select("id").eq("user_id", to).eq("friend_id", from).maybeSingle();
    if (!c) return Response.json({ sent: 0, gone: true });
    const who = await profileOf(from);
    const res = await sendToUsers([to], {
      title: `${who.display_name} accepted`,
      body: "You're in each other's circles now.",
      url: `/?person=${from}`,
      tag: `accepted-${from}`,
    });
    return Response.json(res);
  }

  return new Response("unknown table", { status: 400 });
});
