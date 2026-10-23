import React from "react";
import { View, Text, Pressable } from "react-native";
import Svg, { Circle } from "react-native-svg";
import { useTheme, FONTS } from "../theme";
import { colorFor } from "../lib/data";

export default function Orb({ p, size, onPress, selected }) {
  const t = useTheme();
  const c = colorFor(p.l);
  const stroke = size > 64 ? 3 : 2.5;
  const R = size / 2 - stroke / 2;
  const CIRC = 2 * Math.PI * R;
  const gap = stroke + 3;

  return (
    <Pressable onPress={onPress} style={{ position: "absolute", width: size, height: size, marginLeft: -size / 2, marginTop: -size / 2 }}>
      <Svg width={size} height={size} style={{ position: "absolute", inset: 0, transform: [{ rotate: "-90deg" }] }}>
        <Circle cx={size / 2} cy={size / 2} r={R} fill="none" stroke={t.line} strokeWidth={stroke} />
        <Circle
          cx={size / 2} cy={size / 2} r={R} fill="none" stroke={c} strokeWidth={stroke} strokeLinecap="round"
          strokeDasharray={`${(p.l / 100) * CIRC} ${CIRC}`}
        />
      </Svg>
      <View
        style={{
          position: "absolute", inset: gap, borderRadius: size / 2,
          backgroundColor: t.surface,
          borderWidth: selected ? 1.5 : 1, borderColor: selected ? t.ink : t.line,
          alignItems: "center", justifyContent: "center",
        }}
      >
        <Text style={{ fontFamily: FONTS.medium, fontSize: size * 0.28, color: t.ink }}>{p.n[0]}</Text>
      </View>
    </Pressable>
  );
}
