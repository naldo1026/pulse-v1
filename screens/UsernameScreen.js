import React, { useState } from "react";
import { View, Text } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useTheme, FONTS, T } from "../theme";
import { cleanUsername, usernameOk } from "../lib/api";
import { Btn, Display } from "../components/primitives";
import UsernameField from "../components/UsernameField";
import LightStreak from "../components/LightStreak";

// Once, for anyone who finished onboarding before usernames existed.
// saveUsername resolves with null once saved, or what's wrong.
export default function UsernameScreen({ name, saveUsername }) {
  const t = useTheme();
  const insets = useSafeAreaInsets();
  const [username, setUsername] = useState(cleanUsername(name || ""));
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState(null);

  const ready = usernameOk(username) && !busy;
  const save = async () => {
    if (!ready) return;
    setBusy(true);
    setErr(null);
    const problem = await saveUsername(username);
    setBusy(false);
    setErr(problem);
  };

  return (
    <View style={{ flex: 1, backgroundColor: t.bg }}>
      <LightStreak level={64} height={480} />
      <View style={{ flex: 1, paddingTop: insets.top + 56, paddingHorizontal: 24, paddingBottom: insets.bottom + 20 }}>
        <Display size={36}>Pick a username</Display>
        <Text style={{ fontFamily: FONTS.sans, fontSize: T.body, lineHeight: 22, color: t.muted, marginTop: 8 }}>
          Pulse has changed: now only people in your circle see your level. People add you with your username, and once you both say yes, you see each other.
        </Text>
        <UsernameField value={username} onChangeText={(v) => { setUsername(v); setErr(null); }} onSubmitEditing={save} autoFocus style={{ marginTop: 28 }} />
        <Text style={{ fontFamily: FONTS.sans, fontSize: T.small, color: err ? t.ink : t.faint, marginTop: 10, marginHorizontal: 4 }}>
          {err || "3 to 20 letters, numbers or _. You can change it in Settings."}
        </Text>
        <View style={{ flex: 1 }} />
        <Btn onPress={save} disabled={!ready}>{busy ? "Saving…" : "Continue"}</Btn>
      </View>
    </View>
  );
}
