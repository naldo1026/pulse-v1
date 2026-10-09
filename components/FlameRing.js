import React, { useEffect } from "react";
import { View, StyleSheet } from "react-native";
import Svg, { Circle, Defs, LinearGradient as SvgGradient, Stop } from "react-native-svg";
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withRepeat,
  withTiming,
  Easing,
} from "react-native-reanimated";
import { COLORS } from "../theme";

const SIZE = 190;

// Two counter-rotating arc layers plus a soft glow, reading as flame
// licking around the ring rather than a solid halo.
export default function FlameRing({ children }) {
  const spinA = useSharedValue(0);
  const spinB = useSharedValue(0);
  const pulse = useSharedValue(0.55);

  useEffect(() => {
    spinA.value = withRepeat(withTiming(360, { duration: 3400, easing: Easing.linear }), -1, false);
    spinB.value = withRepeat(withTiming(-360, { duration: 4800, easing: Easing.linear }), -1, false);
    pulse.value = withRepeat(withTiming(0.95, { duration: 1300 }), -1, true);
  }, []);

  const styleA = useAnimatedStyle(() => ({ transform: [{ rotate: `${spinA.value}deg` }] }));
  const styleB = useAnimatedStyle(() => ({ transform: [{ rotate: `${spinB.value}deg` }] }));
  const glowStyle = useAnimatedStyle(() => ({ opacity: pulse.value }));

  const R = 86;
  const CIRC = 2 * Math.PI * R;

  return (
    <View style={styles.wrap}>
      {/* diffuse glow underneath */}
      <Animated.View style={[styles.glow, glowStyle]} />

      {/* outer flame arc */}
      <Animated.View style={[StyleSheet.absoluteFill, styleA]}>
        <Svg width={SIZE} height={SIZE}>
          <Defs>
            <SvgGradient id="fa" x1="0" y1="0" x2="1" y2="1">
              <Stop offset="0" stopColor={COLORS.flameDeep} stopOpacity="0" />
              <Stop offset="0.45" stopColor={COLORS.flame} stopOpacity="1" />
              <Stop offset="0.7" stopColor={COLORS.flameLight} stopOpacity="1" />
              <Stop offset="1" stopColor={COLORS.flame} stopOpacity="0" />
            </SvgGradient>
          </Defs>
          <Circle
            cx={SIZE / 2}
            cy={SIZE / 2}
            r={R}
            fill="none"
            stroke="url(#fa)"
            strokeWidth={3}
            strokeLinecap="round"
            strokeDasharray={`${CIRC * 0.42} ${CIRC * 0.58}`}
          />
        </Svg>
      </Animated.View>

      {/* inner counter-rotating wisp */}
      <Animated.View style={[StyleSheet.absoluteFill, styleB]}>
        <Svg width={SIZE} height={SIZE}>
          <Defs>
            <SvgGradient id="fb" x1="1" y1="0" x2="0" y2="1">
              <Stop offset="0" stopColor={COLORS.flame} stopOpacity="0" />
              <Stop offset="0.5" stopColor={COLORS.flameLight} stopOpacity="0.9" />
              <Stop offset="1" stopColor={COLORS.flame} stopOpacity="0" />
            </SvgGradient>
          </Defs>
          <Circle
            cx={SIZE / 2}
            cy={SIZE / 2}
            r={R - 6}
            fill="none"
            stroke="url(#fb)"
            strokeWidth={2}
            strokeLinecap="round"
            strokeDasharray={`${CIRC * 0.26} ${CIRC * 0.74}`}
          />
        </Svg>
      </Animated.View>

      <View style={styles.center}>{children}</View>
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: { width: SIZE, height: SIZE, alignItems: "center", justifyContent: "center", alignSelf: "center" },
  glow: {
    position: "absolute",
    top: 6,
    left: 6,
    width: SIZE - 12,
    height: SIZE - 12,
    borderRadius: (SIZE - 12) / 2,
    borderWidth: 1,
    borderColor: COLORS.flame,
    shadowColor: COLORS.flame,
    shadowOpacity: 1,
    shadowRadius: 18,
    shadowOffset: { width: 0, height: 0 },
    opacity: 0.5,
  },
  center: { ...StyleSheet.absoluteFillObject, alignItems: "center", justifyContent: "center" },
});
