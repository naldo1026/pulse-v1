import React, { useState } from "react";
import { View, Text, Modal, Pressable } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useTheme, FONTS, T } from "../theme";
import { Segmented } from "./primitives";
import LegalDoc from "./LegalDoc";
import ABOUT from "../lib/legal/about";
import PRIVACY from "../lib/legal/privacy";
import TERMS from "../lib/legal/terms";

const TABS = [["about", "About"], ["privacy", "Privacy"], ["terms", "Terms"]];
const DOCS = { about: ABOUT, privacy: PRIVACY, terms: TERMS };

// About, Privacy and Terms for anyone not signed in yet (sign-in and
// onboarding), so they can read what they're agreeing to first. Signed-in
// people find the same pages under Settings.
export default function LegalModal({ initial = "privacy", onClose }) {
  const t = useTheme();
  const insets = useSafeAreaInsets();
  const [tab, setTab] = useState(initial);
  return (
    <Modal transparent={false} animationType="slide" visible onRequestClose={onClose}>
      <View style={{ flex: 1, backgroundColor: t.bg }}>
        <View style={{ flexDirection: "row", alignItems: "center", justifyContent: "space-between", paddingTop: insets.top + 16, paddingHorizontal: 24 }}>
          <Segmented options={TABS} value={tab} onChange={setTab} style={{ flex: 1, marginRight: 16 }} />
          <Pressable onPress={onClose} hitSlop={12}>
            <Text style={{ fontFamily: FONTS.medium, fontSize: T.body, color: t.ink }}>Done</Text>
          </Pressable>
        </View>
        <LegalDoc key={tab} doc={DOCS[tab]} contents={tab !== "about"} />
      </View>
    </Modal>
  );
}

// "Privacy · Terms" links that open LegalModal. `lead` is text before them,
// e.g. "By continuing, you agree to our".
export function LegalLinks({ lead, style }) {
  const t = useTheme();
  const [open, setOpen] = useState(null);
  const link = (id, label) => (
    <Text accessibilityRole="link" onPress={() => setOpen(id)} style={{ color: t.muted, textDecorationLine: "underline" }}>{label}</Text>
  );
  return (
    <>
      <Text style={[{ fontFamily: FONTS.sans, fontSize: T.small, lineHeight: 19, color: t.faint, textAlign: "center" }, style]}>
        {lead ? <>{`${lead} `}{link("terms", "Terms of use")}{" and "}{link("privacy", "Privacy policy")}.</> : <>{link("privacy", "Privacy")}{"  ·  "}{link("terms", "Terms")}{"  ·  "}{link("about", "About Pulse")}</>}
      </Text>
      {open && <LegalModal initial={open} onClose={() => setOpen(null)} />}
    </>
  );
}
