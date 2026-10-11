import React, { useState } from "react";
import { View, Text, Modal, Pressable } from "react-native";
import { PANEL, PAPER, GOLD, FONTS, T, rgba } from "../theme";
import { QUIZ, colorFor } from "../lib/data";
import { Script } from "./primitives";

export default function VibeCheckModal({ onDone, onSkip }) {
  const [step, setStep] = useState(0);
  const [first, setFirst] = useState(0);
  const q = QUIZ[step];

  const pick = (v) => {
    if (step === 0) { setFirst(v); setStep(1); }
    else onDone(Math.round((first + v) / 2));
  };

  return (
    <Modal transparent animationType="fade" visible onRequestClose={onSkip}>
      <View style={{ flex: 1, backgroundColor: "rgba(6,4,14,0.95)", justifyContent: "center", padding: 20 }}>
        <View style={{ padding: 22, borderRadius: 26, backgroundColor: PANEL, borderWidth: 1, borderColor: rgba(PAPER, 0.1) }}>
          <View style={{ flexDirection: "row", justifyContent: "space-between", alignItems: "center", marginBottom: 14 }}>
            <View style={{ flexDirection: "row", gap: 5 }}>
              {[0, 1].map((i) => (
                <View key={i} style={{ width: i === step ? 18 : 6, height: 5, borderRadius: 3, backgroundColor: i === step ? GOLD : rgba(PAPER, 0.15) }} />
              ))}
            </View>
            <Pressable onPress={onSkip}>
              <Text style={{ fontFamily: FONTS.mono, fontSize: T.micro, color: rgba(PAPER, 0.4) }}>SKIP</Text>
            </Pressable>
          </View>

          <Script size={34} style={{ marginBottom: 18 }}>{q.q}</Script>

          <View style={{ gap: 9 }}>
            {q.o.map(([label, sub, v]) => {
              const col = colorFor(v);
              return (
                <Pressable
                  key={label}
                  onPress={() => pick(v)}
                  style={{ flexDirection: "row", alignItems: "center", gap: 14, paddingVertical: 13, paddingHorizontal: 15, borderRadius: 18, backgroundColor: rgba(PAPER, 0.03), borderWidth: 1, borderColor: rgba(PAPER, 0.07) }}
                >
                  <View style={{ width: 30, height: 30, borderRadius: 15, backgroundColor: col, borderWidth: 1, borderColor: rgba(PAPER, 0.25), shadowColor: col, shadowOpacity: 0.8, shadowRadius: 10, shadowOffset: { width: 0, height: 0 } }} />
                  <View style={{ flex: 1 }}>
                    <Script size={26} color={PAPER}>{label}</Script>
                    <Text style={{ fontFamily: FONTS.sans, fontSize: T.micro, color: rgba(PAPER, 0.42), marginTop: 3 }}>{sub}</Text>
                  </View>
                  <Text style={{ fontFamily: FONTS.mono, fontSize: T.micro, color: rgba(col, 0.75) }}>{v}%</Text>
                </Pressable>
              );
            })}
          </View>
        </View>
      </View>
    </Modal>
  );
}
