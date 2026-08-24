import React from "react";
import { View, Text, ScrollView, StyleSheet } from "react-native";
import Svg, { Circle } from "react-native-svg";
import { Sparkles } from "lucide-react-native";
import { COLORS, FONTS } from "../theme";
import { colorFor, weeklyInsight, PAST_HISTORY } from "../lib/battery";

export default function InsightsScreen({ level = 35, mbti }) {
  const history = [...PAST_HISTORY, level];
  const insight = weeklyInsight(history);
  const socialDays = history.filter((v) => v > 60).length;
  const quietDays = history.filter((v) => v <= 40).length;
  const R = 56;
  const CIRC = 2 * Math.PI * R;

  const metrics = [
    { label: "Days you felt social", value: `${socialDays} of 7`, note: "you were up for company" },
    { label: "Days you needed quiet", value: `${quietDays} of 7`, note: "you wanted space" },
    { label: "Time to bounce back", value: "About 2 days", note: "from a low day to feeling social again" },
    { label: "How much you swung", value: "A fair bit", note: "your days varied more than they stayed the same" },
  ];

  return (
    <ScrollView style={{ flex: 1, backgroundColor: COLORS.ink }} contentContainerStyle={styles.scroll}>
      <Text style={styles.title}>Your week</Text>
      <Text style={styles.sub}>Mon 17 to Sun 23 Aug. No scores, just what your week looked like.</Text>

      {/* Headline ring. Flame glow via layered shadow rings. */}
      <View style={styles.ringWrap}>
        <View style={styles.flameGlow} />
        <Svg width={132} height={132} style={{ transform: [{ rotate: "-90deg" }] }}>
          <Circle cx={66} cy={66} r={R} fill="none" stroke={COLORS.line} strokeWidth={9} />
          <Circle
            cx={66}
            cy={66}
            r={R}
            fill="none"
            stroke={colorFor(insight.avg)}
            strokeWidth={9}
            strokeLinecap="round"
            strokeDasharray={`${(insight.avg / 100) * CIRC} ${CIRC}`}
          />
        </Svg>
        <View style={styles.ringCenter}>
          <Text style={[styles.ringPct, { color: colorFor(insight.avg) }]}>{insight.avg}%</Text>
          <Text style={styles.tinyMuted}>average this week</Text>
        </View>
      </View>

      <Text style={styles.summaryText}>
        Most days you sat around {insight.avg}% this week. Your quietest day was{" "}
        <Text style={{ fontFamily: FONTS.bodyBold }}>{insight.lowDay}</Text>.
      </Text>

      <View style={styles.grid}>
        {metrics.map((m) => (
          <View key={m.label} style={styles.metricCard}>
            <Text style={styles.metricLabel}>{m.label}</Text>
            <Text style={styles.metricValue}>{m.value}</Text>
            <Text style={styles.tinyMuted}>{m.note}</Text>
          </View>
        ))}
      </View>

      <View style={styles.patternCard}>
        <View style={{ flexDirection: "row", alignItems: "center", gap: 6, marginBottom: 6 }}>
          <Sparkles size={13} color={COLORS.gold} />
          <Text style={styles.patternLabel}>WHAT WE NOTICED</Text>
        </View>
        <Text style={styles.patternText}>
          You run low in the middle of the week and pick back up by Friday. That's happened three weeks running now,
          so it looks like your normal rhythm rather than a bad patch.
        </Text>
      </View>

      {mbti && (
        <View style={styles.mbtiCard}>
          <Text style={styles.metricLabel}>What this means for {mbti}</Text>
          <Text style={styles.patternText}>
            {mbti[0] === "I"
              ? "Your quiet days aren't dips. They're how you refill, and this week's pattern looks healthy for how you recharge."
              : "You tend to refill through people rather than away from them. Your low days this week were also your most isolated ones."}
          </Text>
        </View>
      )}

      <Text style={styles.footer}>
        All of this comes from the levels you set yourself. Nothing is tracked in the background.
      </Text>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  scroll: { padding: 20, paddingTop: 60, paddingBottom: 40 },
  title: { color: COLORS.paper, fontSize: 17, fontFamily: FONTS.display },
  sub: { color: COLORS.muted, fontSize: 11, marginTop: 3 },
  ringWrap: { alignItems: "center", justifyContent: "center", marginTop: 22, height: 146 },
  flameGlow: {
    position: "absolute", width: 146, height: 146, borderRadius: 73,
    borderWidth: 2, borderColor: COLORS.flame, opacity: 0.35,
    shadowColor: COLORS.flame, shadowOpacity: 1, shadowRadius: 14, shadowOffset: { width: 0, height: 0 },
  },
  ringCenter: { ...StyleSheet.absoluteFillObject, alignItems: "center", justifyContent: "center" },
  ringPct: { fontSize: 34, fontFamily: FONTS.mono },
  tinyMuted: { color: COLORS.muted, fontSize: 10, marginTop: 2 },
  summaryText: { color: COLORS.paper, fontSize: 12.5, textAlign: "center", lineHeight: 19, marginTop: 8 },
  grid: { flexDirection: "row", flexWrap: "wrap", gap: 8, marginTop: 18 },
  metricCard: {
    width: "48%", padding: 13, borderRadius: 14,
    backgroundColor: COLORS.card, borderWidth: 1, borderColor: COLORS.line,
  },
  metricLabel: { color: COLORS.muted, fontSize: 9.5, letterSpacing: 0.8 },
  metricValue: { color: COLORS.paper, fontSize: 16, fontFamily: FONTS.display, marginTop: 5 },
  patternCard: {
    marginTop: 12, padding: 14, borderRadius: 14,
    backgroundColor: "rgba(244,199,123,0.07)", borderWidth: 1, borderColor: COLORS.line,
  },
  patternLabel: { color: COLORS.gold, fontSize: 10, letterSpacing: 1 },
  patternText: { color: COLORS.paper, fontSize: 12, lineHeight: 19, marginTop: 4 },
  mbtiCard: {
    marginTop: 10, padding: 14, borderRadius: 14,
    backgroundColor: COLORS.card, borderWidth: 1, borderColor: COLORS.line,
  },
  footer: { color: COLORS.muted, fontSize: 9.5, marginTop: 14, textAlign: "center", lineHeight: 15 },
});
