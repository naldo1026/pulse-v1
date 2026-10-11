// Design tokens. Single source of truth.
// Dusk to dawn. Low is night and candlelight, not alarm. Full is sunrise.
// Nothing in this ramp reads as an error state.

export const INK = "#0A0716";
export const PANEL = "#140F26";

export const VIOLET = "#8B5CF6"; // low  — restful night
export const ROSE = "#FF5D8F"; // mid  — warm dusk
export const GOLD = "#FFC145"; // high — daylight
export const AQUA = "#4CC9F0"; // cool accent, used for type/insight only
export const PAPER = "#FBF7F0";
export const SPOT = "#1DB954"; // spotify brand green

// Small-text scale. Three sizes only, so everything lines up.
// micro 11 · small 12.5 · body 14. Nothing below 11 anywhere.
export const T = { micro: 11, small: 12.5, body: 14 };

export const FONTS = {
  script: "Caveat_700Bold",
  sans: "PlusJakartaSans_400Regular",
  sansMedium: "PlusJakartaSans_500Medium",
  sansSemiBold: "PlusJakartaSans_600SemiBold",
  sansBold: "PlusJakartaSans_700Bold",
  sansExtraBold: "PlusJakartaSans_800ExtraBold",
  mono: "IBMPlexMono_400Regular",
  monoMedium: "IBMPlexMono_500Medium",
};

export const rgba = (hex, a) => {
  const h = hex.replace("#", "");
  return `rgba(${parseInt(h.slice(0, 2), 16)},${parseInt(h.slice(2, 4), 16)},${parseInt(h.slice(4, 6), 16)},${a})`;
};
