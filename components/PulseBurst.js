import React, { useEffect, useState } from "react";
import { View } from "react-native";
import Svg, { Defs, RadialGradient, LinearGradient, Stop, Rect } from "react-native-svg";
import Animated, { useSharedValue, useAnimatedStyle, withSequence, withTiming, Easing } from "react-native-reanimated";

// The whole screen lights up in the level colour: two beats of a rim glow,
// a soft body wash, and a band sweeping up through it. One-shot — remount
// via a changing `key` prop at the call site to replay it.

function FillWash({ color }) {
  const o = useSharedValue(0);
  useEffect(() => {
    o.value = withSequence(
      withTiming(0.6, { duration: 125 }),
      withTiming(0, { duration: 213 }),
      withTiming(0.45, { duration: 225 }),
      withTiming(0, { duration: 263 }),
      withTiming(0, { duration: 425 })
    );
  }, []);
  const style = useAnimatedStyle(() => ({ opacity: o.value }));

  return (
    <Animated.View pointerEvents="none" style={[{ position: "absolute", inset: 0 }, style]}>
      <Svg width="100%" height="100%" viewBox="0 0 100 100" preserveAspectRatio="none">
        <Defs>
          <RadialGradient id="fillwash" cx="50%" cy="55%" r="65%">
            <Stop offset="0%" stopColor={color} stopOpacity={0.45} />
            <Stop offset="55%" stopColor={color} stopOpacity={0.18} />
            <Stop offset="85%" stopColor={color} stopOpacity={0} />
          </RadialGradient>
        </Defs>
        <Rect x="0" y="0" width="100" height="100" fill="url(#fillwash)" />
      </Svg>
    </Animated.View>
  );
}

function EdgeGlow({ color }) {
  const o = useSharedValue(0);
  useEffect(() => {
    o.value = withSequence(
      withTiming(1, { duration: 112 }),
      withTiming(0, { duration: 213 }),
      withTiming(0.85, { duration: 225 }),
      withTiming(0, { duration: 250 }),
      withTiming(0, { duration: 450 })
    );
  }, []);
  const style = useAnimatedStyle(() => ({ opacity: o.value }));

  return (
    <Animated.View
      pointerEvents="none"
      style={[
        { position: "absolute", inset: 0, borderWidth: 2, borderColor: color, shadowColor: color, shadowOpacity: 0.7, shadowRadius: 30, shadowOffset: { width: 0, height: 0 } },
        style,
      ]}
    />
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
      withTiming(0.75, { duration: 161 }),
      withTiming(0.5, { duration: 472 }),
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
              <LinearGradient id="sweep" x1="0%" y1="100%" x2="0%" y2="0%">
                <Stop offset="0%" stopColor={color} stopOpacity={0} />
                <Stop offset="45%" stopColor={color} stopOpacity={0.5} />
                <Stop offset="62%" stopColor={color} stopOpacity={0.85} />
                <Stop offset="100%" stopColor={color} stopOpacity={0} />
              </LinearGradient>
            </Defs>
            <Rect x="0" y="0" width="100" height="100" fill="url(#sweep)" />
          </Svg>
        </Animated.View>
      )}
    </View>
  );
}

export default function PulseBurst({ color }) {
  return (
    <View pointerEvents="none" style={{ position: "absolute", inset: 0, overflow: "hidden" }}>
      <FillWash color={color} />
      <EdgeGlow color={color} />
      <SweepUp color={color} />
    </View>
  );
}
