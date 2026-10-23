import React, { useEffect } from "react";
import { Pressable, Text, View } from "react-native";
import Animated, { useSharedValue, useAnimatedStyle, withTiming, Easing } from "react-native-reanimated";
import { useTheme, T, FONTS } from "../theme";

// primary: solid ink pill. secondary: hairline outline. ghost: text only.
export const Btn = ({ children, onPress, variant = "primary", style, textStyle, disabled }) => {
  const t = useTheme();
  const primary = variant === "primary";
  return (
    <Pressable
      onPress={onPress}
      disabled={disabled}
      style={({ pressed }) => [
        {
          paddingVertical: 16,
          paddingHorizontal: 22,
          borderRadius: 100,
          alignItems: "center",
          backgroundColor: primary ? t.ink : "transparent",
          borderWidth: variant === "secondary" ? 1 : 0,
          borderColor: t.lineStrong,
          opacity: disabled ? 0.35 : pressed ? 0.8 : 1,
        },
        style,
      ]}
    >
      <Text style={[{ fontFamily: FONTS.medium, fontSize: T.body, color: primary ? t.inverse : variant === "ghost" ? t.muted : t.ink }, textStyle]}>
        {children}
      </Text>
    </Pressable>
  );
};

export const Label = ({ children, color, style }) => {
  const t = useTheme();
  return <Text style={[{ fontFamily: FONTS.medium, fontSize: T.small, color: color || t.muted }, style]}>{children}</Text>;
};

export const Panel = ({ children, style }) => {
  const t = useTheme();
  return <View style={[{ padding: 20, borderRadius: 24, backgroundColor: t.surface, borderWidth: 1, borderColor: t.line }, t.shadow, style]}>{children}</View>;
};

export const Chip = ({ children, on, onPress, disabled, style }) => {
  const t = useTheme();
  return (
    <Pressable
      onPress={onPress}
      disabled={disabled}
      style={[
        {
          paddingVertical: 8,
          paddingHorizontal: 14,
          borderRadius: 100,
          backgroundColor: on ? t.ink : "transparent",
          borderWidth: 1,
          borderColor: on ? t.ink : t.lineStrong,
        },
        style,
      ]}
    >
      <Text style={{ fontFamily: FONTS.medium, fontSize: T.small, color: on ? t.inverse : t.muted }}>{children}</Text>
    </Pressable>
  );
};

// Bold headings. Tracking tightens with size so big words stay compact.
export const Display = ({ children, size = 32, color, style }) => {
  const t = useTheme();
  return (
    <Text style={[{ fontFamily: FONTS.display, fontSize: size, lineHeight: Math.round(size * 1.14), letterSpacing: -size * 0.03, color: color || t.ink }, style]}>
      {children}
    </Text>
  );
};

// options: [[id, label], ...]. The caller decides what tapping the
// selected option again means (most screens clear it).
export const Segmented = ({ options, value, onChange, style }) => {
  const t = useTheme();
  return (
    <View style={[{ flexDirection: "row", padding: 3, borderRadius: 100, backgroundColor: t.sunk }, style]}>
      {options.map(([id, label]) => {
        const on = value === id;
        return (
          <Pressable
            key={id}
            onPress={() => onChange(id)}
            style={[{ flex: 1, alignItems: "center", paddingVertical: 9, paddingHorizontal: 4, borderRadius: 100, backgroundColor: on ? t.raised : "transparent" }, on && t.shadow]}
          >
            <Text numberOfLines={1} style={{ fontFamily: on ? FONTS.medium : FONTS.sans, fontSize: T.small, color: on ? t.ink : t.muted }}>{label}</Text>
          </Pressable>
        );
      })}
    </View>
  );
};

export const Toggle = ({ on }) => {
  const t = useTheme();
  const x = useSharedValue(on ? 18 : 0);
  useEffect(() => {
    x.value = withTiming(on ? 18 : 0, { duration: 180, easing: Easing.out(Easing.cubic) });
  }, [on]);
  const knob = useAnimatedStyle(() => ({ transform: [{ translateX: x.value }] }));
  return (
    <View style={{ width: 44, height: 26, borderRadius: 13, padding: 3, backgroundColor: on ? t.ink : t.sunk }}>
      <Animated.View style={[{ width: 20, height: 20, borderRadius: 10, backgroundColor: on ? t.inverse : t.raised }, knob]} />
    </View>
  );
};
