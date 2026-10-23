// Design tokens. Single source of truth.
// Warm paper and ink. The battery fluid is the only real colour on screen;
// everything else is ink at three strengths.

import { useColorScheme } from "react-native";

export const rgba = (hex, a) => {
  const h = hex.replace("#", "");
  return `rgba(${parseInt(h.slice(0, 2), 16)},${parseInt(h.slice(2, 4), 16)},${parseInt(h.slice(4, 6), 16)},${a})`;
};

const LIGHT_INK = "#1A1A18";
const DARK_INK = "#EDEBE6";

export const LIGHT = {
  scheme: "light",
  bg: "#F6F4EF",
  surface: "#FFFFFF",
  raised: "#FFFFFF",
  sunk: "#EDEAE3",
  line: rgba(LIGHT_INK, 0.09),
  lineStrong: rgba(LIGHT_INK, 0.16),
  ink: LIGHT_INK,
  muted: rgba(LIGHT_INK, 0.56),
  faint: rgba(LIGHT_INK, 0.34),
  inverse: "#F6F4EF",
  scrim: rgba(LIGHT_INK, 0.28),
};

export const DARK = {
  scheme: "dark",
  bg: "#131312",
  surface: "#1C1C1A",
  raised: "#31312E",
  sunk: "#242422",
  line: rgba(DARK_INK, 0.09),
  lineStrong: rgba(DARK_INK, 0.18),
  ink: DARK_INK,
  muted: rgba(DARK_INK, 0.58),
  faint: rgba(DARK_INK, 0.36),
  inverse: "#131312",
  scrim: "rgba(0,0,0,0.55)",
};

export function useTheme() {
  return useColorScheme() === "dark" ? DARK : LIGHT;
}

// Readable text colour to sit on top of a fill colour.
export const onColor = (hex) => {
  const h = hex.replace("#", "");
  const [r, g, b] = [0, 2, 4].map((i) => parseInt(h.slice(i, i + 2), 16) / 255);
  return 0.2126 * r + 0.7152 * g + 0.0722 * b > 0.48 ? rgba(LIGHT_INK, 0.78) : "rgba(255,255,255,0.92)";
};

// Inter for everything you read, Instrument Serif for the few words that
// carry the mood (status, screen titles).
export const FONTS = {
  display: "InstrumentSerif_400Regular",
  displayItalic: "InstrumentSerif_400Regular_Italic",
  sans: "Inter_400Regular",
  medium: "Inter_500Medium",
  semibold: "Inter_600SemiBold",
};

// caption 12 · small 13 · body 15 · title 17. Display sizes live on <Display>.
export const T = { caption: 12, small: 13, body: 15, title: 17 };
