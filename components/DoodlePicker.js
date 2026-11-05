import React from "react";
import { View, Text, Pressable, ScrollView, Dimensions } from "react-native";
import { useTheme, FONTS, T } from "../theme";
import { DOODLES } from "../lib/doodles";
import Sheet from "./Sheet";
import Doodle from "./Doodle";
import { Display } from "./primitives";

const CELL = 56;

// Choose the doodle you see for someone. Their initial is the first option,
// so a doodle can be taken off again. onPick(id | null).
export default function DoodlePicker({ p, onPick, onDismiss }) {
  const t = useTheme();
  const cell = (key, on, label, onPress, children) => (
    <Pressable
      key={key}
      onPress={onPress}
      accessibilityRole="button"
      accessibilityLabel={label}
      accessibilityState={{ selected: on }}
      style={{
        width: CELL, height: CELL, borderRadius: CELL / 2, alignItems: "center", justifyContent: "center",
        backgroundColor: on ? t.sunk : "transparent", borderWidth: 1.5, borderColor: on ? t.ink : "transparent",
      }}
    >
      {children}
    </Pressable>
  );
  return (
    <Sheet onDismiss={onDismiss}>
      <Display size={24}>A doodle for {p.n}</Display>
      <Text style={{ fontFamily: FONTS.sans, fontSize: T.body, color: t.muted, marginTop: 2, marginBottom: 16 }}>Only you'll see it.</Text>
      <ScrollView style={{ maxHeight: Dimensions.get("window").height * 0.55 }}>
        <View style={{ flexDirection: "row", flexWrap: "wrap", justifyContent: "center", gap: 4 }}>
          {cell("initial", !p.d, `${p.n}'s initial`, () => onPick(null), (
            <Text style={{ fontFamily: FONTS.medium, fontSize: 20, color: t.ink }}>{p.n[0]}</Text>
          ))}
          {DOODLES.map((x) => cell(x.id, p.d === x.id, x.label, () => onPick(x.id), <Doodle id={x.id} size={36} color={t.ink} />))}
        </View>
      </ScrollView>
    </Sheet>
  );
}
