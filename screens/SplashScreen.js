import React, { useEffect } from "react";
import { View, Text } from "react-native";
import Svg, { Defs, LinearGradient, Stop, Circle } from "react-native-svg";
import Animated, { useSharedValue, useAnimatedStyle, withRepeat, withSequence, withTiming, Easing } from "react-native-reanimated";
import { INK, PAPER, AQUA, FONTS, rgba } from "../theme";
import { RAMP } from "../lib/data";

const SIZE = 190;

// No conic-gradient primitive in RN. Approximated the same way
// components/FlameRing.js already did for its ambient ring: a partial
// arc (strokeDasharray leaves most of the circle empty) with a
// multi-stop gradient along it, rotated via Reanimated.
function SpinRing({ diameter, colors, durationMs, reverse, strokeWidth = 10 }) {
  const rot = useSharedValue(0);

  useEffect(() => {
    const target = reverse ? -360 : 360;
    rot.value = withRepeat(withTiming(target, { duration: durationMs, easing: Easing.linear }), -1);
  }, []);

  const style = useAnimatedStyle(() => ({ transform: [{ rotate: `${rot.value}deg` }] }));
  const gradId = `splashRing-${diameter}-${reverse ? "r" : "f"}`;
  const R = diameter / 2 - strokeWidth / 2;
  const CIRC = 2 * Math.PI * R;
  const arc = CIRC * 0.44;

  return (
    <Animated.View style={[{ position: "absolute", width: diameter, height: diameter }, style]}>
      <Svg width={diameter} height={diameter}>
        <Defs>
          <LinearGradient id={gradId} x1="0%" y1="0%" x2="100%" y2="0%">
            {colors.map((col, i) => (
              <Stop key={i} offset={`${(i / (colors.length - 1)) * 100}%`} stopColor={col} stopOpacity={i === 0 || i === colors.length - 1 ? 0 : 1} />
            ))}
          </LinearGradient>
        </Defs>
        <Circle
          cx={diameter / 2}
          cy={diameter / 2}
          r={R}
          fill="none"
          stroke={`url(#${gradId})`}
          strokeWidth={strokeWidth}
          strokeLinecap="round"
          strokeDasharray={`${arc} ${CIRC - arc}`}
        />
      </Svg>
    </Animated.View>
  );
}

export default function SplashScreen() {
  const glow = useSharedValue(16);

  useEffect(() => {
    glow.value = withRepeat(
      withSequence(
        withTiming(1, { duration: 950, easing: Easing.inOut(Easing.quad) }),
        withTiming(0.4, { duration: 950, easing: Easing.inOut(Easing.quad) })
      ),
      -1
    );
  }, []);

  // textShadowRadius on iOS Fabric rasterizes as an opaque box behind the
  // glyphs instead of a soft blur in this RN version, so the glow is faked
  // instead with offset colour copies of the text (no textShadow* at all),
  // with the whole glow layer's opacity pulsing.
  const glowStyle = useAnimatedStyle(() => ({ opacity: glow.value }));
  const wordmarkStyle = { fontFamily: FONTS.script, fontSize: 54, lineHeight: 54 * 1.06 };
  const OFFSETS = [[-2, 0], [2, 0], [0, -2], [0, 2], [-1.5, -1.5], [1.5, 1.5]];

  return (
    <View style={{ flex: 1, backgroundColor: INK, alignItems: "center", justifyContent: "center" }}>
      <View style={{ width: SIZE, height: SIZE, alignItems: "center", justifyContent: "center" }}>
        <SpinRing diameter={SIZE} colors={["transparent", RAMP[0], RAMP[2], RAMP[3], RAMP[4], "transparent"]} durationMs={3400} />
        <SpinRing diameter={SIZE - 32} colors={["transparent", RAMP[4], RAMP[2], "transparent"]} durationMs={4800} reverse strokeWidth={7} />
        <View style={{ position: "absolute", width: SIZE - 56, height: SIZE - 56, borderRadius: (SIZE - 56) / 2, backgroundColor: INK }} />
        <View>
          <Animated.View style={[{ position: "absolute", inset: 0 }, glowStyle]}>
            {OFFSETS.map(([dx, dy], i) => (
              <Text
                key={i}
                style={[wordmarkStyle, { position: "absolute", inset: 0, textAlign: "center", color: rgba(AQUA, 0.5), transform: [{ translateX: dx }, { translateY: dy }] }]}
              >
                Pulse
              </Text>
            ))}
          </Animated.View>
          <Text style={[wordmarkStyle, { color: PAPER, textAlign: "center" }]}>Pulse</Text>
        </View>
      </View>
    </View>
  );
}
