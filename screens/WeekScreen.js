import React from "react";
import { View, Text, ScrollView } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useTheme, FONTS, T } from "../theme";
import { WEEK, DAYS, colorFor } from "../lib/data";
import { Label, Panel, Display } from "../components/primitives";

const CHART_H = 120;

export default function WeekScreen({ mbti }) {
  const t = useTheme();
  const insets = useSafeAreaInsets();
  const w = [...WEEK, 42];
  const low = w.indexOf(Math.min(...w));
  const facts = [
    [String(Math.round(w.reduce((a, b) => a + b, 0) / w.length)), "Average this week"],
    [`${w.filter((v) => v > 50).length} of 7`, "Days you were up for company"],
    ["2", "Days to bounce back"],
  ];
  const introvert = mbti && mbti[0] === "I";

  return (
    <View style={{ flex: 1, backgroundColor: t.bg }}>
      <View style={{ flexDirection: "row", alignItems: "baseline", justifyContent: "space-between", paddingTop: insets.top + 8, paddingHorizontal: 24 }}>
        <Display size={26}>This week</Display>
        <Text style={{ fontFamily: FONTS.sans, fontSize: T.small, color: t.faint }}>17–23 Aug</Text>
      </View>

      <ScrollView contentContainerStyle={{ paddingHorizontal: 24, paddingTop: 28, paddingBottom: insets.bottom + 32 }}>
        <Display size={36}>You dip midweek.</Display>
        <Text style={{ fontFamily: FONTS.sans, fontSize: T.body, lineHeight: 22, color: t.muted, marginTop: 6 }}>
          Same as the last two weeks. That's just your rhythm.
        </Text>

        <Panel style={{ marginTop: 24, paddingBottom: 16 }}>
          <View style={{ flexDirection: "row", alignItems: "flex-end", gap: 10, height: CHART_H }}>
            {w.map((v, i) => (
              <View key={i} style={{ flex: 1, height: Math.max(6, (v / 100) * CHART_H), borderRadius: 6, backgroundColor: colorFor(v) }} />
            ))}
          </View>
          <View style={{ flexDirection: "row", gap: 10, marginTop: 10 }}>
            {w.map((_, i) => (
              <Text key={i} style={{ flex: 1, textAlign: "center", fontFamily: i === low ? FONTS.medium : FONTS.sans, fontSize: T.caption, color: i === low ? t.ink : t.faint }}>
                {DAYS[i]}
              </Text>
            ))}
          </View>
        </Panel>

        <View style={{ marginTop: 16 }}>
          {facts.map(([big, small]) => (
            <View key={small} style={{ flexDirection: "row", alignItems: "baseline", gap: 16, borderBottomWidth: 1, borderColor: t.line, paddingVertical: 14 }}>
              <Display size={30} style={{ minWidth: 84 }}>{big}</Display>
              <Text style={{ flex: 1, fontFamily: FONTS.sans, fontSize: T.body, color: t.muted }}>{small}</Text>
            </View>
          ))}
        </View>

        {mbti && (
          <Panel style={{ marginTop: 24 }}>
            <Label>{`For ${mbti}s`}</Label>
            <Display size={24} style={{ marginTop: 8 }}>
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
          Built only from levels you set. Nothing runs in the background.
        </Text>
      </ScrollView>
    </View>
  );
}
