import React, { useEffect, useState } from "react";
import { View, StyleSheet } from "react-native";
import { LinearGradient } from "expo-linear-gradient";
import { Gesture, GestureDetector } from "react-native-gesture-handler";
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withSpring,
  withRepeat,
  withTiming,
  runOnJS,
} from "react-native-reanimated";
import { COLORS, GRADIENT_COLORS } from "../theme";

export default function BatteryGauge({ level, onChange, width = 84, height = 260 }) {
  const heightPct = useSharedValue(level);
  const [dragging, setDragging] = useState(false);
  const flicker = useSharedValue(0.8);

  useEffect(() => {
    // Snap instantly while dragging so the flame tracks the finger,
    // spring back into place on release.
    heightPct.value = dragging ? level : withSpring(level, { damping: 14, stiffness: 120 });
  }, [level, dragging]);

  useEffect(() => {
    if (dragging) {
      flicker.value = withRepeat(withTiming(1, { duration: 280 }), -1, true);
    } else {
      flicker.value = 0.8;
    }
  }, [dragging]);

  const setLevelFromY = (y) => {
    "worklet";
    let pct = Math.round(((height - y) / height) * 100);
    pct = Math.max(0, Math.min(100, pct));
    runOnJS(onChange)(pct);
  };

  const pan = Gesture.Pan()
    .onBegin((e) => {
      runOnJS(setDragging)(true);
      setLevelFromY(e.y);
    })
    .onUpdate((e) => setLevelFromY(e.y))
    .onFinalize(() => runOnJS(setDragging)(false));

  const maskStyle = useAnimatedStyle(() => ({ height: `${heightPct.value}%` }));
  const flameStyle = useAnimatedStyle(() => ({
    bottom: `${heightPct.value}%`,
    opacity: flicker.value,
  }));

  return (
    <GestureDetector gesture={pan}>
      <View style={[styles.track, { width, height }]}>
        <View style={styles.nub} />

        {[25, 50, 75].map((t) => (
          <View key={t} style={[styles.tick, { bottom: `${t}%` }]} />
        ))}

        <Animated.View style={[styles.mask, maskStyle]}>
          <LinearGradient
            colors={GRADIENT_COLORS}
            start={{ x: 0, y: 0 }}
            end={{ x: 0, y: 1 }}
            style={{ position: "absolute", bottom: 0, left: 0, right: 0, height }}
          />
        </Animated.View>

        {/* thin blue flame riding the fill edge while dragging */}
        {dragging && level > 0 && level < 100 && (
          <Animated.View style={[styles.flameWrap, flameStyle]} pointerEvents="none">
            <LinearGradient
              colors={["transparent", COLORS.flame, COLORS.flameLight, COLORS.flame, "transparent"]}
              locations={[0, 0.2, 0.5, 0.8, 1]}
              start={{ x: 0, y: 0.5 }}
              end={{ x: 1, y: 0.5 }}
              style={{ flex: 1 }}
            />
          </Animated.View>
        )}
      </View>
    </GestureDetector>
  );
}

const styles = StyleSheet.create({
  track: {
    borderRadius: 14,
    borderWidth: 2,
    borderColor: COLORS.line,
    backgroundColor: COLORS.trackBg,
    overflow: "hidden",
    position: "relative",
  },
  nub: {
    position: "absolute",
    top: -10,
    left: "50%",
    marginLeft: -14,
    width: 28,
    height: 8,
    backgroundColor: COLORS.line,
    borderRadius: 4,
  },
  tick: { position: "absolute", left: 0, right: 0, height: 1, backgroundColor: "rgba(237,234,227,0.08)" },
  mask: { position: "absolute", bottom: 0, left: 0, right: 0, overflow: "hidden" },
  flameWrap: {
    position: "absolute",
    left: 0,
    right: 0,
    height: 3,
    marginBottom: -1.5,
    shadowColor: COLORS.flame,
    shadowOpacity: 0.9,
    shadowRadius: 5,
    shadowOffset: { width: 0, height: 0 },
  },
});
