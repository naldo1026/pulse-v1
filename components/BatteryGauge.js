import React, { useEffect, useState } from "react";
import { View, StyleSheet } from "react-native";
import { LinearGradient } from "expo-linear-gradient";
import { Gesture, GestureDetector } from "react-native-gesture-handler";
import Animated, {
  useSharedValue, useAnimatedStyle, withSpring, withRepeat, withTiming, runOnJS,
} from "react-native-reanimated";
import { COLORS, GRADIENT_COLORS } from "../theme";

export default function BatteryGauge({ level, onChange, width = 96, height = 260 }) {
  const heightPct = useSharedValue(level);
  const [dragging, setDragging] = useState(false);
  const flicker = useSharedValue(0.85);

  useEffect(() => {
    heightPct.value = dragging ? level : withSpring(level, { damping: 14, stiffness: 120 });
  }, [level, dragging]);

  useEffect(() => {
    flicker.value = dragging ? withRepeat(withTiming(1, { duration: 260 }), -1, true) : 0.85;
  }, [dragging]);

  const setLevelFromY = (y) => {
    "worklet";
    let pct = Math.round(((height - y) / height) * 100);
    pct = Math.max(0, Math.min(100, pct));
    runOnJS(onChange)(pct);
  };

  const pan = Gesture.Pan()
    .onBegin((e) => { runOnJS(setDragging)(true); setLevelFromY(e.y); })
    .onUpdate((e) => setLevelFromY(e.y))
    .onFinalize(() => runOnJS(setDragging)(false));

  // Bottom-anchored window onto a FULL-height gradient. The inner view is
  // pushed up by the empty amount so the colour at any fill height is the
  // colour that belongs there. This is what was inverted before.
  const maskStyle = useAnimatedStyle(() => ({ height: `${heightPct.value}%` }));
  const innerStyle = useAnimatedStyle(() => ({
    height,
    marginTop: -(height * (1 - heightPct.value / 100)),
  }));
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
          <Animated.View style={innerStyle}>
            <LinearGradient
              colors={GRADIENT_COLORS}
              start={{ x: 0, y: 0 }}
              end={{ x: 0, y: 1 }}
              style={{ flex: 1 }}
            />
          </Animated.View>
        </Animated.View>

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
    borderRadius: 18, borderWidth: 2, borderColor: COLORS.line,
    backgroundColor: COLORS.trackBg, overflow: "hidden", position: "relative",
  },
  nub: {
    position: "absolute", top: -10, left: "50%", marginLeft: -16,
    width: 32, height: 8, backgroundColor: COLORS.line, borderRadius: 4, zIndex: 2,
  },
  tick: { position: "absolute", left: 0, right: 0, height: 1, backgroundColor: "rgba(242,240,234,0.07)" },
  mask: { position: "absolute", bottom: 0, left: 0, right: 0, overflow: "hidden" },
  flameWrap: {
    position: "absolute", left: 0, right: 0, height: 3, marginBottom: -1.5,
    shadowColor: COLORS.flame, shadowOpacity: 1, shadowRadius: 6,
    shadowOffset: { width: 0, height: 0 }, zIndex: 3,
  },
});
