import React from "react";
import { View, Text, Pressable } from "react-native";
import Svg, { Path, Circle, G } from "react-native-svg";
import { useTheme, FONTS, T } from "../theme";
import { colorFor } from "../lib/data";

// The week as seven bars, one per day, tall and coloured by that day's
// average, with the number above. A day before your first level is a stub.
// With onPressDay, each column (bar and letter) opens that day.
export function DayBars({ days, lowestDate, height = 120, onPressDay }) {
  const t = useTheme();
  return (
    <View style={{ flexDirection: "row" }}>
      {days.map((d) => {
        const low = d.date === lowestDate;
        return (
          <Pressable
            key={d.date} disabled={!onPressDay} onPress={() => onPressDay(d.date)}
            accessibilityRole="button" accessibilityLabel={`${d.weekday}${d.avg == null ? "" : `, average ${d.avg}`}`}
            style={({ pressed }) => ({ flex: 1, alignItems: "center", opacity: pressed ? 0.6 : 1 })}
          >
            <View style={{ height: height + 22, justifyContent: "flex-end", alignItems: "center" }}>
              {d.avg != null && (
                <Text style={{ fontFamily: low ? FONTS.bold : FONTS.medium, fontSize: T.caption, color: low ? t.ink : t.muted, marginBottom: 6 }}>{d.avg}</Text>
              )}
              <View style={{ width: 22, height: d.avg == null ? 22 : Math.max(22, (d.avg / 100) * height), borderRadius: 11, backgroundColor: d.avg == null ? t.sunk : colorFor(d.avg) }} />
            </View>
            <Text style={{ marginTop: 10, textAlign: "center", fontFamily: low ? FONTS.medium : FONTS.sans, fontSize: T.caption, color: low ? t.ink : t.faint }}>
              {d.weekday[0]}
            </Text>
          </Pressable>
        );
      })}
    </View>
  );
}

// Two averages side by side, e.g. after nights rated 4–5 against 1–2. Bars
// are coloured by level, with the number on top and a label underneath.
// The taller bar fills the height and the scale starts 20 below the smaller
// value, so a 7-point gap is visible. The numbers carry the actual values.
export function CompareBars({ items, height = 80 }) {
  const t = useTheme();
  const values = items.map((it) => it.value);
  const floor = Math.max(0, Math.min(...values) - 20);
  const top = Math.max(...values);
  return (
    <View style={{ flexDirection: "row", justifyContent: "center", gap: 28 }}>
      {items.map((it) => (
        <View key={it.label} style={{ alignItems: "center", width: 96 }}>
          <View style={{ height: height + 28, justifyContent: "flex-end", alignItems: "center" }}>
            <Text style={{ fontFamily: FONTS.bold, fontSize: T.title, color: t.ink, marginBottom: 6 }}>{it.value}</Text>
            <View style={{ width: 34, height: Math.max(14, ((it.value - floor) / Math.max(1, top - floor)) * height), borderRadius: 12, backgroundColor: colorFor(it.value) }} />
          </View>
          <Text numberOfLines={2} style={{ fontFamily: FONTS.medium, fontSize: T.caption, color: t.ink, marginTop: 8, textAlign: "center" }}>{it.label}</Text>
          {it.sub ? <Text style={{ fontFamily: FONTS.sans, fontSize: T.caption, color: t.faint, textAlign: "center" }}>{it.sub}</Text> : null}
        </View>
      ))}
    </View>
  );
}

// Small labelled bars: [{ label, value, display, color, on }]. `max` sets
// the full height; `on` bars are drawn solid, the rest faded.
export function MiniBars({ items, max, height = 64 }) {
  const t = useTheme();
  return (
    <View style={{ flexDirection: "row", alignItems: "flex-end" }}>
      {items.map((it) => (
        <View key={it.label} style={{ flex: 1, alignItems: "center" }}>
          <Text style={{ fontFamily: it.on ? FONTS.bold : FONTS.sans, fontSize: T.caption, color: it.on ? t.ink : t.muted, marginBottom: 4 }}>{it.display ?? ""}</Text>
          <View style={{ width: 18, height: it.value == null ? 8 : Math.max(8, (it.value / max) * height), borderRadius: 9, backgroundColor: it.value == null ? t.sunk : it.color, opacity: it.on || it.value == null ? 1 : t.scheme === "dark" ? 0.7 : 0.5 }} />
          <Text numberOfLines={1} style={{ fontFamily: it.on ? FONTS.medium : FONTS.sans, fontSize: 11, color: it.on ? t.ink : t.faint, marginTop: 6 }}>{it.label}</Text>
        </View>
      ))}
    </View>
  );
}

// A bar growing left (negative) or right (positive) of a centre line, for
// ranked +/- values. `max` is the size of the largest value in the list.
export function Diverging({ value, max, up, down, width = 96 }) {
  const t = useTheme();
  const half = width / 2;
  const len = Math.max(4, (Math.abs(value) / max) * (half - 2));
  return (
    <View style={{ width, height: 12, justifyContent: "center" }}>
      <View style={{ position: "absolute", left: 0, right: 0, height: 6, borderRadius: 3, backgroundColor: t.sunk }} />
      <View style={{ position: "absolute", left: half - 0.5, width: 1, height: 12, backgroundColor: t.lineStrong }} />
      <View style={{ position: "absolute", height: 8, borderRadius: 4, width: len, left: value >= 0 ? half : half - len, backgroundColor: value >= 0 ? up : down }} />
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
