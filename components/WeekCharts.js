import React from "react";
import { View, Text } from "react-native";
import Svg, { Path, Circle, G } from "react-native-svg";
import { useTheme, FONTS, T } from "../theme";
import { colorFor } from "../lib/data";

// The week as seven bars, one per day, tall and coloured by that day's
// average, with the number above. A day before your first level is a stub.
export function DayBars({ days, lowestDate, height = 120 }) {
  const t = useTheme();
  return (
    <View>
      <View style={{ flexDirection: "row", alignItems: "flex-end", height: height + 22 }}>
        {days.map((d) => {
          const low = d.date === lowestDate;
          return (
            <View key={d.date} style={{ flex: 1, alignItems: "center" }}>
              {d.avg != null && (
                <Text style={{ fontFamily: low ? FONTS.bold : FONTS.medium, fontSize: T.caption, color: low ? t.ink : t.muted, marginBottom: 6 }}>{d.avg}</Text>
              )}
              <View style={{ width: 22, height: d.avg == null ? 22 : Math.max(22, (d.avg / 100) * height), borderRadius: 11, backgroundColor: d.avg == null ? t.sunk : colorFor(d.avg) }} />
            </View>
          );
        })}
      </View>
      <View style={{ flexDirection: "row", marginTop: 10 }}>
        {days.map((d) => {
          const low = d.date === lowestDate;
          return (
            <Text key={d.date} style={{ flex: 1, textAlign: "center", fontFamily: low ? FONTS.medium : FONTS.sans, fontSize: T.caption, color: low ? t.ink : t.faint }}>
              {d.weekday[0]}
            </Text>
          );
        })}
      </View>
    </View>
  );
}

// A half-circle meter from 0 to 100%. `value` null draws the empty track.
export function Gauge({ value, color, size = 84, stroke = 9, children }) {
  const t = useTheme();
  const r = (size - stroke) / 2;
  const cx = size / 2;
  const cy = r + stroke / 2;
  const point = (p) => {
    const a = Math.PI * (1 - p);
    return `${cx + r * Math.cos(a)} ${cy - r * Math.sin(a)}`;
  };
  const arc = (p) => `M ${point(0)} A ${r} ${r} 0 0 1 ${point(p)}`;
  const p = value == null ? 0 : Math.min(1, Math.max(0, value / 100));
  return (
    <View style={{ width: size, height: cy + stroke / 2, alignItems: "center" }}>
      <Svg width={size} height={cy + stroke / 2} style={{ position: "absolute" }}>
        <Path d={arc(1)} stroke={t.sunk} strokeWidth={stroke} strokeLinecap="round" fill="none" />
        {p > 0.005 && <Path d={arc(p)} stroke={color} strokeWidth={stroke} strokeLinecap="round" fill="none" />}
      </Svg>
      <View style={{ position: "absolute", bottom: -2, left: 0, right: 0, alignItems: "center" }}>{children}</View>
    </View>
  );
}

// A ring split into segments [{ id, pct, color }], starting at the top and
// going clockwise. `children` sit in the middle.
export function Donut({ segments, size = 112, stroke = 16, children }) {
  const t = useTheme();
  const r = (size - stroke) / 2;
  const c = 2 * Math.PI * r;
  const gap = segments.filter((s) => s.pct > 0).length > 1 ? 2 : 0;
  let at = 0;
  return (
    <View style={{ width: size, height: size, alignItems: "center", justifyContent: "center" }}>
      <Svg width={size} height={size} style={{ position: "absolute" }}>
        <Circle cx={size / 2} cy={size / 2} r={r} stroke={t.sunk} strokeWidth={stroke} fill="none" />
        <G transform={`rotate(-90 ${size / 2} ${size / 2})`}>
          {segments.map((s) => {
            const len = (s.pct / 100) * c;
            const el = len > 0 && (
              <Circle
                key={s.id} cx={size / 2} cy={size / 2} r={r} fill="none" stroke={s.color} strokeWidth={stroke}
                strokeDasharray={`${Math.max(0.01, len - gap)} ${c}`} strokeDashoffset={-at}
              />
            );
            at += len;
            return el;
          })}
        </G>
      </Svg>
      {children}
    </View>
  );
}
