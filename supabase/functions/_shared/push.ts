// Shared by notify and morning: a service-role client, the secret check,
// and web push sending.
import webpush from "npm:web-push@3.6.7";
import { createClient } from "npm:@supabase/supabase-js@2";

export const admin = createClient(Deno.env.get("SUPABASE_URL")!, Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!);

webpush.setVapidDetails(Deno.env.get("VAPID_SUBJECT")!, Deno.env.get("VAPID_PUBLIC_KEY")!, Deno.env.get("VAPID_PRIVATE_KEY")!);

// Only the database knows this (it's in Vault), so only triggers and cron
// can make us send anything.
export const authorized = (req: Request) => req.headers.get("x-pulse-secret") === Deno.env.get("PUSH_SECRET");

export type Payload = { title: string; body: string; url: string; tag?: string };

// Sends to every device each user has. Subscriptions the push service
// reports as gone (404/410) are deleted so we stop trying them.
export async function sendToUsers(userIds: string[], payload: Payload, ttl = 6 * 3600) {
  if (!userIds.length) return { sent: 0, dead: 0 };
  const { data: subs, error } = await admin.from("push_subscriptions")
    .select("id, endpoint, p256dh, auth").in("user_id", userIds).eq("platform", "web");
  if (error) throw error;

  const dead: string[] = [];
  let sent = 0;
  await Promise.all((subs ?? []).map(async (s) => {
    try {
      await webpush.sendNotification(
        { endpoint: s.endpoint, keys: { p256dh: s.p256dh, auth: s.auth } },
        JSON.stringify(payload),
        { TTL: ttl, urgency: "high" },
      );
      sent++;
    } catch (e) {
      if (e.statusCode === 404 || e.statusCode === 410) dead.push(s.id);
      else console.error("push failed", e.statusCode, e.body ?? String(e));
    }
  }));
  if (dead.length) await admin.from("push_subscriptions").delete().in("id", dead);
  return { sent, dead: dead.length };
}

// Mirrors statusFor in lib/data.js.
export function statusFor(l: number) {
  if (l <= 20) return { t: "Drained", s: "Taking some time to myself." };
  if (l <= 40) return { t: "Low", s: "Happy to text, not up for plans." };
  if (l <= 60) return { t: "Okay", s: "Could go either way." };
  if (l <= 80) return { t: "Good", s: "Up for something low-key." };
  return { t: "Full", s: "Up for anything." };
}
