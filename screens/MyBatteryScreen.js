import React, { useState, useEffect } from "react";
import { View, Text, ScrollView, Pressable, StyleSheet } from "react-native";
import { Sparkles, MessageCircle, Clock, Lock, Music, Star } from "lucide-react-native";
import BatteryGauge from "../components/BatteryGauge";
import MiniBattery from "../components/MiniBattery";
import VibeCheck from "../components/VibeCheck";
import { COLORS, FONTS } from "../theme";
import {
  colorFor, statusFor, personalisedBucket, lowBatteryNoteFor, REASONS,
  CIRCLE, HISTORY_DAYS, PAST_HISTORY, lowCompanions, companionLine,
  weeklyInsight, findMatches,
} from "../lib/battery";

const PRESETS = [10, 30, 50, 70, 90];

export default function MyBatteryScreen({ mbti }) {
  const [level, setLevel] = useState(35);
  const [reason, setReason] = useState(null);
  const [wantsChat, setWantsChat] = useState(false);
  const [imAround, setImAround] = useState(null);
  const [pulseMsg, setPulseMsg] = useState(null);
  const [matches, setMatches] = useState([]);
  const [sent, setSent] = useState({});
  const [showVibe, setShowVibe] = useState(false);

  const status = statusFor(level);
  const color = colorFor(level);
  const bucket = level > 40 ? personalisedBucket(level, mbti) : null;
  const history = [...PAST_HISTORY, level];
  const insight = weeklyInsight(history);
  const companions = lowCompanions(CIRCLE);

  useEffect(() => {
    if (level > 40 && wantsChat) setWantsChat(false);
    if (level <= 60 && imAround) setImAround(null);
  }, [level]);

  const sendPulse = () => {
    const chatNote = wantsChat ? ", and open to a chat if anyone's around" : "";
    setPulseMsg(`Pulse sent. Your circle can see you're at ${level}%${chatNote}`);
    setMatches(findMatches(level));
    setSent({});
    setTimeout(() => setPulseMsg(null), 2600);
  };

  return (
    <View style={{ flex: 1, backgroundColor: COLORS.ink }}>
      <ScrollView contentContainerStyle={styles.scroll}>
        <Text style={styles.eyebrow}>SOCIAL BATTERY</Text>
        <Text style={styles.greeting}>Evening</Text>

        <View style={styles.gaugeRow}>
          <BatteryGauge level={level} onChange={setLevel} />
          <View style={{ marginLeft: 22, flex: 1 }}>
            <Text style={[styles.readout, { color }]}>
              {level}
              <Text style={styles.readoutPct}>%</Text>
            </Text>
            <Text style={styles.statusLabel}>{status.label}</Text>
            <Text style={styles.statusSub}>{status.sub}</Text>
          </View>
        </View>

        <Text style={styles.hint}>Drag the cell, or tap a level below</Text>
        <View style={styles.presetRow}>
          {PRESETS.map((v) => (
            <Pressable
              key={v}
              onPress={() => setLevel(v)}
              style={[styles.presetBtn, Math.abs(level - v) < 10 && { backgroundColor: COLORS.card }]}
            >
              <Text style={[styles.presetText, { color: colorFor(v) }]}>{v}</Text>
            </Pressable>
          ))}
        </View>

        <Pressable onPress={() => setShowVibe(true)} style={styles.vibeLink}>
          <Sparkles size={11} color={COLORS.muted} />
          <Text style={styles.vibeLinkText}>Not sure? Quick vibe check</Text>
        </Pressable>

        {/* 7 day history */}
        <View style={styles.section}>
          <View style={styles.sectionHeaderRow}>
            <Text style={styles.sectionLabel}>LAST 7 DAYS</Text>
            <Text style={styles.tinyMuted}>Only visible to you</Text>
          </View>
          <View style={styles.sparkRow}>
            {history.map((v, i) => (
              <View key={i} style={{ flex: 1, alignItems: "center", gap: 4 }}>
                <View
                  style={{
                    width: "100%",
                    height: Math.max(6, (v / 100) * 40),
                    borderRadius: 3,
                    backgroundColor: colorFor(v),
                    opacity: i === history.length - 1 ? 1 : 0.45,
                  }}
                />
                <Text style={styles.sparkDay}>{HISTORY_DAYS[i]}</Text>
              </View>
            ))}
          </View>
          <View style={styles.weekCard}>
            <Text style={styles.sectionLabel}>YOUR WEEK</Text>
            <Text style={styles.weekText}>
              You averaged <Text style={{ color: colorFor(insight.avg), fontFamily: FONTS.mono }}>{insight.avg}%</Text>.
              Your lowest day was <Text style={{ fontFamily: FONTS.bodyBold }}>{insight.lowDay}</Text>.
            </Text>
          </View>
        </View>

        {level <= 40 ? (
          <View style={styles.section}>
            <Text style={styles.sectionLabel}>WHY, IF YOU WANT TO SAY</Text>
            <View style={styles.chipWrap}>
              {REASONS.map((r) => (
                <Pressable
                  key={r}
                  onPress={() => setReason(reason === r ? null : r)}
                  style={[styles.chip, reason === r && { borderColor: COLORS.ember, backgroundColor: "rgba(255,107,74,0.12)" }]}
                >
                  <Text style={[styles.chipText, reason === r && { color: COLORS.ember }]}>{r}</Text>
                </Pressable>
              ))}
            </View>

            <Pressable onPress={() => setWantsChat(!wantsChat)} style={styles.chatLink}>
              <MessageCircle size={13} color={wantsChat ? COLORS.gold : COLORS.muted} />
              <Text style={[styles.chatLinkText, wantsChat && { color: COLORS.gold }]}>
                {wantsChat ? "Open to a chat, if anyone's around" : "Actually, I could use a chat"}
              </Text>
            </Pressable>

            {companionLine(companions) && (
              <View style={styles.companionCard}>
                <View style={{ flexDirection: "row" }}>
                  {companions.slice(0, 3).map((n, i) => (
                    <View key={n} style={[styles.companionAvatar, { marginLeft: i === 0 ? 0 : -8 }]}>
                      <Text style={styles.companionInitial}>{n[0]}</Text>
                    </View>
                  ))}
                </View>
                <View style={{ flex: 1, marginLeft: 10 }}>
                  <Text style={styles.companionText}>{companionLine(companions)}</Text>
                  <Text style={styles.tinyMuted}>You're not the only one having a quiet one.</Text>
                </View>
              </View>
            )}

            <Text style={styles.restNote}>{lowBatteryNoteFor(mbti)}</Text>
          </View>
        ) : (
          <View style={styles.section}>
            <Text style={styles.sectionLabel}>SUGGESTED FOR YOU</Text>
            <View style={styles.chipWrap}>
              {[bucket.tag, ...bucket.extra].map((act) => (
                <View key={act} style={styles.chip}>
                  <Text style={[styles.chipText, { color: COLORS.paper }]}>{act}</Text>
                </View>
              ))}
            </View>

            {level > 60 && (
              <View style={{ marginTop: 14 }}>
                <Text style={styles.sectionLabel}>PUT IT OUT THERE</Text>
                {!imAround ? (
                  <View style={{ flexDirection: "row", gap: 8 }}>
                    {["an hour", "till 10", "all evening"].map((w) => (
                      <Pressable key={w} onPress={() => setImAround(w)} style={styles.aroundChip}>
                        <Text style={styles.aroundChipText}>I'm around {w}</Text>
                      </Pressable>
                    ))}
                  </View>
                ) : (
                  <View style={styles.aroundActive}>
                    <Clock size={14} color={COLORS.mint} />
                    <Text style={styles.aroundActiveText}>You're around {imAround}</Text>
                    <Pressable onPress={() => setImAround(null)}>
                      <Text style={styles.tinyMuted}>Clear</Text>
                    </Pressable>
                  </View>
                )}
                <Text style={styles.tinyMuted}>An open invite, not a status. It expires on its own.</Text>
              </View>
            )}
          </View>
        )}

        <Pressable onPress={sendPulse} style={[styles.pulseBtn, { backgroundColor: color }]}>
          <Text style={styles.pulseBtnText}>Send pulse to circle</Text>
        </Pressable>
        {pulseMsg && <Text style={styles.pulseMsg}>{pulseMsg}</Text>}

        {matches.length > 0 && (
          <View style={{ marginTop: 12, gap: 6 }}>
            <Text style={[styles.sectionLabel, { textAlign: "center" }]}>SIMILAR ENERGY RIGHT NOW</Text>
            {matches.map((m) => (
              <View key={m.name} style={styles.matchRow}>
                <Text style={styles.matchText}>
                  {m.phrase} with <Text style={{ fontFamily: FONTS.bodyBold }}>{m.name}</Text>
                </Text>
                <Pressable
                  onPress={() => setSent((s) => ({ ...s, [m.name]: true }))}
                  style={[styles.suggestBtn, sent[m.name] && { borderColor: COLORS.mint }]}
                >
                  <Text style={[styles.suggestBtnText, sent[m.name] && { color: COLORS.mint }]}>
                    {sent[m.name] ? "Sent" : "Suggest"}
                  </Text>
                </Pressable>
              </View>
            ))}
          </View>
        )}

        <View style={styles.lockedCard}>
          <Lock size={16} color={COLORS.muted} />
          <View style={{ flex: 1, marginLeft: 10 }}>
            <Text style={styles.lockedTitle}>Auto-sensing</Text>
            <Text style={styles.tinyMuted}>Learns your rhythms over time. Coming soon.</Text>
          </View>
        </View>
      </ScrollView>

      {showVibe && (
        <VibeCheck
          onComplete={(v) => {
            setLevel(v);
            setShowVibe(false);
          }}
          onSkip={() => setShowVibe(false)}
        />
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  scroll: { padding: 20, paddingTop: 60, paddingBottom: 40 },
  eyebrow: { color: COLORS.muted, fontSize: 11, letterSpacing: 2, fontFamily: FONTS.mono },
  greeting: { color: COLORS.paper, fontSize: 22, fontFamily: FONTS.display, marginTop: 4, marginBottom: 24 },
  gaugeRow: { flexDirection: "row", alignItems: "center" },
  readout: { fontSize: 44, fontFamily: FONTS.mono },
  readoutPct: { fontSize: 20, opacity: 0.7 },
  statusLabel: { color: COLORS.paper, fontSize: 15, fontFamily: FONTS.bodyBold, marginTop: 10 },
  statusSub: { color: COLORS.muted, fontSize: 12, marginTop: 4, lineHeight: 17 },
  hint: { color: COLORS.muted, fontSize: 11, marginTop: 16, textAlign: "center" },
  presetRow: { flexDirection: "row", gap: 8, marginTop: 10, justifyContent: "center" },
  presetBtn: {
    width: 34, height: 34, borderRadius: 10, borderWidth: 1,
    borderColor: COLORS.line, alignItems: "center", justifyContent: "center",
  },
  presetText: { fontSize: 11, fontFamily: FONTS.mono },
  vibeLink: { flexDirection: "row", alignItems: "center", gap: 5, justifyContent: "center", marginTop: 10 },
  vibeLinkText: { color: COLORS.muted, fontSize: 11 },
  section: { marginTop: 20 },
  sectionHeaderRow: { flexDirection: "row", justifyContent: "space-between", alignItems: "center" },
  sectionLabel: { color: COLORS.muted, fontSize: 10, letterSpacing: 1, marginBottom: 8 },
  tinyMuted: { color: COLORS.muted, fontSize: 10 },
  sparkRow: { flexDirection: "row", alignItems: "flex-end", gap: 6, height: 46 },
  sparkDay: { color: COLORS.muted, fontSize: 9 },
  weekCard: { marginTop: 12, padding: 13, borderRadius: 12, backgroundColor: COLORS.card, borderWidth: 1, borderColor: COLORS.line },
  weekText: { color: COLORS.paper, fontSize: 12, lineHeight: 18 },
  chipWrap: { flexDirection: "row", flexWrap: "wrap", gap: 8 },
  chip: { paddingVertical: 7, paddingHorizontal: 12, borderRadius: 20, borderWidth: 1, borderColor: COLORS.line },
  chipText: { fontSize: 12, color: COLORS.muted },
  chatLink: { flexDirection: "row", alignItems: "center", gap: 6, marginTop: 10 },
  chatLinkText: { color: COLORS.muted, fontSize: 11.5 },
  companionCard: {
    flexDirection: "row", alignItems: "center", marginTop: 14, padding: 12,
    borderRadius: 14, backgroundColor: "rgba(255,107,74,0.07)", borderWidth: 1, borderColor: COLORS.line,
  },
  companionAvatar: {
    width: 26, height: 26, borderRadius: 13, backgroundColor: COLORS.trackBg,
    borderWidth: 1.5, borderColor: COLORS.ember, alignItems: "center", justifyContent: "center",
  },
  companionInitial: { color: COLORS.paper, fontSize: 11, fontFamily: FONTS.bodyBold },
  companionText: { color: COLORS.paper, fontSize: 12, fontFamily: FONTS.bodyBold },
  restNote: { color: COLORS.muted, fontSize: 11, marginTop: 12, textAlign: "center" },
  aroundChip: { flex: 1, paddingVertical: 9, borderRadius: 12, borderWidth: 1, borderColor: COLORS.line, backgroundColor: COLORS.card, alignItems: "center" },
  aroundChipText: { color: COLORS.paper, fontSize: 11 },
  aroundActive: {
    flexDirection: "row", alignItems: "center", gap: 9, padding: 11,
    borderRadius: 12, borderWidth: 1, borderColor: COLORS.mint, backgroundColor: "rgba(127,231,196,0.1)",
  },
  aroundActiveText: { flex: 1, color: COLORS.mint, fontSize: 12, fontFamily: FONTS.bodyBold },
  pulseBtn: { marginTop: 22, paddingVertical: 13, borderRadius: 14, alignItems: "center" },
  pulseBtnText: { color: COLORS.ink, fontSize: 14, fontFamily: FONTS.display },
  pulseMsg: { color: COLORS.mint, fontSize: 12, marginTop: 10, textAlign: "center" },
  matchRow: {
    flexDirection: "row", alignItems: "center", justifyContent: "space-between",
    padding: 10, borderRadius: 12, backgroundColor: COLORS.card, borderWidth: 1, borderColor: COLORS.line,
  },
  matchText: { color: COLORS.paper, fontSize: 12, flex: 1 },
  suggestBtn: { paddingVertical: 5, paddingHorizontal: 10, borderRadius: 8, borderWidth: 1, borderColor: COLORS.line },
  suggestBtnText: { fontSize: 11, color: COLORS.muted, fontFamily: FONTS.bodyBold },
  lockedCard: {
    flexDirection: "row", alignItems: "center", marginTop: 22, padding: 12,
    borderRadius: 14, borderWidth: 1, borderStyle: "dashed", borderColor: COLORS.line, opacity: 0.6,
  },
  lockedTitle: { color: COLORS.paper, fontSize: 12, fontFamily: FONTS.bodyBold },
});
