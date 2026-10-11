import React, { useEffect, useState } from "react";
import { View, Text } from "react-native";
import Svg, { Path, Defs, RadialGradient, Stop, Rect } from "react-native-svg";
import { LinearGradient } from "expo-linear-gradient";
import { Gesture, GestureDetector } from "react-native-gesture-handler";
import Animated, {
  useSharedValue, useAnimatedStyle, withTiming, withRepeat, withSequence, Easing, runOnJS,
} from "react-native-reanimated";
import { PAPER, INK, FONTS, rgba } from "../theme";
import { colorFor } from "../lib/data";

export const CELL_W = 186;
export const CELL_H = 372;

// One static bezier S-curve spanning a double-wide viewBox (two periods).
// The "flow" motion is just a translateX loop of exactly one period's
// width — not a path morph — so it tiles seamlessly.
const wavePath = (amp) => {
  const m = 16;
  return (
    `M0,${m} ` +
    `C 12.5,${m - amp} 37.5,${m - amp} 50,${m} ` +
    `S 87.5,${m + amp} 100,${m} ` +
    `S 137.5,${m - amp} 150,${m} ` +
    `S 187.5,${m + amp} 200,${m} ` +
    `L200,40 L0,40 Z`
  );
};

function Swell({ fill, durationMs, amp, top, opacity, crest, fluidWidth }) {
  const d = wavePath(amp);
  const tx = useSharedValue(0);

  useEffect(() => {
    tx.value = 0;
    tx.value = withRepeat(withTiming(-fluidWidth, { duration: durationMs, easing: Easing.linear }), -1, false);
  }, [durationMs, fluidWidth]);

  const style = useAnimatedStyle(() => ({ transform: [{ translateX: tx.value }] }));

  return (
    <Animated.View style={[{ position: "absolute", left: 0, top, width: fluidWidth * 2, height: 44, opacity }, style]}>
      <Svg width="100%" height="100%" viewBox="0 0 200 40" preserveAspectRatio="none">
        <Path d={d} fill={fill} />
        {crest && (
          <>
            <Path d={d} fill="none" stroke={crest} strokeWidth={6} opacity={0.18} />
            <Path d={d} fill="none" stroke={crest} strokeWidth={3.4} opacity={0.38} />
            <Path d={d} fill="none" stroke={PAPER} strokeWidth={1.2} opacity={0.9} />
          </>
        )}
      </Svg>
    </Animated.View>
  );
}

function Bubble({ left, size, delayMs, durationMs }) {
  const t = useSharedValue(0);

  useEffect(() => {
    t.value = 0;
    t.value = withRepeat(withSequence(withTiming(0, { duration: delayMs }), withTiming(1, { duration: durationMs, easing: Easing.out(Easing.quad) })), -1, false);
  }, [delayMs, durationMs]);

  const style = useAnimatedStyle(() => ({
    opacity: t.value < 0.25 ? t.value * 2 : t.value < 0.75 ? 0.5 - (t.value - 0.25) * 0.4 : (1 - t.value) * 1.2,
    transform: [{ translateY: -180 * t.value }, { scale: 0.6 + 0.55 * t.value }],
  }));

  return <Animated.View style={[{ position: "absolute", left, bottom: 8, width: size, height: size, borderRadius: size / 2, backgroundColor: rgba(PAPER, 0.5) }, style]} />;
}

// Aurora bloom behind the fill. No native blur — approximated with a
// radial gradient fading to transparent, which renders identically on
// iOS and Android.
function Bloom({ color }) {
  return (
    <Svg width="100%" height="100%" viewBox="0 0 100 100" preserveAspectRatio="none">
      <Defs>
        <RadialGradient id="bloom" cx="50%" cy="100%" rx="62%" ry="78%">
          <Stop offset="0%" stopColor={color} stopOpacity={0.6} />
          <Stop offset="45%" stopColor={color} stopOpacity={0.2} />
          <Stop offset="72%" stopColor={color} stopOpacity={0} />
        </RadialGradient>
      </Defs>
      <Rect x="0" y="0" width="100" height="100" fill="url(#bloom)" />
    </Svg>
  );
}

export default function LiquidCell({ level, onChange, w = CELL_W, h = CELL_H, showNum = true }) {
  const [dragging, setDragging] = useState(false);
  const c = colorFor(level);
  const inner = h - 10;
  const fillH = Math.max(0, inner * (level / 100));
  const numSize = Math.round(h * 0.26);
  const fluidWidth = w - 10;

  const fillPct = useSharedValue(level);
  useEffect(() => {
    fillPct.value = dragging ? level : withTiming(level, { duration: 720, easing: Easing.bezier(0.2, 1.1, 0.3, 1) });
  }, [level, dragging]);

  const setLevelFromY = (y) => {
    "worklet";
    let pct = Math.round(((h - y) / h) * 100);
    pct = Math.max(0, Math.min(100, pct));
    runOnJS(onChange)(pct);
  };

  const pan = Gesture.Pan()
    .onBegin((e) => { runOnJS(setDragging)(true); setLevelFromY(e.y); })
    .onUpdate((e) => setLevelFromY(e.y))
    .onFinalize(() => runOnJS(setDragging)(false));

  const fluidStyle = useAnimatedStyle(() => ({ height: (fillPct.value / 100) * inner }));
  const bloomStyle = useAnimatedStyle(() => ({ height: (fillPct.value / 100) * inner + 96 }));
  const numClipStyle = useAnimatedStyle(() => ({ height: (fillPct.value / 100) * inner }));

  const durMul = dragging ? 0.36 : 1;

  return (
    <View style={{ width: w, height: h }}>
      {/* top screw/cap */}
      <View style={{ position: "absolute", top: -11, left: w / 2 - 26, width: 52, height: 11, borderRadius: 6, backgroundColor: "#1E1836", borderTopWidth: 1, borderColor: rgba(PAPER, 0.18) }} />

      <Animated.View pointerEvents="none" style={[{ position: "absolute", left: -64, right: -64, bottom: -22 }, bloomStyle]}>
        <Bloom color={c} />
      </Animated.View>

      <GestureDetector gesture={pan}>
        <View
          style={{
            position: "absolute", top: 0, left: 0, right: 0, bottom: 0,
            borderRadius: 34, overflow: "hidden", backgroundColor: "#13102A",
            borderWidth: 1.5, borderColor: rgba(PAPER, 0.12),
          }}
        >
          <LinearGradient colors={["#1B1430", "#0C0819"]} start={{ x: 0.2, y: 0 }} end={{ x: 0.6, y: 1 }} style={{ position: "absolute", inset: 0 }} />

          {/* faked inset shadow — RN has no native inset box-shadow */}
          <LinearGradient colors={["rgba(0,0,0,0.75)", "transparent"]} start={{ x: 0, y: 0 }} end={{ x: 0, y: 1 }} style={{ position: "absolute", top: 0, left: 0, right: 0, height: 24 }} pointerEvents="none" />

          {[10, 20, 30, 40, 50, 60, 70, 80, 90].map((v) => (
            <View key={v} style={{ position: "absolute", right: 0, bottom: `${v}%`, width: v % 50 === 0 ? 15 : 8, height: 1, backgroundColor: rgba(PAPER, v % 50 === 0 ? 0.2 : 0.08) }} />
          ))}

          {/* --- the fluid --- */}
          <Animated.View style={[{ position: "absolute", left: 5, right: 5, bottom: 5, overflow: "hidden", borderRadius: 29 }, fluidStyle]}>
            <LinearGradient
              colors={[rgba(c, 1), rgba(c, 0.8), rgba(c, 0.45), rgba(c, 0.3)]}
              locations={[0, 0.26, 0.68, 1]}
              start={{ x: 0, y: 0 }}
              end={{ x: 0, y: 1 }}
              style={{ position: "absolute", inset: 0, shadowColor: c, shadowOpacity: 0.55, shadowRadius: 26, shadowOffset: { width: 0, height: 0 } }}
            />
            <LinearGradient colors={[rgba(PAPER, 0.4), "transparent"]} start={{ x: 0, y: 0 }} end={{ x: 0, y: 0.5 }} style={{ position: "absolute", inset: 0 }} />
            <LinearGradient
              colors={["rgba(0,0,0,0.3)", "transparent", "transparent", "rgba(0,0,0,0.3)"]}
              locations={[0, 0.18, 0.82, 1]}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 0 }}
              style={{ position: "absolute", inset: 0 }}
            />

            {level > 2 && level < 99 && (
              <>
                <Swell fill={rgba(c, 0.5)} durationMs={10000 * durMul} amp={11} top={-26} opacity={0.85} fluidWidth={fluidWidth} />
                <Swell fill={rgba(c, 0.95)} durationMs={6600 * durMul} amp={9} top={-21} opacity={1} fluidWidth={fluidWidth} />
                <Swell fill={c} durationMs={4800 * durMul} amp={7} top={-17} opacity={1} crest={c} fluidWidth={fluidWidth} />
              </>
            )}

            {fillH > 90 && (
              <>
                <Bubble left={fluidWidth * 0.24} size={7} delayMs={0} durationMs={7000} />
                <Bubble left={fluidWidth * 0.66} size={4.5} delayMs={3000} durationMs={9500} />
              </>
            )}
          </Animated.View>

          {showNum && (
            <>
              {/* ghost numeral, fixed at the centre of the full interior */}
              <View pointerEvents="none" style={{ position: "absolute", left: 5, right: 5, bottom: 5, height: inner, alignItems: "center", justifyContent: "center" }}>
                <Text style={{ fontFamily: FONTS.sansExtraBold, fontSize: numSize, color: rgba(PAPER, 0.16), letterSpacing: -1 }}>{level}</Text>
              </View>
              {/* same numeral, clipped to the liquid. The inner wrapper stays
                  pinned to the full interior height so both numerals stay in
                  register at any fill level — only the clip window changes. */}
              <Animated.View pointerEvents="none" style={[{ position: "absolute", left: 5, right: 5, bottom: 5, overflow: "hidden" }, numClipStyle]}>
                <View style={{ position: "absolute", left: 0, right: 0, bottom: 0, height: inner, alignItems: "center", justifyContent: "center" }}>
                  <Text style={{ fontFamily: FONTS.sansExtraBold, fontSize: numSize, color: rgba(INK, 0.8), letterSpacing: -1 }}>{level}</Text>
                </View>
              </Animated.View>
            </>
          )}

          <LinearGradient colors={[rgba(PAPER, 0.15), "transparent"]} start={{ x: 0, y: 0 }} end={{ x: 0, y: 0.5 }} pointerEvents="none" style={{ position: "absolute", top: 14, bottom: 14, left: 16, width: 18, borderRadius: 14 }} />
        </View>
      </GestureDetector>
    </View>
  );
}
