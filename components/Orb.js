import React from "react";
import { View, Text, Pressable } from "react-native";
import Svg, { Circle } from "react-native-svg";
import { PANEL, PAPER, FONTS, rgba } from "../theme";
import { colorFor } from "../lib/data";

export default function Orb({ p, size, onPress, selected }) {
  const c = colorFor(p.l);
  const R = size / 2 - 3;
  const CIRC = 2 * Math.PI * R;

  return (
    <Pressable onPress={onPress} style={{ position: "absolute", width: size, height: size, marginLeft: -size / 2, marginTop: -size / 2 }}>
      <Svg width={size} height={size} style={{ position: "absolute", inset: 0, transform: [{ rotate: "-90deg" }] }}>
        <Circle cx={size / 2} cy={size / 2} r={R} fill="none" stroke={rgba(PAPER, 0.1)} strokeWidth={3} />
        <Circle
          cx={size / 2} cy={size / 2} r={R} fill="none" stroke={c} strokeWidth={3} strokeLinecap="round"
          strokeDasharray={`${(p.l / 100) * CIRC} ${CIRC}`}
        />
      </Svg>
      <View
        style={{
          position: "absolute", inset: 5, borderRadius: size / 2,
          backgroundColor: selected ? rgba(c, 0.18) : PANEL,
          borderWidth: 1, borderColor: selected ? rgba(c, 0.5) : rgba(PAPER, 0.06),
          alignItems: "center", justifyContent: "center",
          shadowColor: c, shadowOpacity: 0.5, shadowRadius: 6, shadowOffset: { width: 0, height: 0 },
        }}
      >
        <Text style={{ fontFamily: FONTS.sansBold, fontSize: size * 0.3, color: PAPER }}>{p.n[0]}</Text>
      </View>
    </Pressable>
  );
}
