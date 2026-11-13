import React from "react";
import { View, Text, TextInput } from "react-native";
import { useTheme, FONTS } from "../theme";
import { cleanUsername } from "../lib/api";

// A pill with an @ in front that only takes what a username can hold, so
// typing "Keanen M" gives "keanenm". Used by onboarding, the username
// screen, Settings and FindPeople. 16px text: iOS zooms into anything smaller.
export default function UsernameField({ value, onChangeText, onSubmitEditing, onBlur, placeholder = "username", autoFocus, style }) {
  const t = useTheme();
  return (
    <View style={[{ flexDirection: "row", alignItems: "center", paddingLeft: 20, borderRadius: 100, backgroundColor: t.surface, borderWidth: 1, borderColor: t.line }, style]}>
      <Text style={{ fontFamily: FONTS.sans, fontSize: 16, color: t.faint }}>@</Text>
      <TextInput
        value={value} onChangeText={(v) => onChangeText(cleanUsername(v))}
        onSubmitEditing={onSubmitEditing} onBlur={onBlur}
        placeholder={placeholder} placeholderTextColor={t.faint}
        autoFocus={autoFocus} autoCapitalize="none" autoCorrect={false} autoComplete="off" spellCheck={false} maxLength={20}
        style={{ flex: 1, minWidth: 0, paddingVertical: 15, paddingLeft: 2, paddingRight: 20, color: t.ink, fontFamily: FONTS.sans, fontSize: 16, outlineStyle: "none" }}
      />
    </View>
  );
}
