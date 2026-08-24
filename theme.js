// Design tokens. Single source of truth. Don't inline hex values in screens.

export const COLORS = {
  ink: "#14131F",
  card: "#1D1B2B",
  line: "#2C2941",
  ember: "#FF6B4A",
  gold: "#F4C77B",
  mint: "#7FE7C4",
  spotify: "#1DB954",
  paper: "#EDEAE3",
  muted: "#8B889C",
  trackBg: "#100F19",
  flame: "#35C7FF",
  flameLight: "#DFF6FF",
};

// Top to bottom. Mint at full, ember at empty.
export const GRADIENT_COLORS = [COLORS.mint, COLORS.gold, COLORS.ember];

export const FONTS = {
  display: "SpaceGrotesk_600SemiBold",
  body: "Inter_400Regular",
  bodyBold: "Inter_600SemiBold",
  mono: "JetBrainsMono_600SemiBold",
};
