import React, { useState } from "react";
import { View, Text, Pressable } from "react-native";
import { useTheme, FONTS, T } from "../theme";
import { QUIZ, colorFor } from "../lib/data";
import { Display } from "./primitives";
import Sheet from "./Sheet";

export default function VibeCheckModal({ onDone, onSkip }) {
  const t = useTheme();
  const [step, setStep] = useState(0);
  const [first, setFirst] = useState(0);
  const q = QUIZ[step];

  const pick = (v) => {
    if (step === 0) { setFirst(v); setStep(1); }
    else onDone(Math.round((first + v) / 2));
  };

  return (
    <Sheet onDismiss={onSkip}>
      <View style={{ flexDirection: "row", justifyContent: "space-between", alignItems: "center" }}>
        <Text style={{ fontFamily: FONTS.sans, fontSize: T.small, color: t.faint }}>{step + 1} of 2</Text>
        <Pressable onPress={onSkip} hitSlop={10}>
          <Text style={{ fontFamily: FONTS.medium, fontSize: T.small, color: t.muted }}>Skip</Text>
        </Pressable>
      </View>

      <Display size={30} style={{ marginTop: 8, marginBottom: 20 }}>{q.q}</Display>

      <View style={{ gap: 8 }}>
        {q.o.map(([label, sub, v]) => (
          <Pressable
            key={label}
            onPress={() => pick(v)}
            style={{ flexDirection: "row", alignItems: "center", gap: 14, paddingVertical: 14, paddingHorizontal: 16, borderRadius: 14, borderWidth: 1, borderColor: t.line }}
          >
            <View style={{ width: 12, height: 12, borderRadius: 6, backgroundColor: colorFor(v) }} />
            <View style={{ flex: 1 }}>
              <Text style={{ fontFamily: FONTS.medium, fontSize: T.body, color: t.ink }}>{label}</Text>
              <Text style={{ fontFamily: FONTS.sans, fontSize: T.small, color: t.muted, marginTop: 1 }}>{sub}</Text>
            </View>
          </Pressable>
        ))}
      </View>
    </Sheet>
  );
}
