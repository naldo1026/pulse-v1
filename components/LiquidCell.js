import React, { useEffect, useRef, useState } from "react";
import { View, Text } from "react-native";
import Svg, { Path } from "react-native-svg";
import { LinearGradient } from "expo-linear-gradient";
import { Gesture, GestureDetector } from "react-native-gesture-handler";
import Animated, {
  useSharedValue, useAnimatedStyle, withTiming, withRepeat, withSequence, Easing, runOnJS,
} from "react-native-reanimated";
import { useTheme, onColor, FONTS, rgba } from "../theme";
import { colorFor } from "../lib/data";
import { tick } from "../lib/haptics";

export const CELL_W = 186;
export const CELL_H = 372;

const WALL = 5; // gap between the shell and the well the fluid sits in
const SWELL_H = 44;
const MID = (16 / 40) * SWELL_H; // where the wave's midline sits inside a swell

// One static bezier S-curve spanning a double-wide viewBox (two periods).
// The "flow" motion is just a translateX loop of exactly one period's
// width — not a path morph — so it tiles seamlessly.
const crestPath = (amp) => {
  const m = 16;
  return (
    `M0,${m} ` +
    `C 12.5,${m - amp} 37.5,${m - amp} 50,${m} ` +
    `S 87.5,${m + amp} 100,${m} ` +
    `S 137.5,${m - amp} 150,${m} ` +
    `S 187.5,${m + amp} 200,${m}`
  );
};

function Swell({ fill, durationMs, amp, lift, highlight, fluidWidth }) {
  const crest = crestPath(amp);
  const tx = useSharedValue(0);

  useEffect(() => {
    tx.value = 0;
    tx.value = withRepeat(withTiming(-fluidWidth, { duration: durationMs, easing: Easing.linear }), -1, false);
  }, [durationMs, fluidWidth]);

  const style = useAnimatedStyle(() => ({ transform: [{ translateX: tx.value }] }));

  // Sits so its midline lands on the fluid surface (minus `lift`, which
  // raises the back swells so they peek out above the front one).
  return (
    <Animated.View pointerEvents="none" style={[{ position: "absolute", left: 0, top: -MID - lift, width: fluidWidth * 2, height: SWELL_H }, style]}>
      <Svg width="100%" height="100%" viewBox="0 0 200 40" preserveAspectRatio="none">
        <Path d={`${crest} L200,40 L0,40 Z`} fill={fill} />
        {highlight && <Path d={crest} fill="none" stroke="#FFFFFF" strokeWidth={1.1} opacity={0.5} />}
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

  return <Animated.View style={[{ position: "absolute", left, bottom: 8, width: size, height: size, borderRadius: size / 2, backgroundColor: "rgba(255,255,255,0.55)" }, style]} />;
}

export default function LiquidCell({ level, onChange, w = CELL_W, h = CELL_H, showNum = true }) {
  const t = useTheme();
  const [dragging, setDragging] = useState(false);
  const c = colorFor(level);
  const inner = h - WALL * 2;
  const fillH = Math.max(0, inner * (level / 100));
  const numSize = Math.round(h * 0.2);
  const fluidWidth = w - WALL * 2;
  const radius = Math.round(w * 0.2);

  const fillPct = useSharedValue(level);
  useEffect(() => {
    fillPct.value = dragging ? level : withTiming(level, { duration: 720, easing: Easing.bezier(0.2, 1.1, 0.3, 1) });
  }, [level, dragging]);

  // Haptic tick each time the drag crosses a 10% mark.
  const last = useRef(level);
  const handle = (pct) => {
    if (Math.floor(pct / 10) !== Math.floor(last.current / 10)) tick();
    last.current = pct;
    onChange(pct);
  };

  const setLevelFromY = (y) => {
    "worklet";
    let pct = Math.round(((h - y) / h) * 100);
    pct = Math.max(0, Math.min(100, pct));
    runOnJS(handle)(pct);
  };

  const pan = Gesture.Pan()
    .onBegin((e) => { runOnJS(setDragging)(true); setLevelFromY(e.y); })
    .onUpdate((e) => setLevelFromY(e.y))
    .onFinalize(() => runOnJS(setDragging)(false));

  const fluidStyle = useAnimatedStyle(() => ({ height: (fillPct.value / 100) * inner }));

  const durMul = dragging ? 0.36 : 1;
  const waves = level > 2 && level < 99;
  const numStyle = { fontFamily: FONTS.sans, fontSize: numSize, letterSpacing: -numSize * 0.04, fontVariant: ["tabular-nums"] };

  return (
    <View style={{ width: w, height: h }}>
      {/* battery terminal */}
      <View style={{ position: "absolute", top: -6, left: w / 2 - w * 0.14, width: w * 0.28, height: 6, borderTopLeftRadius: 4, borderTopRightRadius: 4, backgroundColor: t.lineStrong }} />

      <GestureDetector gesture={pan}>
        <View style={{ position: "absolute", inset: 0, borderRadius: radius, backgroundColor: t.surface, borderWidth: 1, borderColor: t.lineStrong }}>
          <View style={{ position: "absolute", inset: WALL - 1, borderRadius: radius - WALL, overflow: "hidden", backgroundColor: t.sunk }}>
            {/* --- the fluid ---
                The body starts just below the front swell's deepest trough,
                so the swells (drawn on top) define the visible surface. */}
            <Animated.View style={[{ position: "absolute", left: 0, right: 0, bottom: 0 }, fluidStyle]}>
              <View style={{ position: "absolute", left: 0, right: 0, bottom: 0, top: waves ? 10 : 0, overflow: "hidden", backgroundColor: c }}>
                <LinearGradient colors={["rgba(0,0,0,0)", "rgba(0,0,0,0.07)"]} style={{ position: "absolute", inset: 0 }} />
                {fillH > 90 && (
                  <>
                    <Bubble left={fluidWidth * 0.24} size={6} delayMs={0} durationMs={7000} />
                    <Bubble left={fluidWidth * 0.66} size={4} delayMs={3000} durationMs={9500} />
                  </>
                )}
              </View>
              {waves && (
                <>
                  <Swell fill={rgba(c, 0.32)} durationMs={10000 * durMul} amp={11} lift={7} fluidWidth={fluidWidth} />
                  <Swell fill={rgba(c, 0.6)} durationMs={6600 * durMul} amp={9} lift={3.5} fluidWidth={fluidWidth} />
                  <Swell fill={c} durationMs={4800 * durMul} amp={7} lift={0} highlight fluidWidth={fluidWidth} />
                </>
              )}
            </Animated.View>

            {showNum && (
              <>
                {/* ghost numeral, fixed at the centre of the full interior */}
                <View pointerEvents="none" style={{ position: "absolute", left: 0, right: 0, bottom: 0, height: inner, alignItems: "center", justifyContent: "center" }}>
                  <Text style={[numStyle, { color: t.faint }]}>{level}</Text>
                </View>
                {/* same numeral, clipped to the liquid. The inner wrapper stays
                    pinned to the full interior height so both numerals stay in
                    register at any fill level — only the clip window changes. */}
                <Animated.View pointerEvents="none" style={[{ position: "absolute", left: 0, right: 0, bottom: 0, overflow: "hidden" }, fluidStyle]}>
                  <View style={{ position: "absolute", left: 0, right: 0, bottom: 0, height: inner, alignItems: "center", justifyContent: "center" }}>
                    <Text style={[numStyle, { color: onColor(c) }]}>{level}</Text>
                  </View>
                </Animated.View>
              </>
            )}
          </View>
        </View>
      </GestureDetector>
    </View>
  );
}
