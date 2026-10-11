import React from "react";
import { Pressable, Text, View } from "react-native";
import { INK, PANEL, PAPER, GOLD, T, FONTS, rgba } from "../theme";

export const Btn = ({ children, onPress, color = GOLD, filled = true, style, textStyle, disabled }) => (
  <Pressable
    onPress={onPress}
    disabled={disabled}
    style={[
      {
        paddingVertical: 16,
        borderRadius: 100,
        alignItems: "center",
        backgroundColor: filled ? color : "transparent",
        borderWidth: 1.5,
        borderColor: filled ? color : rgba(PAPER, 0.2),
        shadowColor: filled ? color : "transparent",
        shadowOpacity: filled ? 0.5 : 0,
        shadowRadius: 14,
        shadowOffset: { width: 0, height: 0 },
      },
      style,
    ]}
  >
    <Text style={[{ fontFamily: FONTS.sansBold, fontSize: T.body, letterSpacing: 0.3, color: filled ? INK : PAPER }, textStyle]}>
      {children}
    </Text>
  </Pressable>
);

export const Label = ({ children, color, style }) => (
  <Text
    style={[
      {
        fontFamily: FONTS.sansBold,
        fontSize: T.micro,
        letterSpacing: 0.6,
        textTransform: "uppercase",
        color: color || rgba(PAPER, 0.42),
      },
      style,
    ]}
  >
    {children}
  </Text>
);

export const Panel = ({ children, style }) => (
  <View style={[{ padding: 18, borderRadius: 22, backgroundColor: PANEL, borderWidth: 1, borderColor: rgba(PAPER, 0.07) }, style]}>
    {children}
  </View>
);

export const Chip = ({ children, on, color = GOLD, onPress, style }) => (
  <Pressable
    onPress={onPress}
    style={[
      {
        paddingVertical: 9,
        paddingHorizontal: 15,
        borderRadius: 100,
        backgroundColor: on ? rgba(color, 0.18) : rgba(PAPER, 0.04),
        borderWidth: 1,
        borderColor: on ? rgba(color, 0.7) : rgba(PAPER, 0.09),
        shadowColor: on ? color : "transparent",
        shadowOpacity: on ? 0.32 : 0,
        shadowRadius: 9,
        shadowOffset: { width: 0, height: 0 },
      },
      style,
    ]}
  >
    <Text style={{ fontFamily: FONTS.sansSemiBold, fontSize: T.small, color: on ? color : rgba(PAPER, 0.55) }}>{children}</Text>
  </Pressable>
);

// Handwritten heading. Caveat sits high on its baseline, so the 1.06
// line-height (matched to font size, same as the web version) gives it
// room to breathe.
export const Script = ({ children, size = 44, color = PAPER, style }) => (
  <Text style={[{ fontFamily: FONTS.script, fontSize: size, color, lineHeight: size * 1.06 }, style]}>{children}</Text>
);
