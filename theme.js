// Design tokens. Single source of truth.
// Near-white and ink, with one soft streak of light per screen tinted by
// your current level. Everything else is ink at three strengths.

import { useColorScheme } from "react-native";

export const rgba = (hex, a) => {
  const h = hex.replace("#", "");
  return `rgba(${parseInt(h.slice(0, 2), 16)},${parseInt(h.slice(2, 4), 16)},${parseInt(h.slice(4, 6), 16)},${a})`;
};

const LIGHT_INK = "#141413";
const DARK_INK = "#EDEDEB";

export const LIGHT = {
  scheme: "light",
  bg: "#FBFBFA",
  surface: "#FFFFFF",
  raised: "#FFFFFF",
  sunk: "#F1F1EE",
  line: rgba(LIGHT_INK, 0.08),
  lineStrong: rgba(LIGHT_INK, 0.14),
  ink: LIGHT_INK,
  muted: rgba(LIGHT_INK, 0.58),
  faint: rgba(LIGHT_INK, 0.36),
  inverse: "#FFFFFF",
  scrim: rgba(LIGHT_INK, 0.3),
  // Soft neutral lift for cards and the battery. Never coloured.
  shadow: { shadowColor: LIGHT_INK, shadowOpacity: 0.07, shadowRadius: 18, shadowOffset: { width: 0, height: 6 }, elevation: 2 },
  streak: 0.6,
};

export const DARK = {
  scheme: "dark",
  bg: "#111111",
  surface: "#1A1A1A",
  raised: "#2E2E2E",
  sunk: "#222222",
  line: rgba(DARK_INK, 0.09),
  lineStrong: rgba(DARK_INK, 0.18),
  ink: DARK_INK,
  muted: rgba(DARK_INK, 0.6),
  faint: rgba(DARK_INK, 0.38),
  inverse: "#111111",
  scrim: "rgba(0,0,0,0.55)",
  shadow: {},
  streak: 0.42,
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

// Roboto throughout. Headings are bold with tight tracking (see <Display>).
export const FONTS = {
  display: "Roboto_700Bold",
  sans: "Roboto_400Regular",
  medium: "Roboto_500Medium",
  bold: "Roboto_700Bold",
};

// caption 12 · small 13 · body 15 · title 17. Display sizes live on <Display>.
export const T = { caption: 12, small: 13, body: 15, title: 17 };
