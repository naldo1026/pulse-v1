import React from "react";
import { View, Text, ScrollView, StyleSheet } from "react-native";
import Svg, { Circle } from "react-native-svg";
import FlameRing from "../components/FlameRing";
import { COLORS, FONTS } from "../theme";
import { colorFor, weeklyInsight, PAST_HISTORY } from "../lib/battery";

export default function InsightsScreen({ level = 35, mbti }) {
  const history = [...PAST_HISTORY, level];
  const insight = weeklyInsight(history);
  const social = history.filter((v) => v > 60).length;
  const quiet = history.filter((v) => v <= 40).length;
  const avgColor = colorFor(insight.avg);

  const R = 60;
  const CIRC = 2 * Math.PI * R;

  const metrics = [
    { label: "Felt social", value: `${social}/7`, note: "up for company" },
    { label: "Needed quiet", value: `${quiet}/7`, note: "wanted space" },
    { label: "Bounce back", value: "2 days", note: "low to social" },
    { label: "Swing", value: "Wide", note: "day to day" },
  ];

  return (
    <ScrollView style={{ flex: 1, backgroundColor: COLORS.ink }} contentContainerStyle={styles.scroll}>
      <Text style={styles.title}>Your week</Text>
      <Text style={styles.sub}>Mon 17 to Sun 23 Aug</Text>

      <View style={{ marginTop: 14 }}>
        <FlameRing>
          <Svg width={140} height={140} style={{ transform: [{ rotate: "-90deg" }] }}>
            <Circle cx={70} cy={70} r={R} fill="none" stroke={COLORS.line} strokeWidth={10} />
            <Circle
              cx={70} cy={70} r={R} fill="none"
              stroke={avgColor} strokeWidth={10} strokeLinecap="round"
              strokeDasharray={`${(insight.avg / 100) * CIRC} ${CIRC}`}
            />
          </Svg>
        </FlameRing>
        <View style={styles.ringCenter}>
          <Text style={[styles.ringPct, { color: avgColor }]}>{insight.avg}</Text>
          <Text style={[styles.ringUnit, { color: avgColor }]}>%</Text>
        </View>
      </View>

      <Text style={styles.ringCaption}>Weekly average</Text>
      <Text style={styles.headline}>
        Quietest day was <Text style={{ color: COLORS.paper, fontFamily: FONTS.bodyBold }}>{insight.lowDay}</Text>
      </Text>

      <View style={styles.grid}>
        {metrics.map((m) => (
          <View key={m.label} style={styles.metricCard}>
            <Text style={styles.metricLabel}>{m.label}</Text>
            <Text style={styles.metricValue}>{m.value}</Text>
            <Text style={styles.metricNote}>{m.note}</Text>
          </View>
        ))}
      </View>

      <View style={styles.patternCard}>
        <View style={styles.flameDot} />
        <Text style={styles.patternText}>
          You dip midweek, back up by Friday. Third week running.
        </Text>
      </View>

      {mbti && (
        <View style={styles.mbtiCard}>
          <Text style={styles.mbtiTag}>{mbti}</Text>
          <Text style={styles.patternText}>
            {mbti[0] === "I"
              ? "Quiet days are how you refill, not dips."
              : "You refill through people, not away from them."}
          </Text>
        </View>
      )}

      <Text style={styles.footer}>From levels you set. Nothing tracked in the background.</Text>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  scroll: { padding: 20, paddingTop: 64, paddingBottom: 40 },
  title: { color: COLORS.paper, fontSize: 24, fontFamily: FONTS.display },
  sub: { color: COLORS.muted, fontSize: 12, marginTop: 2 },
  ringCenter: { flexDirection: "row", alignItems: "flex-start" },
  ringPct: { fontSize: 46, fontFamily: FONTS.mono, lineHeight: 50 },
  ringUnit: { fontSize: 18, fontFamily: FONTS.mono, marginTop: 6, opacity: 0.75 },
  ringCaption: {
    color: COLORS.muted, fontSize: 10, letterSpacing: 2,
    textAlign: "center", marginTop: 10, textTransform: "uppercase",
  },
  headline: { color: COLORS.muted, fontSize: 14, textAlign: "center", marginTop: 8 },
  grid: { flexDirection: "row", flexWrap: "wrap", gap: 10, marginTop: 22 },
  metricCard: {
    width: "47.5%", padding: 14, borderRadius: 16,
    backgroundColor: COLORS.card, borderWidth: 1, borderColor: COLORS.line,
  },
  metricLabel: { color: COLORS.muted, fontSize: 11 },
  metricValue: { color: COLORS.paper, fontSize: 22, fontFamily: FONTS.display, marginTop: 4 },
  metricNote: { color: COLORS.muted, fontSize: 10, marginTop: 2 },
  patternCard: {
    flexDirection: "row", alignItems: "center", gap: 10, marginTop: 12, padding: 16,
    borderRadius: 16, backgroundColor: COLORS.inkRaised, borderWidth: 1, borderColor: COLORS.flame + "44",
  },
  flameDot: {
    width: 8, height: 8, borderRadius: 4, backgroundColor: COLORS.flame,
    shadowColor: COLORS.flame, shadowOpacity: 1, shadowRadius: 6, shadowOffset: { width: 0, height: 0 },
  },
  patternText: { flex: 1, color: COLORS.paper, fontSize: 13, lineHeight: 19 },
  mbtiCard: {
    flexDirection: "row", alignItems: "center", gap: 12, marginTop: 10, padding: 16,
    borderRadius: 16, backgroundColor: COLORS.card, borderWidth: 1, borderColor: COLORS.line,
  },
  mbtiTag: { color: COLORS.flame, fontSize: 13, fontFamily: FONTS.mono },
  footer: { color: COLORS.muted, fontSize: 10, marginTop: 18, textAlign: "center" },
});
