// Mock data + level-to-colour/status logic. Everything here is in-memory —
// no persistence, no backend. Ported from the pulse-v7 design.

// Selectable ramps. Each is five stops: empty -> full.
export const THEMES = {
  dusk: { label: "Dusk", note: "violet to gold", stops: ["#8B5CF6", "#B45CE0", "#FF5D8F", "#FFA24C", "#FFC145"] },
  battery: { label: "Battery", note: "clay to green", stops: ["#E0776B", "#EE9A63", "#F0C05A", "#7ED9A0", "#4FCB86"] },
  ocean: { label: "Ocean", note: "deep to bright", stops: ["#3D5AFE", "#4A8FE0", "#4CC9F0", "#4FE0C8", "#5BF0A8"] },
  ember: { label: "Ember", note: "warm throughout", stops: ["#C2453C", "#E0664A", "#F09A4C", "#F5C24E", "#FFE07A"] },
  mono: { label: "Quiet", note: "no colour cues", stops: ["#5A6270", "#77808F", "#97A0AE", "#BAC2CE", "#E2E7EE"] },
};

// Mutable so every existing colorFor() call picks up a theme change with no
// prop threading through the whole tree. The root screen calls setRamp(theme)
// unconditionally before rendering children each pass, so render order keeps
// everything in sync.
export let RAMP = THEMES.dusk.stops;
export const setRamp = (id) => { RAMP = THEMES[id].stops; };

export const colorFor = (l) =>
  l <= 20 ? RAMP[0] : l <= 40 ? RAMP[1] : l <= 66 ? RAMP[2] : l <= 85 ? RAMP[3] : RAMP[4];

export function statusFor(l) {
  if (l <= 20) return { t: "running on empty", s: "Don't ask if I'm okay. I'm just done." };
  if (l <= 40) return { t: "still charging", s: "Texts, yes. Faces, no." };
  if (l <= 60) return { t: "halfway there", s: "Could go either way tonight." };
  if (l <= 80) return { t: "charged up", s: "Something small would be nice." };
  return { t: "fully charged", s: "Say the word." };
}

export const REASONS = ["long day", "too many people", "need quiet", "overstimulated"];

export const VIBE_ROUNDS = [
  {
    at: 25, ask: "On a 25% evening,\nwhat sounds right?",
    why: "So nobody suggests a night out when you've got nothing left.",
    opts: ["Bed early", "A show, alone", "Bath and a podcast", "Text one person"],
  },
  {
    at: 55, ask: "At 55%,\nwhat could you manage?",
    why: "The tricky one. This is where people misread you.",
    opts: ["A quiet coffee", "One friend, one drink", "A walk", "Cook with someone"],
  },
  {
    at: 85, ask: "At 85%,\nwhat are you up for?",
    why: "So when you've got it in you, they know what to ask.",
    opts: ["Dinner with friends", "A proper night out", "Something new", "Have people over"],
  },
];

export const VIBES = [
  { v: 10, t: "Solo time" }, { v: 20, t: "Quiet night in" },
  { v: 30, t: "Low-key show" }, { v: 40, t: "Early night" },
  { v: 50, t: "Coffee catch-up" }, { v: 60, t: "Quiet walk" },
  { v: 70, t: "Movie night" }, { v: 80, t: "Small dinner" },
  { v: 90, t: "Night out" }, { v: 100, t: "Big group" },
];

export const MBTI_NOTE = (t) => {
  const i = t[0] === "I", n = t[1] === "N", f = t[2] === "F";
  return {
    axis: i ? "You refill alone" : "You refill around people",
    line: i
      ? `Quiet time isn't a dip for you, it's the recharge. We'll keep suggestions small${f ? " and one-to-one" : ""} until you're well up.`
      : `Being around people is often what brings you back up. We'll nudge toward company earlier${n ? ", and toward something new" : ""}.`,
  };
};

export const MBTI = ["INTJ", "INTP", "ENTJ", "ENTP", "INFJ", "INFP", "ENFJ", "ENFP", "ISTJ", "ISFJ", "ESTJ", "ESFJ", "ISTP", "ISFP", "ESTP", "ESFP"];

export const GROUPS = [
  { id: "household", label: "Household", short: "Home", note: "who you live with" },
  { id: "family", label: "Family", short: "Family", note: "however you define it" },
  { id: "friends", label: "Closest friends", short: "Friends", note: "the ones who'd notice" },
];

export const SUGGESTED = [
  { n: "Ronaldo", g: "household" },
  { n: "Kyle", g: "household" },
  { n: "Erin", g: "friends" },
  { n: "Mum", g: "family" },
  { n: "Sam", g: "friends" },
];

export const PEOPLE = [
  { n: "Ronaldo", g: "household", l: 78, note: "down for a beer", extra: "around till 10", ago: "12m" },
  { n: "Kyle", g: "household", l: 22, note: "needs quiet", extra: null, ago: "40m" },
  { n: "Erin", g: "friends", l: 55, note: "getting there", extra: null, ago: "2h" },
  { n: "Sam", g: "friends", l: 88, note: "out already", extra: "around all evening", ago: "25m" },
  { n: "Mum", g: "family", l: 62, note: "free to call", extra: null, ago: "4h" },
];

export const WEEK = [45, 60, 30, 70, 55, 20];
export const DAYS = ["M", "T", "W", "T", "F", "S", "S"];

export const LIBRARY = {
  low: [
    { t: "Skinny Love", a: "Bon Iver" },
    { t: "Motion Picture Soundtrack", a: "Radiohead" },
    { t: "Night Time, My Time", a: "Sky Ferreira" },
    { t: "Cherry Wine", a: "Hozier" },
  ],
  mid: [
    { t: "Sunflower", a: "Post Malone, Swae Lee" },
    { t: "電光石火", a: "Mitski" },
    { t: "Redbone", a: "Childish Gambino" },
    { t: "Nights", a: "Frank Ocean" },
  ],
  high: [
    { t: "Levitating", a: "Dua Lipa" },
    { t: "Good as Hell", a: "Lizzo" },
    { t: "Rasputin", a: "Boney M." },
    { t: "One More Time", a: "Daft Punk" },
  ],
};

export const QUIZ = [
  {
    q: "How's today treating you?",
    o: [["Rough", "nothing left in the tank", 15], ["Okay", "getting through it", 40], ["Good", "steady enough", 65], ["Great", "genuinely buzzing", 90]],
  },
  {
    q: "Right now you'd rather…",
    o: [["Be alone", "door shut, phone down", 15], ["Text one person", "words yes, faces no", 40], ["See a friend", "one person, somewhere quiet", 65], ["Be out", "noise, people, all of it", 90]],
  },
];
