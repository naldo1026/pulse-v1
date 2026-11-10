import React, { useState } from "react";
import { View, Text } from "react-native";
import Svg, { Rect, Circle } from "react-native-svg";
import { useTheme, rgba, FONTS, T } from "../theme";
import { colorFor } from "../lib/data";

const H = 132;
const PAD = 10; // room for the dots at 0 and 100

// One column per day of thisWeek().days: a soft bar for the day's range and a
// dot for its average, over a band for your usual range once the baseline
// has one. A day before your first level gets an empty ring at the bottom.
// The scale runs from 10 below the lowest point shown, to the nearest 10,
// up to 100, so a week spent in the 50s and 60s isn't squashed into the top.
export default function WeekChart({ days, usual, lowestDate }) {
  const t = useTheme();
  const [w, setW] = useState(0);
  const lowest = Math.min(...days.filter((d) => d.low != null).map((d) => d.low), usual ? usual.low : 100);
  const floor = Math.max(0, Math.floor((lowest - 10) / 10) * 10);
  const y = (v) => PAD + (1 - (v - floor) / (100 - floor)) * (H - 2 * PAD);
  const col = w / days.length;
  const summary = days.map((d) => `${d.weekday} ${d.avg ?? "no level"}`).join(", ");

  return (
    <View>
      <View onLayout={(e) => setW(e.nativeEvent.layout.width)} style={{ height: H }} accessible accessibilityLabel={`Daily averages: ${summary}`}>
        {w > 0 && (
          <Svg width={w} height={H}>
            {usual && (
              <Rect x={0} width={w} y={y(usual.high)} height={Math.max(2, y(usual.low) - y(usual.high))} rx={8} fill={rgba(t.ink, t.scheme === "dark" ? 0.09 : 0.06)} />
            )}
            {days.map((d, i) => {
              const cx = col * (i + 0.5);
              if (d.avg == null) return <Circle key={d.date} cx={cx} cy={y(floor)} r={4} fill="none" stroke={t.lineStrong} strokeWidth={1.5} />;
              const c = colorFor(d.avg);
              return (
                <React.Fragment key={d.date}>
                  <Rect x={cx - 5} width={10} y={y(d.high) - 5} height={y(d.low) - y(d.high) + 10} rx={5} fill={c} opacity={0.35} />
                  <Circle cx={cx} cy={y(d.avg)} r={7} fill={c} stroke={t.surface} strokeWidth={2} />
                </React.Fragment>
              );
            })}
          </Svg>
        )}
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
