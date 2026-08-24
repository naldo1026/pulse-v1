import React, { useState } from "react";
import { View, Text, ScrollView, Pressable, StyleSheet } from "react-native";
import { Check, Clock } from "lucide-react-native";
import MiniBattery from "../components/MiniBattery";
import { COLORS, FONTS } from "../theme";
import { colorFor, CIRCLE, roomSummary } from "../lib/battery";

export default function CircleScreen() {
  const [acknowledged, setAcknowledged] = useState({});
  const [joined, setJoined] = useState({});
  const sorted = [...CIRCLE].sort((a, b) => b.level - a.level);
  const recentCount = CIRCLE.filter((p) => p.recent).length;

  return (
    <ScrollView style={{ flex: 1, backgroundColor: COLORS.ink }} contentContainerStyle={styles.scroll}>
      <Text style={styles.summary}>{roomSummary(CIRCLE)}</Text>
      <Text style={styles.sub}>{recentCount} updated in the last hour</Text>

      <View style={{ gap: 10, marginTop: 16 }}>
        {sorted.map((p) => {
          const c = colorFor(p.level);
          return (
            <View key={p.name} style={styles.row}>
              <View style={[styles.avatar, { borderColor: c }]}>
                <Text style={styles.initial}>{p.name[0]}</Text>
              </View>

              <View style={{ flex: 1, marginLeft: 12 }}>
                <Text style={styles.name}>{p.name}</Text>
                <Text style={styles.note}>
                  {p.note}
                  {acknowledged[p.name] && <Text style={{ color: COLORS.mint }}> · Seen</Text>}
                </Text>
                {p.around && (
                  <View style={styles.aroundRow}>
                    <Clock size={10} color={COLORS.mint} />
                    <Text style={styles.aroundText}>Around {p.around}</Text>
                    <Pressable
                      onPress={() => setJoined((j) => ({ ...j, [p.name]: true }))}
                      style={[styles.joinBtn, joined[p.name] && { borderColor: COLORS.mint }]}
                    >
                      <Text style={[styles.joinBtnText, joined[p.name] && { color: COLORS.mint }]}>
                        {joined[p.name] ? "You're in" : "I'm in"}
                      </Text>
                    </Pressable>
                  </View>
                )}
              </View>

              <MiniBattery level={p.level} size={22} />
              <Text style={[styles.pct, { color: c }]}>{p.level}%</Text>

              <Pressable
                onPress={() => setAcknowledged((a) => ({ ...a, [p.name]: !a[p.name] }))}
                style={[styles.ackBtn, acknowledged[p.name] && { borderColor: COLORS.mint, backgroundColor: "rgba(127,231,196,0.14)" }]}
              >
                <Check size={13} color={acknowledged[p.name] ? COLORS.mint : COLORS.muted} />
              </Pressable>
            </View>
          );
        })}
      </View>

      <Text style={styles.footer}>
        Sorted by energy, so the list moves as your circle's day does.{"\n"}
        Tap the check to say you saw it. No message sent.
      </Text>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  scroll: { padding: 20, paddingTop: 60, paddingBottom: 40 },
  summary: { color: COLORS.paper, fontSize: 17, fontFamily: FONTS.display },
  sub: { color: COLORS.muted, fontSize: 11, marginTop: 3 },
  row: {
    flexDirection: "row", alignItems: "center", padding: 12,
    borderRadius: 16, backgroundColor: COLORS.card, borderWidth: 1, borderColor: COLORS.line,
  },
  avatar: {
    width: 38, height: 38, borderRadius: 19, backgroundColor: COLORS.trackBg,
    borderWidth: 2, alignItems: "center", justifyContent: "center",
  },
  initial: { color: COLORS.paper, fontSize: 13, fontFamily: FONTS.bodyBold },
  name: { color: COLORS.paper, fontSize: 13, fontFamily: FONTS.bodyBold },
  note: { color: COLORS.muted, fontSize: 11, marginTop: 2 },
  aroundRow: { flexDirection: "row", alignItems: "center", gap: 5, marginTop: 5 },
  aroundText: { color: COLORS.mint, fontSize: 10.5 },
  joinBtn: { paddingVertical: 2, paddingHorizontal: 8, borderRadius: 7, borderWidth: 1, borderColor: COLORS.line },
  joinBtnText: { fontSize: 10, color: COLORS.muted, fontFamily: FONTS.bodyBold },
  pct: { fontSize: 13, fontFamily: FONTS.mono, width: 34, textAlign: "right", marginLeft: 6 },
  ackBtn: {
    width: 28, height: 28, borderRadius: 14, borderWidth: 1, borderColor: COLORS.line,
    alignItems: "center", justifyContent: "center", marginLeft: 8,
  },
  footer: { color: COLORS.muted, fontSize: 10, marginTop: 14, textAlign: "center", lineHeight: 16 },
});
