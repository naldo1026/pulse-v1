import React, { useEffect, useState } from "react";
import { View } from "react-native";
import Svg, { Defs, RadialGradient, LinearGradient as SvgLinearGradient, Stop, Rect } from "react-native-svg";
import { LinearGradient } from "expo-linear-gradient";
import Animated, { useSharedValue, useAnimatedStyle, withSequence, withTiming, Easing } from "react-native-reanimated";
import { rgba } from "../theme";
import { tap } from "../lib/haptics";

// The whole screen washes with the level colour: two beats of a soft edge
// fade, a body wash, and a band sweeping up through it. One-shot — remount
// via a changing `key` prop at the call site to replay it.

// Beat timings shared by the wash, the edge fade and the haptics.
const BEAT_1 = 0;
const BEAT_2 = 338;

function FillWash({ color }) {
  const o = useSharedValue(0);
  useEffect(() => {
    o.value = withSequence(
      withTiming(0.5, { duration: 125 }),
      withTiming(0, { duration: 213 }),
      withTiming(0.38, { duration: 225 }),
      withTiming(0, { duration: 263 })
    );
  }, []);
  const style = useAnimatedStyle(() => ({ opacity: o.value }));

  return (
    <Animated.View pointerEvents="none" style={[{ position: "absolute", inset: 0 }, style]}>
      <Svg width="100%" height="100%" viewBox="0 0 100 100" preserveAspectRatio="none">
        <Defs>
          <RadialGradient id="fillwash" cx="50%" cy="50%" r="65%">
            <Stop offset="0%" stopColor={color} stopOpacity={0.4} />
            <Stop offset="55%" stopColor={color} stopOpacity={0.14} />
            <Stop offset="85%" stopColor={color} stopOpacity={0} />
          </RadialGradient>
        </Defs>
        <Rect x="0" y="0" width="100" height="100" fill="url(#fillwash)" />
      </Svg>
    </Animated.View>
  );
}

// Soft inward fade on all four edges, in place of a hard border.
function EdgeFade({ color }) {
  const o = useSharedValue(0);
  useEffect(() => {
    o.value = withSequence(
      withTiming(1, { duration: 112 }),
      withTiming(0, { duration: 226 }),
      withTiming(0.8, { duration: 225 }),
      withTiming(0, { duration: 300 })
    );
  }, []);
  const style = useAnimatedStyle(() => ({ opacity: o.value }));
  const cols = [rgba(color, 0.55), rgba(color, 0)];
  const D = 56;

  return (
    <Animated.View pointerEvents="none" style={[{ position: "absolute", inset: 0 }, style]}>
      <LinearGradient colors={cols} start={{ x: 0, y: 0 }} end={{ x: 0, y: 1 }} style={{ position: "absolute", top: 0, left: 0, right: 0, height: D }} />
      <LinearGradient colors={cols} start={{ x: 0, y: 1 }} end={{ x: 0, y: 0 }} style={{ position: "absolute", bottom: 0, left: 0, right: 0, height: D }} />
      <LinearGradient colors={cols} start={{ x: 0, y: 0 }} end={{ x: 1, y: 0 }} style={{ position: "absolute", top: 0, bottom: 0, left: 0, width: D }} />
      <LinearGradient colors={cols} start={{ x: 1, y: 0 }} end={{ x: 0, y: 0 }} style={{ position: "absolute", top: 0, bottom: 0, right: 0, width: D }} />
    </Animated.View>
  );
}

function SweepUp({ color }) {
  const [height, setHeight] = useState(0);
  const o = useSharedValue(0);
  const y = useSharedValue(0);

  useEffect(() => {
    if (!height) return;
    y.value = height;
    y.value = withTiming(-height * 1.05, { duration: 1150, easing: Easing.linear });
    o.value = withSequence(
      withTiming(0.6, { duration: 161 }),
      withTiming(0.4, { duration: 472 }),
      withTiming(0, { duration: 518 })
    );
  }, [height]);

  const style = useAnimatedStyle(() => ({ opacity: o.value, transform: [{ translateY: y.value }] }));

  return (
    <View pointerEvents="none" style={{ position: "absolute", left: 0, right: 0, bottom: 0, height: "60%", overflow: "hidden" }} onLayout={(e) => setHeight(e.nativeEvent.layout.height)}>
      {height > 0 && (
        <Animated.View style={[{ position: "absolute", left: 0, right: 0, bottom: 0, height }, style]}>
          <Svg width="100%" height="100%" viewBox="0 0 100 100" preserveAspectRatio="none">
            <Defs>
              <SvgLinearGradient id="sweep" x1="0%" y1="100%" x2="0%" y2="0%">
                <Stop offset="0%" stopColor={color} stopOpacity={0} />
                <Stop offset="45%" stopColor={color} stopOpacity={0.35} />
                <Stop offset="62%" stopColor={color} stopOpacity={0.6} />
                <Stop offset="100%" stopColor={color} stopOpacity={0} />
              </SvgLinearGradient>
            </Defs>
            <Rect x="0" y="0" width="100" height="100" fill="url(#sweep)" />
          </Svg>
        </Animated.View>
      )}
    </View>
  );
}

export default function PulseBurst({ color }) {
  useEffect(() => {
    const timers = [BEAT_1, BEAT_2].map((ms) => setTimeout(tap, ms));
    return () => timers.forEach(clearTimeout);
  }, []);

  return (
    <View pointerEvents="none" style={{ position: "absolute", inset: 0, overflow: "hidden" }}>
      <FillWash color={color} />
      <EdgeFade color={color} />
      <SweepUp color={color} />
    </View>
  );
}
