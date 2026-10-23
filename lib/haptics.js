import { Platform } from "react-native";
import * as Haptics from "expo-haptics";

// Fire-and-forget. Web has no haptics, so skip it rather than log errors.
export const tick = () => {
  if (Platform.OS !== "web") Haptics.selectionAsync().catch(() => {});
};

export const tap = () => {
  if (Platform.OS !== "web") Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light).catch(() => {});
};
