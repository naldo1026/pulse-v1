import React from "react";
import { View, Text, Pressable } from "react-native";
import { useTheme, FONTS, T } from "../theme";
import { colorFor } from "../lib/data";
import { Btn, Display } from "./primitives";
import Sheet from "./Sheet";

const OPTS = [["Rough", 15], ["Slow", 40], ["Okay", 65], ["Good", 90]];

export default function MorningPrompt({ onPick, onDismiss }) {
  const t = useTheme();
  return (
    <Sheet onDismiss={onDismiss}>
      <Display size={30}>Morning. How are you feeling?</Display>
      <View style={{ flexDirection: "row", gap: 8, marginTop: 20 }}>
        {OPTS.map(([l, v]) => (
          <Pressable key={l} onPress={() => onPick(v)} style={{ flex: 1, alignItems: "center", paddingVertical: 16, borderRadius: 14, borderWidth: 1, borderColor: t.line }}>
            <View style={{ width: 12, height: 12, borderRadius: 6, backgroundColor: colorFor(v) }} />
            <Text style={{ fontFamily: FONTS.medium, fontSize: T.small, color: t.ink, marginTop: 8 }}>{l}</Text>
          </Pressable>
        ))}
      </View>
      <Btn variant="ghost" onPress={onDismiss} style={{ marginTop: 8 }}>Later</Btn>
    </Sheet>
  );
}
