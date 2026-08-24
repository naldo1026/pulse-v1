import React from "react";
import { View, StyleSheet } from "react-native";
import { LinearGradient } from "expo-linear-gradient";
import { COLORS, GRADIENT_COLORS } from "../theme";

export default function MiniBattery({ level, size = 22 }) {
  const h = size * 1.7;
  return (
    <View style={[styles.track, { width: size, height: h }]}>
      <View style={[styles.mask, { height: `${level}%` }]}>
        <LinearGradient
          colors={GRADIENT_COLORS}
          start={{ x: 0, y: 0 }}
          end={{ x: 0, y: 1 }}
          style={{ position: "absolute", bottom: 0, left: 0, right: 0, height: h }}
        />
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  track: {
    borderRadius: 6,
    borderWidth: 1.5,
    borderColor: COLORS.line,
    backgroundColor: COLORS.trackBg,
    overflow: "hidden",
  },
  mask: { position: "absolute", bottom: 0, left: 0, right: 0, overflow: "hidden" },
});
