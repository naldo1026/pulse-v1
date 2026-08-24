// Pure logic ported from the prototype. No UI, no native deps.

import { COLORS } from "../theme";

export function colorFor(level) {
  if (level <= 34) return COLORS.ember;
  if (level <= 66) return COLORS.gold;
  return COLORS.mint;
}

export function statusFor(level) {
  if (level <= 20) return { label: "On low power", sub: "Give me space today. No explanation needed." };
  if (level <= 40) return { label: "Still charging", sub: "Up for texts, not up for plans." };
  if (level <= 60) return { label: "Halfway there", sub: "Getting there. Check back later." };
  if (level <= 80) return { label: "Charged up", sub: "Open to a low-key hangout." };
  return { label: "Fully charged", sub: "I'm in for anything." };
}

export const LEVEL_OPTIONS = [
  { level: 10, tag: "Solo time", extra: ["Reading", "Early night"] },
  { level: 20, tag: "Quiet night in", extra: ["Journaling", "Solo cooking"] },
  { level: 30, tag: "Low-key show", extra: ["Podcast", "Bath"] },
  { level: 40, tag: "Early night", extra: ["Text only", "Solo walk"] },
  { level: 50, tag: "Coffee catch-up", extra: ["1:1 chat", "Quiet walk"] },
  { level: 60, tag: "Quiet walk", extra: ["Board game", "Casual coffee"] },
  { level: 70, tag: "Movie night", extra: ["Walk & talk", "Small dinner"] },
  { level: 80, tag: "Small group dinner", extra: ["Live music", "Game night"] },
  { level: 90, tag: "Night out", extra: ["BBQ", "Group dinner"] },
  { level: 100, tag: "BBQ / big group", extra: ["Party", "Festival"] },
];

export function bucketFor(level) {
  const b = Math.min(100, Math.max(10, Math.round(level / 10) * 10));
  return LEVEL_OPTIONS.find((o) => o.level === b);
}

export const MBTI_TYPES = [
  "INTJ", "INTP", "ENTJ", "ENTP",
  "INFJ", "INFP", "ENFJ", "ENFP",
  "ISTJ", "ISFJ", "ESTJ", "ESFJ",
  "ISTP", "ISFP", "ESTP", "ESFP",
];

// Personalisation leans on the I/E axis, the one MBTI dimension that maps
// closely to a well-evidenced trait (Big Five extraversion).
export function personalisedBucket(level, mbti) {
  const base = bucketFor(level);
  if (!mbti) return base;
  const introvert = mbti[0] === "I";
  const intuitive = mbti[1] === "N";

  if (introvert) {
    if (level > 40 && level <= 60)
      return { ...base, tag: "1:1 with someone easy", extra: [intuitive ? "Long walk, big talk" : "Quiet coffee", "Text a close friend"] };
    if (level > 60 && level <= 80)
      return { ...base, tag: "Two or three people, max", extra: ["Dinner at someone's place", intuitive ? "Deep conversation" : "Board game night"] };
    if (level > 80)
      return { ...base, tag: "Something social, with an exit", extra: ["Small gathering", "Dinner then home"] };
  } else {
    if (level > 40 && level <= 60)
      return { ...base, tag: "Low-key company", extra: ["Coffee with a few people", "Someone to run errands with"] };
    if (level > 60 && level <= 80)
      return { ...base, tag: "Get a group together", extra: [intuitive ? "Somewhere new" : "The usual spot", "Dinner with friends"] };
    if (level > 80)
      return { ...base, tag: "Night out, properly", extra: ["Big group dinner", "See where it goes"] };
  }
  return base;
}

export function lowBatteryNoteFor(mbti) {
  if (!mbti) return "No plans suggested at this level. Just rest.";
  return mbti[0] === "I"
    ? "No plans here. Alone is how you actually recharge."
    : "No plans here. Even social batteries need to sit still.";
}

export const REASONS = ["Long day", "Too many people", "Need quiet", "Overstimulated"];

export const VIBE_QUESTIONS = [
  {
    prompt: "How's today treating you?",
    options: [
      { emoji: "\u{1F629}", label: "Rough", value: 15 },
      { emoji: "\u{1F610}", label: "Okay", value: 40 },
      { emoji: "\u{1F642}", label: "Good", value: 65 },
      { emoji: "\u{26A1}", label: "Great", value: 90 },
    ],
  },
  {
    prompt: "Right now you'd rather...",
    options: [
      { emoji: "\u{1F6CB}\u{FE0F}", label: "Be alone", value: 15 },
      { emoji: "\u{1F4AC}", label: "Text one person", value: 40 },
      { emoji: "\u{2615}", label: "See a friend", value: 65 },
      { emoji: "\u{1F389}", label: "Be out with people", value: 90 },
    ],
  },
];

// Mock circle data. Replace with Firestore reads when the backend lands.
export const CIRCLE = [
  { name: "Ronaldo", level: 78, note: "Down for a beer", time: "12m ago", recent: true, around: "till 10" },
  { name: "Kyle", level: 22, note: "Needs quiet tonight", time: "40m ago", recent: true, around: null },
  { name: "Erin", level: 55, note: "Getting there", time: "2h ago", recent: false, around: null },
];

export const HISTORY_DAYS = ["M", "T", "W", "T", "F", "S", "S"];
export const PAST_HISTORY = [45, 60, 30, 70, 55, 20];

export function roomSummary(circle) {
  if (!circle.length) return "Your circle's empty for now.";
  const avg = circle.reduce((s, p) => s + p.level, 0) / circle.length;
  const low = circle.filter((p) => p.level <= 40).length;
  const high = circle.filter((p) => p.level > 70).length;
  if (low === circle.length) return "Everyone's running low tonight.";
  if (high === circle.length) return "Everyone's up for something.";
  if (avg <= 40) return "Your circle's having a quiet one.";
  if (high >= 2) return "There's energy in the group tonight.";
  if (low >= 2) return "Mostly a quiet night for your circle.";
  if (avg >= 65) return "Your circle's got a bit of life in it.";
  return "A mixed evening in your circle.";
}

export function lowCompanions(circle) {
  return circle.filter((p) => p.level <= 40).map((p) => p.name);
}

export function companionLine(names) {
  if (!names.length) return null;
  if (names.length === 1) return `${names[0]} is running low too.`;
  if (names.length === 2) return `${names[0]} and ${names[1]} are low too.`;
  return `${names.slice(0, -1).join(", ")} and ${names[names.length - 1]} are low too.`;
}

export function weeklyInsight(history) {
  const avg = Math.round(history.reduce((s, v) => s + v, 0) / history.length);
  let lowIdx = 0;
  history.forEach((v, i) => {
    if (v < history[lowIdx]) lowIdx = i;
  });
  const DAY_NAMES = ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday", "Sunday"];
  return { avg, lowDay: DAY_NAMES[lowIdx], lowValue: history[lowIdx] };
}

const ACTIVITY_KEYWORDS = [
  { match: /beer/i, phrase: "Grab a beer" },
  { match: /bbq/i, phrase: "Hit that BBQ" },
  { match: /dinner/i, phrase: "Grab dinner" },
  { match: /coffee/i, phrase: "Grab a coffee" },
  { match: /walk/i, phrase: "Go for a walk" },
];

export function findMatches(level, circle = CIRCLE) {
  if (level <= 40) return [];
  return circle
    .filter((p) => p.level > 40 && Math.abs(p.level - level) <= 15)
    .map((p) => {
      const hit = ACTIVITY_KEYWORDS.find((k) => k.match.test(p.note));
      return hit ? { name: p.name, phrase: hit.phrase } : null;
    })
    .filter(Boolean);
}
