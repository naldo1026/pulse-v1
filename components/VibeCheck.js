import React, { useState } from "react";
import { View, Text, Pressable, StyleSheet } from "react-native";
import { COLORS, FONTS } from "../theme";
import { VIBE_QUESTIONS } from "../lib/battery";

export default function VibeCheck({ onComplete, onSkip }) {
  const [step, setStep] = useState(0);
  const [first, setFirst] = useState(0);
  const q = VIBE_QUESTIONS[step];

  const pick = (value) => {
    if (step === 0) {
      setFirst(value);
      setStep(1);
    } else {
      onComplete(Math.round((first + value) / 2));
    }
  };

  return (
    <View style={styles.overlay}>
      <View style={styles.card}>
        <View style={styles.header}>
          <View style={{ flexDirection: "row", gap: 5 }}>
            {[0, 1].map((i) => (
              <View key={i} style={[styles.dot, i === step && styles.dotActive]} />
            ))}
          </View>
          <Pressable onPress={onSkip}>
            <Text style={styles.skip}>Skip</Text>
          </Pressable>
        </View>
        <Text style={styles.prompt}>{q.prompt}</Text>
        <View style={styles.grid}>
          {q.options.map((o) => (
            <Pressable key={o.label} onPress={() => pick(o.value)} style={styles.option}>
              <Text style={{ fontSize: 24 }}>{o.emoji}</Text>
              <Text style={styles.optionLabel}>{o.label}</Text>
            </Pressable>
          ))}
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  overlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: "rgba(10,9,15,0.9)",
    justifyContent: "center",
    padding: 24,
    zIndex: 20,
  },
  card: { backgroundColor: COLORS.card, borderWidth: 1, borderColor: COLORS.line, borderRadius: 20, padding: 18 },
  header: { flexDirection: "row", justifyContent: "space-between", alignItems: "center", marginBottom: 16 },
  dot: { width: 6, height: 6, borderRadius: 3, backgroundColor: COLORS.line },
  dotActive: { width: 16, backgroundColor: COLORS.mint },
  skip: { color: COLORS.muted, fontSize: 11 },
  prompt: { color: COLORS.paper, fontSize: 15, fontFamily: FONTS.display, textAlign: "center", marginBottom: 18 },
  grid: { flexDirection: "row", flexWrap: "wrap", gap: 10 },
  option: {
    width: "47%",
    alignItems: "center",
    gap: 5,
    paddingVertical: 16,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: COLORS.line,
    backgroundColor: COLORS.trackBg,
  },
  optionLabel: { color: COLORS.muted, fontSize: 11, textAlign: "center" },
});
