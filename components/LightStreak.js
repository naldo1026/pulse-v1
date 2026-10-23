import React, { useEffect, useId } from "react";
import { View, useWindowDimensions } from "react-native";
import Svg, { Defs, RadialGradient, Stop, Ellipse } from "react-native-svg";
import Animated, { useSharedValue, useAnimatedStyle, withRepeat, withTiming, Easing } from "react-native-reanimated";
import { useTheme } from "../theme";
import { colorFor, accentFor } from "../lib/data";

// Soft diagonal streaks of light behind the top of a screen, tinted by the
// current level. Each streak is an ellipse filled with a radial gradient that
// fades to nothing at its edge, so there's no hard shape — just light.
// Drifts very slowly so the screen feels alive without anything "moving".

const TILT = -22;
const BLEED = 60; // drawn wider than the screen so the drift never shows an edge
const FALLOFF = [[0, 1], [0.25, 0.78], [0.5, 0.42], [0.75, 0.13], [1, 0]];

function Streak({ id, cx, cy, rx, ry, color, strength }) {
  return (
    <>
      <Defs>
        {/* eased falloff; a plain linear fade shows a visible band */}
        <RadialGradient id={id} cx="50%" cy="50%" r="50%">
          {FALLOFF.map(([o, k]) => (
            <Stop key={o} offset={o} stopColor={color} stopOpacity={strength * k} />
          ))}
        </RadialGradient>
      </Defs>
      <Ellipse cx={cx} cy={cy} rx={rx} ry={ry} fill={`url(#${id})`} transform={`rotate(${TILT} ${cx} ${cy})`} />
    </>
  );
}

export default function LightStreak({ level, height = 440, intensity = 1, style }) {
  const t = useTheme();
  const { width } = useWindowDimensions();
  // useId keeps gradient ids unique: tab screens stay mounted side by side,
  // and on web a repeated id would make every streak use the first colour.
  const uid = useId().replace(/[^a-zA-Z0-9]/g, "");
  const W = width + BLEED * 2;
  const s = t.streak * intensity;
  const main = colorFor(level);
  const accent = accentFor(level);

  const drift = useSharedValue(0);
  useEffect(() => {
    drift.value = withRepeat(withTiming(1, { duration: 9000, easing: Easing.inOut(Easing.sin) }), -1, true);
  }, []);
  const driftStyle = useAnimatedStyle(() => ({
    transform: [{ translateX: (drift.value - 0.5) * 28 }, { translateY: (0.5 - drift.value) * 10 }],
  }));

  return (
    <View pointerEvents="none" style={[{ position: "absolute", top: 0, left: 0, right: 0, height, overflow: "hidden" }, style]}>
      <Animated.View style={[{ position: "absolute", top: 0, left: -BLEED, width: W, height }, driftStyle]}>
        <Svg width={W} height={height}>
          {/* broad wash, top right */}
          <Streak id={`${uid}a`} cx={W * 0.74} cy={height * 0.2} rx={W * 0.62} ry={height * 0.16} color={main} strength={s} />
          {/* second tone, lower left */}
          <Streak id={`${uid}b`} cx={W * 0.26} cy={height * 0.44} rx={W * 0.48} ry={height * 0.1} color={accent} strength={s * 0.8} />
          {/* the streak itself: a narrow, brighter band across the first */}
          <Streak id={`${uid}c`} cx={W * 0.6} cy={height * 0.27} rx={W * 0.46} ry={height * 0.035} color={main} strength={Math.min(1, s * 1.3)} />
        </Svg>
      </Animated.View>
    </View>
  );
}
