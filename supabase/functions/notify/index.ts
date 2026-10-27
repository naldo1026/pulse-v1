// Called by triggers on pulses and nudges with { table, id }. Looks the row
// up rather than trusting the body, then pushes to whoever it's for.
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
  const { table, id } = await req.json();

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

  return new Response("unknown table", { status: 400 });
});
