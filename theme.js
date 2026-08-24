// Design tokens. Single source of truth. Don't inline hex values in screens.

export const COLORS = {
  ink: "#050D1A",
  card: "#0C1B30",
  line: "#16304F",
  ember: "#2C5580",
  gold: "#B8934A",
  mint: "#1B5FC0",
  spotify: "#1DB954",
  paper: "#EDEFF2",
  muted: "#6E85A0",
  trackBg: "#030811",
  flame: "#D4AF5A",
  flameLight: "#EFE2C4",
};

// Top to bottom. Mint at full, ember at empty.
export const GRADIENT_COLORS = [COLORS.mint, COLORS.gold, COLORS.ember];

export const FONTS = {
  display: "SpaceGrotesk_600SemiBold",
  body: "Inter_400Regular",
  bodyBold: "Inter_600SemiBold",
  mono: "JetBrainsMono_600SemiBold",
};
