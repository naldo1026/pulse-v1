import React from "react";
import { View, Text, ScrollView } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useTheme, FONTS, T } from "../theme";
import { colorFor } from "../lib/data";
import { weekStart } from "../lib/api";
import { Label, Panel, Display } from "../components/primitives";
import LightStreak from "../components/LightStreak";

const CHART_H = 120;
const WEEKDAYS = ["Sunday", "Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"];
const short = (d, opts) => d.toLocaleDateString("en-GB", opts);

// The last 7 days, oldest first.
const lastWeek = () => {
  const start = weekStart();
  return [...Array(7)].map((_, i) => {
    const d = new Date(start);
    d.setDate(d.getDate() + i);
    return d;
  });
};

// One value per day: the average of the level carried into the day and
// every level set during it. Days before your first level are null.
// `log` is sorted oldest first and may start with one row from before the week.
function daily(days, log, level) {
  let carry = null;
  let k = 0;
  while (k < log.length && new Date(log[k].created_at) < days[0]) carry = log[k++].level;
  return days.map((d, i) => {
    const end = new Date(d);
    end.setDate(end.getDate() + 1);
    const vals = carry == null ? [] : [carry];
    while (k < log.length && new Date(log[k].created_at) < end) {
      carry = log[k++].level;
      vals.push(carry);
    }
    if (i === 6 && !vals.length) vals.push(level);
    return vals.length ? Math.round(vals.reduce((a, b) => a + b, 0) / vals.length) : null;
  });
}

export default function WeekScreen({ mbti, level, log }) {
  const t = useTheme();
  const insets = useSafeAreaInsets();
  const days = lastWeek();
  const w = daily(days, log, level);
  const known = w.filter((v) => v != null);
  const enough = known.length >= 3;
  const avg = known.length ? Math.round(known.reduce((a, b) => a + b, 0) / known.length) : 0;
  const low = enough ? w.indexOf(Math.min(...known)) : -1;
  const back = low >= 0 ? w.findIndex((v, i) => i > low && v > 50) : -1;
  const facts = [
    [String(avg), "Average this week"],
    [`${known.filter((v) => v > 50).length} of ${known.length}`, "Days you were up for company"],
    back > 0 && [String(back - low), back - low === 1 ? "Day to bounce back" : "Days to bounce back"],
  ].filter(Boolean);
  const [a, b] = [days[0], days[6]];
  const range = a.getMonth() === b.getMonth()
    ? `${a.getDate()}–${b.getDate()} ${short(b, { month: "short" })}`
    : `${short(a, { day: "numeric", month: "short" })} – ${short(b, { day: "numeric", month: "short" })}`;
  const introvert = mbti && mbti[0] === "I";

  return (
    <View style={{ flex: 1, backgroundColor: t.bg }}>
      <LightStreak level={level} intensity={0.8} />
      <View style={{ flexDirection: "row", alignItems: "baseline", justifyContent: "space-between", paddingTop: insets.top + 8, paddingHorizontal: 24 }}>
        <Display size={24}>This week</Display>
        <Text style={{ fontFamily: FONTS.sans, fontSize: T.small, color: t.faint }}>{range}</Text>
      </View>

      <ScrollView contentContainerStyle={{ paddingHorizontal: 24, paddingTop: 28, paddingBottom: insets.bottom + 32 }}>
        <Display size={32}>
          {!enough ? "Check back in a few days." : low === 6 ? "Today's your low point so far." : `${WEEKDAYS[days[low].getDay()]} was your low point.`}
        </Display>
        <Text style={{ fontFamily: FONTS.sans, fontSize: T.body, lineHeight: 22, color: t.muted, marginTop: 6 }}>
          {enough ? `You were at ${w[low]}, against an average of ${avg}.` : "Your week fills in as you set your level."}
        </Text>

        <Panel style={{ marginTop: 24, paddingBottom: 16 }}>
          <View style={{ flexDirection: "row", alignItems: "flex-end", height: CHART_H }}>
            {w.map((v, i) => (
              <View key={i} style={{ flex: 1, alignItems: "center" }}>
                <View style={{ width: 20, height: v == null ? 20 : Math.max(20, (v / 100) * CHART_H), borderRadius: 10, backgroundColor: v == null ? t.sunk : colorFor(v) }} />
              </View>
            ))}
          </View>
          <View style={{ flexDirection: "row", marginTop: 10 }}>
            {days.map((d, i) => (
              <Text key={i} style={{ flex: 1, textAlign: "center", fontFamily: i === low ? FONTS.medium : FONTS.sans, fontSize: T.caption, color: i === low ? t.ink : t.faint }}>
                {WEEKDAYS[d.getDay()][0]}
              </Text>
            ))}
          </View>
        </Panel>

        {enough && (
          <View style={{ marginTop: 16 }}>
            {facts.map(([big, small]) => (
              <View key={small} style={{ flexDirection: "row", alignItems: "baseline", gap: 16, borderBottomWidth: 1, borderColor: t.line, paddingVertical: 14 }}>
                <Display size={28} style={{ minWidth: 84 }}>{big}</Display>
                <Text style={{ flex: 1, fontFamily: FONTS.sans, fontSize: T.body, color: t.muted }}>{small}</Text>
              </View>
            ))}
          </View>
        )}

        {mbti && enough && (
          <Panel style={{ marginTop: 24 }}>
            <Label>{`For ${mbti}s`}</Label>
            <Display size={22} style={{ marginTop: 8 }}>
              {introvert ? "Quiet days are how you recharge." : "People are how you recharge."}
            </Display>
            <Text style={{ fontFamily: FONTS.sans, fontSize: T.body, lineHeight: 22, color: t.muted, marginTop: 6 }}>
              {introvert
                ? "Your quiet days sat right before your best ones. That's rest working, not a slump."
                : "Your lowest days were also the ones you saw nobody. Company tends to bring you back."}
            </Text>
          </Panel>
        )}

        <Text style={{ fontFamily: FONTS.sans, fontSize: T.caption, color: t.faint, textAlign: "center", marginTop: 24 }}>
          Built only from levels you set.
        </Text>
      </ScrollView>
    </View>
  );
}
