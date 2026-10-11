import React from "react";
import { View, Text, Modal, Pressable } from "react-native";
import { PANEL, PAPER, FONTS, T, rgba } from "../theme";
import { colorFor } from "../lib/data";
import { Script, Label } from "./primitives";

const OPTS = [["Rough", 15], ["Slow", 40], ["Decent", 65], ["Ready", 90]];

export default function MorningPrompt({ onPick, onDismiss }) {
  return (
    <Modal transparent animationType="fade" visible onRequestClose={onDismiss}>
      <View style={{ flex: 1, backgroundColor: "rgba(6,4,14,0.93)", paddingTop: 70, paddingHorizontal: 18 }}>
        <View style={{ padding: 20, borderRadius: 24, backgroundColor: PANEL, borderWidth: 1, borderColor: rgba(PAPER, 0.1) }}>
          <View style={{ flexDirection: "row", justifyContent: "space-between", alignItems: "center" }}>
            <Label>PULSE · 07:40</Label>
            <Pressable onPress={onDismiss}>
              <Text style={{ fontFamily: FONTS.mono, fontSize: T.micro, color: rgba(PAPER, 0.4) }}>LATER</Text>
            </Pressable>
          </View>
          <Script size={33} style={{ marginTop: 10 }}>How are you starting today?</Script>
          <Text style={{ fontFamily: FONTS.sans, fontSize: T.small, color: rgba(PAPER, 0.45), marginTop: 6 }}>One tap and they know, before anyone knocks.</Text>
          <View style={{ flexDirection: "row", gap: 8, marginTop: 18 }}>
            {OPTS.map(([l, v]) => {
              const col = colorFor(v);
              return (
                <Pressable key={l} onPress={() => onPick(v)} style={{ flex: 1, paddingVertical: 14, paddingHorizontal: 4, borderRadius: 16, backgroundColor: rgba(PAPER, 0.03), borderWidth: 1, borderColor: rgba(PAPER, 0.08), alignItems: "center" }}>
                  <View style={{ width: 22, height: 22, borderRadius: 11, backgroundColor: col, shadowColor: col, shadowOpacity: 0.8, shadowRadius: 10, shadowOffset: { width: 0, height: 0 } }} />
                  <Script size={21} style={{ marginTop: 7 }}>{l}</Script>
                </Pressable>
              );
            })}
          </View>
        </View>
      </View>
    </Modal>
  );
}
