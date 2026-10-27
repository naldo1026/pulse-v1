import React from "react";
import { View, Text, ScrollView } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useTheme, FONTS, T } from "../theme";
import { Panel, Display } from "../components/primitives";
import Icon from "../components/Icon";
import LightStreak from "../components/LightStreak";

const STEPS = [
  ["share", "Tap Share", "The square with an arrow. It's at the bottom of Safari, or under the ••• button."],
  ["plus", "Add to Home Screen", "Scroll down the list to find it. If you see Open as Web App, leave it on."],
  ["battery", "Open Pulse from your home screen", "Sign in there, not here."],
];

// iPhone only, when opened in the browser. iOS only lets home-screen web
// apps send notifications, and Safari doesn't share sign-ins with them.
export default function InstallScreen() {
  const t = useTheme();
  const insets = useSafeAreaInsets();
  return (
    <View style={{ flex: 1, backgroundColor: t.bg }}>
      <LightStreak level={64} height={480} />
      <ScrollView contentContainerStyle={{ paddingTop: insets.top + 56, paddingHorizontal: 24, paddingBottom: insets.bottom + 32 }}>
        <Display size={36}>Add Pulse to your home screen</Display>
        <Text style={{ fontFamily: FONTS.sans, fontSize: T.body, lineHeight: 22, color: t.muted, marginTop: 10 }}>
          Pulse runs from your home screen like an app. It's also the only way your iPhone will let it send you notifications.
        </Text>

        <Panel style={{ marginTop: 28, paddingVertical: 4 }}>
          {STEPS.map(([icon, title, note], i) => (
            <View key={title} style={{ flexDirection: "row", gap: 14, paddingVertical: 16, borderTopWidth: i ? 1 : 0, borderColor: t.line }}>
              <View style={{ width: 36, height: 36, borderRadius: 18, backgroundColor: t.sunk, alignItems: "center", justifyContent: "center" }}>
                <Icon name={icon} size={18} color={t.ink} />
              </View>
              <View style={{ flex: 1 }}>
                <Text style={{ fontFamily: FONTS.medium, fontSize: T.body, color: t.ink }}>{title}</Text>
                <Text style={{ fontFamily: FONTS.sans, fontSize: T.small, lineHeight: 18, color: t.muted, marginTop: 3 }}>{note}</Text>
              </View>
            </View>
          ))}
        </Panel>
      </ScrollView>
    </View>
  );
}
