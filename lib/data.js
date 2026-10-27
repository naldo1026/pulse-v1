// Level-to-colour/status logic and fixed copy. Live data comes from
// Supabase through lib/api.js.

// Selectable ramps, five stops each: empty -> full. Muted on purpose so the
// fluid reads as colour without shouting. `dark` overrides the stops when the
// phone is in dark mode (only needed where the light ramp would vanish).
export const THEMES = {
  dusk: { label: "Dusk", stops: ["#9A8FC7", "#B394C2", "#D49DA8", "#E0AE8C", "#DEC17A"] },
  sage: { label: "Sage", stops: ["#C98A75", "#D6A37D", "#D4BE8A", "#A9C095", "#7FAD8B"] },
  sea: { label: "Sea", stops: ["#7387B8", "#779FC0", "#7FB6BF", "#86C3AE", "#9CCB9C"] },
  quiet: {
    label: "Quiet",
    stops: ["#C9C4BA", "#ADA89E", "#8F8A81", "#6E6A63", "#4A4742"],
    dark: ["#46443F", "#5E5C57", "#7B7973", "#A09D96", "#CBC8C0"],
  },
};

export const stopsFor = (id, scheme) => (scheme === "dark" && THEMES[id].dark) || THEMES[id].stops;

// Mutable so every existing colorFor() call picks up a theme change with no
// prop threading through the whole tree. The root screen calls setRamp()
// unconditionally before rendering children each pass, so render order keeps
// everything in sync.
export let RAMP = THEMES.dusk.stops;
export const setRamp = (id, scheme) => { RAMP = stopsFor(id, scheme); };

const rampIndex = (l) => (l <= 20 ? 0 : l <= 40 ? 1 : l <= 60 ? 2 : l <= 80 ? 3 : 4);

export const colorFor = (l) => RAMP[rampIndex(l)];

// The neighbouring stop, for two-tone touches like the background streak.
export const accentFor = (l) => {
  const i = rampIndex(l);
  return RAMP[i < 4 ? i + 1 : 3];
};

export function statusFor(l) {
  if (l <= 20) return { t: "Drained", s: "Taking some time to myself." };
  if (l <= 40) return { t: "Low", s: "Happy to text, not up for plans." };
  if (l <= 60) return { t: "Okay", s: "Could go either way." };
  if (l <= 80) return { t: "Good", s: "Up for something low-key." };
  return { t: "Full", s: "Up for anything." };
}

export const REASONS = ["Long day", "Too many people", "Need quiet", "Overwhelmed"];

export const MBTI_NOTE = (t) =>
  t[0] === "I"
    ? "You recharge on your own. Quiet days count as rest, not dips."
    : "You recharge around people. Company tends to bring you back up.";

export const MBTI = ["INTJ", "INTP", "ENTJ", "ENTP", "INFJ", "INFP", "ENFJ", "ENFP", "ISTJ", "ISFJ", "ESTJ", "ESFJ", "ISTP", "ISFP", "ESTP", "ESFP"];

export const GROUPS = [
  { id: "household", label: "Home", note: "People you live with" },
  { id: "family", label: "Family", note: "However you define it" },
  { id: "friends", label: "Friends", note: "The ones who'd notice" },
];

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
    q: "How's today been?",
    o: [["Rough", "Nothing left", 15], ["Okay", "Getting through it", 40], ["Good", "Steady", 65], ["Great", "Really good", 90]],
  },
  {
    q: "Right now, you'd rather…",
    o: [["Be alone", "Door shut, phone down", 15], ["Text someone", "Words, not faces", 40], ["See one person", "Somewhere quiet", 65], ["Go out", "People, noise, all of it", 90]],
  },
];
