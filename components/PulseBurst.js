import React, { useEffect, useId } from "react";
import { View, useWindowDimensions } from "react-native";
import Svg, { Defs, RadialGradient, LinearGradient, Stop, Rect } from "react-native-svg";
import Animated, { useSharedValue, useAnimatedStyle, withSequence, withTiming, withDelay, Easing } from "react-native-reanimated";
import { useTheme } from "../theme";
import { colorFor, accentFor } from "../lib/data";
import { tap } from "../lib/haptics";

// The send moment. One heartbeat timeline (lub-dub) drives everything —
// the screen wash, the edge glow, the haptic taps, and the scale pulse on
// the Me screen — so the visuals and the vibration land together. A band
// of light then sweeps up the full screen. One-shot: remount via a changing
// `key` prop at the call site to replay it.

// Both beats peak at these times (ms from the tap).
export const BEAT_PEAKS = [120, 420];

// Animate a value through two beats: up to `a`, nearly back to `rest`, up to
// `b`, then settle. Peaks land on BEAT_PEAKS.
export const heartbeat = (rest, a, b, settleMs = 260) =>
  withSequence(
    withTiming(a, { duration: BEAT_PEAKS[0], easing: Easing.out(Easing.quad) }),
    withTiming(rest + (a - rest) * 0.2, { duration: 150, easing: Easing.inOut(Easing.quad) }),
    withTiming(b, { duration: BEAT_PEAKS[1] - BEAT_PEAKS[0] - 150, easing: Easing.out(Easing.quad) }),
    withTiming(rest, { duration: settleMs, easing: Easing.inOut(Easing.quad) })
  );

// Eased falloffs. A plain linear fade shows a visible edge.
const WASH = [[0, 0.24], [0.3, 0.17], [0.55, 0.08], [0.8, 0.02], [1, 0]];
const VIGNETTE = [[0.55, 0], [0.75, 0.07], [0.9, 0.24], [1, 0.48]];
const BAND = [[0, 0], [0.2, 0.06], [0.38, 0.24], [0.5, 0.36], [0.62, 0.24], [0.8, 0.06], [1, 0]];

function Fill({ id, gradient, children }) {
  return (
    <Svg width="100%" height="100%" viewBox="0 0 100 100" preserveAspectRatio="none">
      <Defs>{gradient}</Defs>
      <Rect x="0" y="0" width="100" height="100" fill={`url(#${id})`} />
      {children}
    </Svg>
  );
}

const stops = (list, color, k = 1) => list.map(([o, a]) => <Stop key={o} offset={o} stopColor={color} stopOpacity={a * k} />);

// Coloured light over near-black reads heavier than over white, so dark mode
// runs the burst quieter, the edge glow most of all.
const DARK_SCALE = { wash: 0.8, edge: 0.5, band: 0.85 };

function Wash({ id, color, k }) {
  const o = useSharedValue(0);
  useEffect(() => { o.value = heartbeat(0, 1, 0.75, 420); }, []);
  const style = useAnimatedStyle(() => ({ opacity: o.value }));
  return (
    <Animated.View pointerEvents="none" style={[{ position: "absolute", inset: 0 }, style]}>
      <Fill id={id} gradient={<RadialGradient id={id} cx="50%" cy="48%" r="62%">{stops(WASH, color, k)}</RadialGradient>} />
    </Animated.View>
  );
}

// Glow around the screen edge. A single radial gradient, so there are no
// seams or doubled-up corners.
function EdgeGlow({ id, color, k }) {
  const o = useSharedValue(0);
  useEffect(() => { o.value = heartbeat(0, 1, 0.8, 420); }, []);
  const style = useAnimatedStyle(() => ({ opacity: o.value }));
  return (
    <Animated.View pointerEvents="none" style={[{ position: "absolute", inset: 0 }, style]}>
      <Fill id={id} gradient={<RadialGradient id={id} cx="50%" cy="50%" r="50%">{stops(VIGNETTE, color, k)}</RadialGradient>} />
    </Animated.View>
  );
}

// A soft band of light rising through the whole screen. It starts fully
// below the bottom edge and ends fully above the top, and its opacity eases
// in and out as it goes, so it never meets an edge while visible.
function Sweep({ id, color, core, k }) {
  const { height: H } = useWindowDimensions();
  const bandH = H * 0.5;
  const p = useSharedValue(0);
  useEffect(() => {
    p.value = withDelay(BEAT_PEAKS[0] - 40, withTiming(1, { duration: 1150, easing: Easing.inOut(Easing.quad) }));
  }, []);
  const style = useAnimatedStyle(() => {
    const fadeIn = Math.min(1, p.value / 0.2);
    const fadeOut = Math.min(1, (1 - p.value) / 0.4);
    return {
      opacity: Math.min(fadeIn, fadeOut),
      transform: [{ translateY: H - p.value * (H + bandH) }],
    };
  });
  return (
    <Animated.View pointerEvents="none" style={[{ position: "absolute", left: 0, right: 0, top: 0, height: bandH }, style]}>
      <Fill
        id={id}
        gradient={
          <LinearGradient id={id} x1="0" y1="1" x2="0" y2="0">
            {stops(BAND, color, k)}
          </LinearGradient>
        }
      >
        {/* brighter core in the neighbouring colour, like the background streak */}
        <Defs>
          <LinearGradient id={`${id}core`} x1="0" y1="1" x2="0" y2="0">
            {stops([[0.3, 0], [0.5, 0.25], [0.7, 0]], core, k)}
          </LinearGradient>
        </Defs>
        <Rect x="0" y="0" width="100" height="100" fill={`url(#${id}core)`} />
      </Fill>
    </Animated.View>
  );
}

export default function PulseBurst({ level }) {
  const t = useTheme();
  const k = t.scheme === "dark" ? DARK_SCALE : { wash: 1, edge: 1, band: 1 };
  const uid = useId().replace(/[^a-zA-Z0-9]/g, "");
  const color = colorFor(level);

  useEffect(() => {
    const timers = BEAT_PEAKS.map((ms) => setTimeout(tap, ms));
    return () => timers.forEach(clearTimeout);
  }, []);

  return (
    <View pointerEvents="none" style={{ position: "absolute", inset: 0, overflow: "hidden" }}>
      <Wash id={`${uid}w`} color={color} k={k.wash} />
      <EdgeGlow id={`${uid}e`} color={color} k={k.edge} />
      <Sweep id={`${uid}s`} color={color} core={accentFor(level)} k={k.band} />
    </View>
  );
}
