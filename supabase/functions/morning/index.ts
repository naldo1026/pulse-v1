// Called by pg_cron every 5 minutes. claim_due_mornings() picks out whoever's
// check-in time just passed and marks them done for today in one go.
import { admin, authorized, sendToUsers } from "../_shared/push.ts";

Deno.serve(async (req) => {
  if (!authorized(req)) return new Response("unauthorized", { status: 401 });
  const { data: ids, error } = await admin.rpc("claim_due_mornings");
  if (error) {
    console.error(error);
    return new Response(error.message, { status: 500 });
  }
  // A 2 hour TTL: a check-in that arrives at lunchtime is worse than none.
  const res = await sendToUsers(ids ?? [], {
    title: "Morning. How are you feeling?",
    body: "Tap to set your level.",
    url: "/?morning=1",
    tag: "morning",
  }, 2 * 3600);
  return Response.json(res);
});
