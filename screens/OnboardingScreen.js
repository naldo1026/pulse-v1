import React, { useState } from "react";
import { View, Text, ScrollView, Pressable, TextInput, StyleSheet } from "react-native";
import { Battery, Users, Check, Music } from "lucide-react-native";
import BatteryGauge from "../components/BatteryGauge";
import { COLORS, FONTS } from "../theme";
import { colorFor, statusFor, LEVEL_OPTIONS, MBTI_TYPES } from "../lib/battery";

const SUGGESTED = ["Ronaldo", "Kyle", "Erin"];
const TOTAL_DOTS = 6;

function Dots({ step }) {
  return (
    <View style={styles.dots}>
      {Array.from({ length: TOTAL_DOTS }).map((_, i) => (
        <View key={i} style={[styles.dot, i === step && styles.dotActive]} />
      ))}
    </View>
  );
}

function PrimaryButton({ children, onPress, color = COLORS.mint }) {
  return (
    <Pressable onPress={onPress} style={[styles.primaryBtn, { backgroundColor: color }]}>
      <Text style={styles.primaryBtnText}>{children}</Text>
    </Pressable>
  );
}

export default function OnboardingScreen({ onFinish }) {
  const [step, setStep] = useState(0);
  const [selected, setSelected] = useState({ Ronaldo: true, Kyle: true, Erin: false });
  const [vibes, setVibes] = useState([]);
  const [songs, setSongs] = useState({ low: "", mid: "", high: "" });
  const [mbti, setMbti] = useState(null);
  const [level, setLevel] = useState(50);

  const count = Object.values(selected).filter(Boolean).length;
  const color = colorFor(level);
  const status = statusFor(level);

  const toggleVibe = (lvl) =>
    setVibes((v) => (v.includes(lvl) ? v.filter((x) => x !== lvl) : v.length >= 3 ? v : [...v, lvl]));

  return (
    <View style={{ flex: 1, backgroundColor: COLORS.ink }}>
      <ScrollView contentContainerStyle={styles.scroll}>
        {step > 0 && step < 7 && (
          <Pressable onPress={() => setStep(7)} style={{ alignSelf: "flex-end" }}>
            <Text style={styles.skip}>Skip setup</Text>
          </Pressable>
        )}

        {step === 0 && (
          <View style={styles.center}>
            <View style={styles.iconCircle}>
              <Battery size={28} color={COLORS.mint} />
            </View>
            <Text style={styles.bigTitle}>Your battery,{"\n"}your business.</Text>
            <Text style={styles.body}>
              Set your status once. Your circle sees it. Nobody has to ask if you're okay.
            </Text>
            <PrimaryButton onPress={() => setStep(1)}>Get started</PrimaryButton>
          </View>
        )}

        {step === 1 && (
          <View>
            <Dots step={0} />
            <Text style={styles.title}>How it works</Text>
            {[
              ["1", "Set your level", "Drag the battery to however you actually feel."],
              ["2", "Your circle sees it", "No group chat message needed."],
              ["3", "No questions asked", "Low battery speaks for itself."],
            ].map(([n, t, d]) => (
              <View key={n} style={styles.stepRow}>
                <View style={styles.stepNum}>
                  <Text style={styles.stepNumText}>{n}</Text>
                </View>
                <View style={{ flex: 1 }}>
                  <Text style={styles.stepTitle}>{t}</Text>
                  <Text style={styles.stepDesc}>{d}</Text>
                </View>
              </View>
            ))}
            <PrimaryButton onPress={() => setStep(2)}>Next</PrimaryButton>
          </View>
        )}

        {step === 2 && (
          <View>
            <Dots step={1} />
            <Text style={styles.title}>Build your circle</Text>
            <Text style={styles.bodyCenter}>Only these people see your battery.</Text>
            <View style={{ gap: 8, marginTop: 20 }}>
              {SUGGESTED.map((name) => (
                <Pressable
                  key={name}
                  onPress={() => setSelected((s) => ({ ...s, [name]: !s[name] }))}
                  style={[styles.personRow, selected[name] && styles.personRowSel]}
                >
                  <View style={styles.smallAvatar}>
                    <Text style={styles.initial}>{name[0]}</Text>
                  </View>
                  <Text style={styles.personName}>{name}</Text>
                  {selected[name] && <Check size={16} color={COLORS.mint} />}
                </Pressable>
              ))}
            </View>
            <Text style={styles.tinyCenter}>{count} selected</Text>
            <PrimaryButton onPress={() => setStep(3)}>Continue</PrimaryButton>
          </View>
        )}

        {step === 3 && (
          <View>
            <Dots step={2} />
            <Text style={styles.title}>Pick your vibe</Text>
            <Text style={styles.bodyCenter}>Choose 3 that feel like you.</Text>
            <View style={styles.vibeGrid}>
              {LEVEL_OPTIONS.map((o) => {
                const sel = vibes.includes(o.level);
                const c = colorFor(o.level);
                return (
                  <Pressable
                    key={o.level}
                    onPress={() => toggleVibe(o.level)}
                    style={[styles.vibeCard, sel && { borderColor: c }]}
                  >
                    <Text style={[styles.vibePct, { color: c }]}>{o.level}%</Text>
                    <Text style={styles.vibeTag}>{o.tag}</Text>
                  </Pressable>
                );
              })}
            </View>
            <Text style={styles.tinyCenter}>{vibes.length}/3 picked</Text>
            <PrimaryButton onPress={() => setStep(4)}>Continue</PrimaryButton>
          </View>
        )}

        {step === 4 && (
          <View>
            <Dots step={3} />
            <View style={styles.iconCircleSmall}>
              <Music size={20} color={COLORS.spotify} />
            </View>
            <Text style={styles.title}>Your soundtrack</Text>
            <Text style={styles.bodyCenter}>One song for each mood.</Text>
            <View style={{ gap: 12, marginTop: 18 }}>
              {[
                { key: "low", label: "The song you play when you're low", color: COLORS.ember },
                { key: "mid", label: "The song for a so-so kind of day", color: COLORS.gold },
                { key: "high", label: "The song that gets you hyped", color: COLORS.mint },
              ].map((f) => (
                <View key={f.key}>
                  <Text style={[styles.fieldLabel, { color: f.color }]}>{f.label}</Text>
                  <TextInput
                    value={songs[f.key]}
                    onChangeText={(t) => setSongs((s) => ({ ...s, [f.key]: t }))}
                    placeholder="Song, Artist"
                    placeholderTextColor="#6b6880"
                    style={styles.input}
                  />
                </View>
              ))}
            </View>
            <PrimaryButton onPress={() => setStep(5)}>Continue</PrimaryButton>
          </View>
        )}

        {step === 5 && (
          <View>
            <Dots step={4} />
            <Text style={styles.title}>Know your type?</Text>
            <Text style={styles.bodyCenter}>
              Myers-Briggs is a popular personality framework. Four letters describe how you recharge, take in
              information, decide, and plan. We mainly use the first letter, I or E, which shapes what we suggest at
              each battery level.
            </Text>
            <View style={styles.mbtiGrid}>
              {MBTI_TYPES.map((t) => {
                const sel = mbti === t;
                return (
                  <Pressable
                    key={t}
                    onPress={() => setMbti(sel ? null : t)}
                    style={[styles.mbtiBtn, sel && { borderColor: COLORS.mint, backgroundColor: "rgba(127,231,196,0.12)" }]}
                  >
                    <Text style={[styles.mbtiText, sel && { color: COLORS.mint }]}>{t}</Text>
                  </Pressable>
                );
              })}
            </View>
            <Text style={styles.tinyCenter}>
              It's a fun frame, not a science. Skip it and the app works the same, just less tailored.
            </Text>
            <PrimaryButton onPress={() => setStep(6)}>{mbti ? "Continue" : "Skip this"}</PrimaryButton>
          </View>
        )}

        {step === 6 && (
          <View style={styles.center}>
            <Dots step={5} />
            <Text style={styles.title}>Where are you right now?</Text>
            <View style={{ marginVertical: 20 }}>
              <BatteryGauge level={level} onChange={setLevel} width={70} height={180} />
            </View>
            <Text style={[styles.ringPct, { color }]}>{level}%</Text>
            <Text style={styles.stepTitle}>{status.label}</Text>
            <PrimaryButton onPress={() => setStep(7)} color={color}>
              Set my level
            </PrimaryButton>
          </View>
        )}

        {step === 7 && (
          <View style={styles.center}>
            <View style={styles.iconCircle}>
              <Users size={24} color={COLORS.mint} />
            </View>
            <Text style={styles.title}>You're set up</Text>
            <Text style={styles.bodyCenter}>{count} people can see your battery now.</Text>
            <PrimaryButton onPress={() => onFinish({ level, vibes, songs, mbti })}>Enter Pulse</PrimaryButton>
          </View>
        )}
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  scroll: { padding: 22, paddingTop: 70, paddingBottom: 40, flexGrow: 1, justifyContent: "center" },
  center: { alignItems: "center" },
  skip: { color: COLORS.muted, fontSize: 12, marginBottom: 8 },
  dots: { flexDirection: "row", gap: 6, justifyContent: "center", marginBottom: 22 },
  dot: { width: 6, height: 6, borderRadius: 3, backgroundColor: COLORS.line },
  dotActive: { width: 18, backgroundColor: COLORS.mint },
  iconCircle: {
    width: 64, height: 64, borderRadius: 18, backgroundColor: COLORS.card,
    borderWidth: 1, borderColor: COLORS.line, alignItems: "center", justifyContent: "center", marginBottom: 22,
  },
  iconCircleSmall: {
    width: 48, height: 48, borderRadius: 14, backgroundColor: COLORS.card, alignSelf: "center",
    borderWidth: 1, borderColor: COLORS.line, alignItems: "center", justifyContent: "center", marginBottom: 14,
  },
  bigTitle: { color: COLORS.paper, fontSize: 24, fontFamily: FONTS.display, textAlign: "center", lineHeight: 30 },
  title: { color: COLORS.paper, fontSize: 19, fontFamily: FONTS.display, textAlign: "center" },
  body: { color: COLORS.muted, fontSize: 13, marginTop: 14, lineHeight: 20, textAlign: "center" },
  bodyCenter: { color: COLORS.muted, fontSize: 12, marginTop: 8, lineHeight: 18, textAlign: "center" },
  tinyCenter: { color: COLORS.muted, fontSize: 10.5, textAlign: "center", marginTop: 12, lineHeight: 16 },
  stepRow: { flexDirection: "row", gap: 12, marginTop: 16 },
  stepNum: {
    width: 26, height: 26, borderRadius: 8, backgroundColor: COLORS.card,
    borderWidth: 1, borderColor: COLORS.line, alignItems: "center", justifyContent: "center",
  },
  stepNumText: { color: COLORS.mint, fontSize: 12, fontFamily: FONTS.mono },
  stepTitle: { color: COLORS.paper, fontSize: 13, fontFamily: FONTS.bodyBold },
  stepDesc: { color: COLORS.muted, fontSize: 12, marginTop: 2 },
  personRow: {
    flexDirection: "row", alignItems: "center", gap: 12, padding: 11,
    borderRadius: 14, backgroundColor: COLORS.card, borderWidth: 1, borderColor: COLORS.line,
  },
  personRowSel: { borderColor: COLORS.mint, backgroundColor: "rgba(127,231,196,0.08)" },
  smallAvatar: {
    width: 30, height: 30, borderRadius: 15, backgroundColor: COLORS.trackBg,
    borderWidth: 1, borderColor: COLORS.line, alignItems: "center", justifyContent: "center",
  },
  initial: { color: COLORS.paper, fontSize: 12, fontFamily: FONTS.bodyBold },
  personName: { flex: 1, color: COLORS.paper, fontSize: 13 },
  vibeGrid: { flexDirection: "row", flexWrap: "wrap", gap: 8, marginTop: 18 },
  vibeCard: {
    width: "48%", padding: 10, borderRadius: 12,
    backgroundColor: COLORS.card, borderWidth: 1, borderColor: COLORS.line,
  },
  vibePct: { fontSize: 10, fontFamily: FONTS.mono },
  vibeTag: { color: COLORS.paper, fontSize: 12, fontFamily: FONTS.bodyBold, marginTop: 2 },
  fieldLabel: { fontSize: 11, fontFamily: FONTS.bodyBold, marginBottom: 5 },
  input: {
    padding: 10, borderRadius: 12, backgroundColor: COLORS.trackBg,
    borderWidth: 1, borderColor: COLORS.line, color: COLORS.paper, fontSize: 13,
  },
  mbtiGrid: { flexDirection: "row", flexWrap: "wrap", gap: 6, marginTop: 16, justifyContent: "center" },
  mbtiBtn: {
    width: "22%", paddingVertical: 9, borderRadius: 10, alignItems: "center",
    backgroundColor: COLORS.card, borderWidth: 1, borderColor: COLORS.line,
  },
  mbtiText: { color: COLORS.muted, fontSize: 11, fontFamily: FONTS.mono },
  ringPct: { fontSize: 28, fontFamily: FONTS.mono, marginTop: 14 },
  primaryBtn: { marginTop: 22, paddingVertical: 13, borderRadius: 14, alignItems: "center", width: "100%" },
  primaryBtnText: { color: COLORS.ink, fontSize: 14, fontFamily: FONTS.display },
});
