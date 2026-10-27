import { Platform } from "react-native";
import { supabase } from "./supabase";

// Web push. The browser gives us a subscription (endpoint + keys), we keep
// it in push_subscriptions, and supabase/functions/notify sends to it.

export const pushSupported =
  Platform.OS === "web" && typeof window !== "undefined" &&
  "serviceWorker" in navigator && "PushManager" in window && "Notification" in window;

// "granted" | "denied" | "default" | "unsupported"
export const pushPermission = () => (pushSupported ? Notification.permission : "unsupported");

const toKey = (b64) => {
  const raw = atob((b64 + "=".repeat((4 - (b64.length % 4)) % 4)).replace(/-/g, "+").replace(/_/g, "/"));
  return Uint8Array.from(raw, (c) => c.charCodeAt(0));
};

async function save(userId) {
  const reg = await navigator.serviceWorker.ready;
  const sub = (await reg.pushManager.getSubscription()) ||
    (await reg.pushManager.subscribe({ userVisibleOnly: true, applicationServerKey: toKey(process.env.EXPO_PUBLIC_VAPID_PUBLIC_KEY) }));
  const { endpoint, keys } = sub.toJSON();
  const { error } = await supabase.from("push_subscriptions").upsert(
    { user_id: userId, endpoint, p256dh: keys.p256dh, auth: keys.auth, last_seen_at: new Date().toISOString() },
    { onConflict: "endpoint" }
  );
  if (error) throw error;
}

// Call straight from a tap handler. iOS only shows the prompt during a user
// gesture, and any await before requestPermission() loses it. Resolves with
// the answer as soon as there is one. The save carries on behind it, and
// refreshPush retries it on the next launch if it fails.
export function enablePush(userId) {
  if (!pushSupported) return Promise.resolve("unsupported");
  return Notification.requestPermission().then((p) => {
    if (p === "granted") save(userId).catch((e) => console.warn("push subscribe failed", e));
    return p;
  });
}

// On every launch. iOS can swap a subscription out from under us.
export function refreshPush(userId) {
  if (pushPermission() === "granted") save(userId).catch(() => {});
}

// On sign out, so the next person on this phone doesn't get your pushes.
export async function forgetDevice() {
  if (!pushSupported) return;
  const reg = await navigator.serviceWorker.getRegistration();
  const sub = reg && (await reg.pushManager.getSubscription());
  if (sub) await supabase.from("push_subscriptions").delete().eq("endpoint", sub.endpoint);
}
