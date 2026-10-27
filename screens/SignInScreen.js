import React, { useState } from "react";
import { View, Text, TextInput } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useTheme, FONTS, T } from "../theme";
import { supabase } from "../lib/supabase";
import { Btn, Display } from "../components/primitives";
import LightStreak from "../components/LightStreak";

// Email and password. Nobody can sign up here: people are added in the
// Supabase dashboard with a starting password, which they can change in
// Settings. App.js picks up the new session through onAuthStateChange.
export default function SignInScreen() {
  const t = useTheme();
  const insets = useSafeAreaInsets();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState(null);

  const addr = email.trim().toLowerCase();
  const ready = addr.includes("@") && password.length > 0 && !busy;

  const signIn = async () => {
    if (!ready) return;
    setBusy(true);
    setErr(null);
    const { error } = await supabase.auth.signInWithPassword({ email: addr, password });
    setBusy(false);
    if (error) setErr(/invalid login/i.test(error.message) ? "That email and password don't match." : error.message);
  };

  // 16px text: iOS zooms the page into any input smaller than that.
  const input = { paddingVertical: 15, paddingHorizontal: 20, borderRadius: 100, backgroundColor: t.surface, borderWidth: 1, borderColor: t.line, color: t.ink, fontFamily: FONTS.sans, fontSize: 16 };

  return (
    <View style={{ flex: 1, backgroundColor: t.bg }}>
      <LightStreak level={64} height={480} />
      <View style={{ flex: 1, paddingTop: insets.top + 56, paddingHorizontal: 24, paddingBottom: insets.bottom + 20 }}>
        <Display size={36}>Sign in</Display>
        <Text style={{ fontFamily: FONTS.sans, fontSize: T.body, lineHeight: 22, color: t.muted, marginTop: 8 }}>
          Use the email and password you were given.
        </Text>
        <TextInput
          value={email} onChangeText={setEmail}
          placeholder="Email" placeholderTextColor={t.faint}
          autoFocus autoCapitalize="none" autoCorrect={false} autoComplete="username" keyboardType="email-address" inputMode="email"
          style={[input, { marginTop: 28 }]}
        />
        <TextInput
          value={password} onChangeText={setPassword} onSubmitEditing={signIn}
          placeholder="Password" placeholderTextColor={t.faint}
          secureTextEntry autoCapitalize="none" autoCorrect={false} autoComplete="current-password" textContentType="password"
          style={[input, { marginTop: 10 }]}
        />

        {err && <Text style={{ fontFamily: FONTS.sans, fontSize: T.small, color: t.muted, marginTop: 12, marginHorizontal: 4 }}>{err}</Text>}

        <View style={{ flex: 1 }} />

        <Btn onPress={signIn} disabled={!ready}>{busy ? "Signing in…" : "Sign in"}</Btn>
        <Text style={{ fontFamily: FONTS.sans, fontSize: T.small, color: t.faint, textAlign: "center", marginTop: 16 }}>
          Forgot it? Ask whoever added you to reset it.
        </Text>
      </View>
    </View>
  );
}
