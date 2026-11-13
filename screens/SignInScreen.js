import React, { useState } from "react";
import { View, Text, TextInput, Pressable } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useTheme, FONTS, T } from "../theme";
import { supabase } from "../lib/supabase";
import { Btn, Display } from "../components/primitives";
import LightStreak from "../components/LightStreak";
import { LegalLinks } from "../components/LegalModal";

// What went wrong, in words. Codes first, then messages for older servers.
function problem(error, creating) {
  const { code = "", message = "" } = error;
  if (code === "user_already_exists" || code === "email_exists" || /already registered/i.test(message)) {
    return "There's already an account with that email. Sign in instead.";
  }
  if (code === "signup_disabled" || /signups not allowed/i.test(message)) return "Sign-ups aren't open yet.";
  if (code === "weak_password") return message || "Pick a longer password.";
  if (code === "email_address_invalid") return "That email doesn't look right.";
  if (code === "over_request_rate_limit" || error.status === 429) return "Too many tries. Wait a minute and try again.";
  if (!creating && (code === "invalid_credentials" || /invalid login/i.test(message))) return "That email and password don't match.";
  return message || "That didn't work. Check your connection and try again.";
}

// Email and password, to sign in or make an account. Sign-up has no email
// confirmation, because Pulse sends no email, so it signs straight in.
// App.js picks up the session through onAuthStateChange either way, and a
// new account goes on to onboarding.
export default function SignInScreen() {
  const t = useTheme();
  const insets = useSafeAreaInsets();
  const [creating, setCreating] = useState(false);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState(null);

  const addr = email.trim().toLowerCase();
  const ready = addr.includes("@") && password.length > 0 && !busy;

  const submit = async () => {
    if (!ready) return;
    setBusy(true);
    setErr(null);
    const { data, error } = creating
      ? await supabase.auth.signUp({ email: addr, password })
      : await supabase.auth.signInWithPassword({ email: addr, password });
    setBusy(false);
    if (error) setErr(problem(error, creating));
    // Only if "Confirm email" got turned on in Supabase: Pulse can't send it.
    else if (creating && !data.session) setErr("Your account's made, but it can't be used yet. Tell whoever sent you Pulse.");
  };
  const flip = () => {
    setCreating(!creating);
    setErr(null);
  };

  // 16px text: iOS zooms the page into any input smaller than that.
  const input = { paddingVertical: 15, paddingHorizontal: 20, borderRadius: 100, backgroundColor: t.surface, borderWidth: 1, borderColor: t.line, color: t.ink, fontFamily: FONTS.sans, fontSize: 16 };

  return (
    <View style={{ flex: 1, backgroundColor: t.bg }}>
      <LightStreak level={64} height={480} />
      <View style={{ flex: 1, paddingTop: insets.top + 56, paddingHorizontal: 24, paddingBottom: insets.bottom + 20 }}>
        <Display size={36}>{creating ? "Create an account" : "Sign in"}</Display>
        <Text style={{ fontFamily: FONTS.sans, fontSize: T.body, lineHeight: 22, color: t.muted, marginTop: 8 }}>
          {creating ? "An email and a password. Nobody sees you until you add them and they say yes." : "Welcome back."}
        </Text>
        <TextInput
          value={email} onChangeText={setEmail}
          placeholder="Email" placeholderTextColor={t.faint}
          autoFocus autoCapitalize="none" autoCorrect={false} autoComplete="username" keyboardType="email-address" inputMode="email"
          style={[input, { marginTop: 28 }]}
        />
        <TextInput
          value={password} onChangeText={setPassword} onSubmitEditing={submit}
          placeholder={creating ? "Choose a password" : "Password"} placeholderTextColor={t.faint}
          secureTextEntry autoCapitalize="none" autoCorrect={false}
          autoComplete={creating ? "new-password" : "current-password"} textContentType={creating ? "newPassword" : "password"}
          style={[input, { marginTop: 10 }]}
        />

        {err && <Text style={{ fontFamily: FONTS.sans, fontSize: T.small, lineHeight: 18, color: t.ink, marginTop: 12, marginHorizontal: 4 }}>{err}</Text>}

        <View style={{ flex: 1 }} />

        <Btn onPress={submit} disabled={!ready}>
          {busy ? (creating ? "Creating…" : "Signing in…") : creating ? "Create account" : "Sign in"}
        </Btn>
        <Pressable onPress={flip} hitSlop={8} accessibilityRole="button" style={{ alignSelf: "center", marginTop: 16, paddingVertical: 4 }}>
          <Text style={{ fontFamily: FONTS.sans, fontSize: T.body, color: t.muted }}>
            {creating ? "Have an account? " : "New here? "}
            <Text style={{ fontFamily: FONTS.medium, color: t.ink }}>{creating ? "Sign in" : "Create an account"}</Text>
          </Text>
        </Pressable>
        {!creating && (
          <Text style={{ fontFamily: FONTS.sans, fontSize: T.small, color: t.faint, textAlign: "center", marginTop: 10 }}>
            Forgot your password? Tell whoever sent you Pulse.
          </Text>
        )}
        <LegalLinks lead={creating ? "By creating an account, you agree to our" : null} style={{ marginTop: 14 }} />
      </View>
    </View>
  );
}
