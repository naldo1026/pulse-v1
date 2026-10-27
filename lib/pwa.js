import { Platform } from "react-native";

// Browser-only helpers for running as a home-screen web app. Each one is a
// no-op off the web so the native build keeps working.
const web = Platform.OS === "web" && typeof window !== "undefined";

// iPadOS reports itself as a Mac, so check for touch too.
export const isIOS = web && (/iPad|iPhone|iPod/.test(navigator.userAgent) || (navigator.platform === "MacIntel" && navigator.maxTouchPoints > 1));

export const isStandalone = web && (window.matchMedia("(display-mode: standalone)").matches || navigator.standalone === true);

// iOS only lets a home-screen web app use push, and Safari doesn't share
// storage with it, so iPhone users install before they sign in.
export const needsInstall = isIOS && !isStandalone;

export function registerServiceWorker() {
  if (web && "serviceWorker" in navigator) navigator.serviceWorker.register("/sw.js").catch(() => {});
}

const parse = (search) => {
  const q = new URLSearchParams(search);
  return { person: q.get("person"), morning: q.has("morning") };
};

// Notification taps open the app at ?person=<id> or ?morning=1. Read them
// once, then strip them so a reload doesn't replay them.
export function takeLaunchParams() {
  if (!web) return {};
  const params = parse(window.location.search);
  if (window.location.search) window.history.replaceState(null, "", window.location.pathname);
  return params;
}

// A tap while the app is already open arrives as a message from sw.js
// instead of a page load.
export function onNotificationOpen(cb) {
  if (!web || !("serviceWorker" in navigator)) return () => {};
  const handler = (e) => {
    if (e.data?.type === "open") cb(parse(new URL(e.data.url).search));
  };
  navigator.serviceWorker.addEventListener("message", handler);
  return () => navigator.serviceWorker.removeEventListener("message", handler);
}

// iOS suspends a backgrounded web app and drops its realtime socket, so
// callers refetch when it comes back.
export function onForeground(cb) {
  if (!web) return () => {};
  const handler = () => {
    if (document.visibilityState === "visible") cb();
  };
  document.addEventListener("visibilitychange", handler);
  return () => document.removeEventListener("visibilitychange", handler);
}
