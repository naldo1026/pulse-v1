import React from "react";
import { View, Text, ScrollView } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { LinearGradient } from "expo-linear-gradient";
import { INK, PAPER, AQUA, FONTS, T, rgba } from "../theme";
import { WEEK, DAYS, RAMP, colorFor } from "../lib/data";
import { Label, Panel, Script } from "../components/primitives";

const AMP = 92;
const FACTS = [
  ["42", "average across the week"],
  ["4/7", "days you were up for company"],
  ["3/7", "days you wanted space"],
  ["2", "days to come back up"],
];

export default function WeekScreen({ mbti }) {
  const insets = useSafeAreaInsets();
  const w = [...WEEK, 42];
  const low = w.indexOf(Math.min(...w));

  return (
    <View style={{ flex: 1, backgroundColor: INK }}>
      <View style={{ flexDirection: "row", alignItems: "center", justifyContent: "space-between", paddingTop: insets.top + 8, paddingHorizontal: 22 }}>
        <Script size={26}>Your week</Script>
        <Text style={{ fontFamily: FONTS.mono, fontSize: T.micro, color: rgba(PAPER, 0.4) }}>17—23 AUG</Text>
      </View>

      <ScrollView contentContainerStyle={{ padding: 22, paddingTop: 14, paddingBottom: insets.bottom + 34 }}>
        <Script size={50}>You dip midweek.</Script>
        <View style={{ flexDirection: "row", gap: 9, marginTop: 12 }}>
          <View style={{ width: 2, borderRadius: 2, backgroundColor: rgba(PAPER, 0.2) }} />
          <Script size={25} color={rgba(PAPER, 0.68)} style={{ flex: 1, lineHeight: 30 }}>
            Third week running. That's your rhythm, not a bad patch.
          </Script>
        </View>

        <Panel style={{ marginTop: 22, paddingTop: 24, paddingHorizontal: 16, paddingBottom: 16 }}>
          <View style={{ height: AMP + 44 }}>
            <View style={{ position: "absolute", left: 0, right: 0, top: AMP, height: 1, backgroundColor: rgba(PAPER, 0.09) }} />
            {w.map((v, i) => {
              const c = colorFor(v);
              const h = (v / 100) * AMP;
              const left = `${(i / 6) * 90 + 5}%`;
              return (
                <View key={i}>
                  <LinearGradient colors={[c, rgba(c, 0.15)]} style={{ position: "absolute", left, top: AMP - h, width: 2, height: h, marginLeft: -1, borderRadius: 2 }} />
                  <View style={{ position: "absolute", left, top: AMP - h - 5, width: 10, height: 10, marginLeft: -5, borderRadius: 5, backgroundColor: c, shadowColor: c, shadowOpacity: 0.8, shadowRadius: 14, shadowOffset: { width: 0, height: 0 } }} />
                  <Text style={{ position: "absolute", left, top: AMP + 14, marginLeft: -5, fontFamily: FONTS.mono, fontSize: T.micro, color: rgba(PAPER, i === low ? 0.85 : 0.3) }}>{DAYS[i]}</Text>
                  {i === low && (
                    <Text style={{ position: "absolute", left, top: AMP + 29, marginLeft: -16, fontFamily: FONTS.mono, fontSize: T.micro, letterSpacing: 1.3, color: RAMP[0] }}>LOWEST</Text>
                  )}
                </View>
              );
            })}
          </View>
        </Panel>

        <View style={{ marginTop: 20 }}>
          {FACTS.map(([big, small]) => (
            <View key={small} style={{ flexDirection: "row", alignItems: "baseline", gap: 16, borderBottomWidth: 1, borderColor: rgba(PAPER, 0.07), paddingVertical: 13, paddingHorizontal: 2 }}>
              <Script size={40} style={{ minWidth: 66 }}>{big}</Script>
              <Text style={{ fontFamily: FONTS.sans, fontSize: T.small, color: rgba(PAPER, 0.48) }}>{small}</Text>
            </View>
          ))}
        </View>

        {mbti && (
          <View style={{ marginTop: 20, padding: 18, borderRadius: 22, backgroundColor: rgba(AQUA, 0.07), borderWidth: 1, borderColor: rgba(AQUA, 0.3) }}>
            <View style={{ flexDirection: "row", alignItems: "center", gap: 9 }}>
              <View style={{ paddingVertical: 4, paddingHorizontal: 10, borderRadius: 100, backgroundColor: rgba(AQUA, 0.15), borderWidth: 1, borderColor: rgba(AQUA, 0.5) }}>
                <Text style={{ fontFamily: FONTS.mono, fontSize: T.micro, color: AQUA }}>{mbti}</Text>
              </View>
              <Label color={rgba(AQUA, 0.7)}>READ FOR YOUR TYPE</Label>
            </View>

            <Script size={30} color={rgba(PAPER, 0.92)} style={{ marginTop: 10 }}>
              {mbti[0] === "I" ? "Quiet days are how you refill, not dips." : "You refill through people, not away from them."}
            </Script>

            <Text style={{ fontFamily: FONTS.sans, fontSize: T.small, color: rgba(PAPER, 0.55), marginTop: 8, lineHeight: T.small * 1.55 }}>
              {mbti[0] === "I"
                ? "Your three quiet days sat next to your two highest ones. That's a normal recharge cycle, not a slump."
                : "Your lowest days this week were also your most isolated. Company tends to be what brings you back up."}
            </Text>

            <View style={{ flexDirection: "row", gap: 10, marginTop: 14, paddingTop: 14, borderTopWidth: 1, borderColor: rgba(AQUA, 0.18) }}>
              {[
                [mbti[0] === "I" ? "3" : "2", mbti[0] === "I" ? "solo days that worked" : "days you saw nobody"],
                [mbti[1] === "N" ? "New" : "Familiar", "settings suit you"],
              ].map(([big, small]) => (
                <View key={small} style={{ flex: 1 }}>
                  <Script size={28} color={AQUA}>{big}</Script>
                  <Text style={{ fontFamily: FONTS.sans, fontSize: 11, color: rgba(PAPER, 0.4), marginTop: 2 }}>{small}</Text>
                </View>
              ))}
            </View>
          </View>
        )}

        <Text style={{ fontFamily: FONTS.mono, fontSize: T.micro, color: rgba(PAPER, 0.4), textAlign: "center", marginTop: 18, lineHeight: T.micro * 1.7 }}>
          Built from levels you set yourself.{"\n"}Nothing is tracked in the background.
        </Text>
      </ScrollView>
    </View>
  );
}
