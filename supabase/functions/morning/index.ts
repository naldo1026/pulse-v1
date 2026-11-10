// Called by pg_cron every 5 minutes. claim_due_mornings() picks out whoever's
// check-in time just passed and marks them done for today in one go.
import { admin, authorized, sendToUsers } from "../_shared/push.ts";
import { MONDAY_MORNING, MORNING, splitMornings } from "./copy.ts";

// A 2 hour TTL: a check-in that arrives at lunchtime is worse than none.
const TTL = 2 * 3600;

Deno.serve(async (req) => {
  if (!authorized(req)) return new Response("unauthorized", { status: 401 });
  const { data: ids, error } = await admin.rpc("claim_due_mornings");
  if (error) {
    console.error(error);
    return new Response(error.message, { status: 500 });
  }
  if (!ids?.length) return Response.json({ sent: 0, dead: 0 });

  // Monday is the person's own Monday. If the zones can't be read, everyone
  // still gets the everyday push: they've been claimed, so it's now or never.
  const { data: rows, error: zoneError } = await admin.from("settings").select("user_id, timezone").in("user_id", ids);
  if (zoneError) console.error(zoneError);
  const zones = new Map((rows ?? []).map((r) => [r.user_id, r.timezone]));
  const { monday, other } = splitMornings(ids, zones, new Date());

  const [a, b] = await Promise.all([sendToUsers(monday, MONDAY_MORNING, TTL), sendToUsers(other, MORNING, TTL)]);
  return Response.json({ sent: a.sent + b.sent, dead: a.dead + b.dead, monday: monday.length });
});
