// Design tokens. Single source of truth.
// Brand: electric blue flame against deep ink. Battery runs coral (empty)
// through amber (mid) to a vivid teal (full).

export const COLORS = {
  ink: "#0A0A14",
  inkRaised: "#12121F",
  card: "#181829",
  line: "#2A2A42",

  // Battery scale. Saturated so it reads instantly at a glance.
  ember: "#FF5C39",
  gold: "#FFB627",
  mint: "#2DE8A0",

  // Brand flame
  flame: "#3AAFFF",
  flameLight: "#B8E8FF",
  flameDeep: "#0A4A8F",

  spotify: "#1DB954",
  paper: "#F2F0EA",
  muted: "#7C7A92",
  trackBg: "#0D0D18",
};

// Rendered TOP to BOTTOM inside the gauge: full = teal at top,
// empty = coral at the bottom.
export const GRADIENT_COLORS = [COLORS.mint, COLORS.gold, COLORS.ember];

export const FONTS = {
  display: "SpaceGrotesk_600SemiBold",
  body: "Inter_400Regular",
  bodyBold: "Inter_600SemiBold",
  mono: "JetBrainsMono_600SemiBold",
};
