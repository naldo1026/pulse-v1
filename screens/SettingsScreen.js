import React, { useState } from "react";
import { View, Text, Modal, ScrollView, Pressable, TextInput } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useTheme, FONTS, T } from "../theme";
import { MBTI, MBTI_NOTE, THEMES, LIBRARY, stopsFor } from "../lib/data";
import { Btn, Label, Panel, Display, Segmented, Toggle } from "../components/primitives";
import PeopleEditor from "../components/PeopleEditor";
import Icon from "../components/Icon";

const TIMES = [["07:00", "7:00"], ["07:40", "7:40"], ["08:30", "8:30"], ["off", "Off"]];
const MOODS = [["low", "When you're low"], ["mid", "In between"], ["high", "When you're full"]];

const PUSH_NOTE = {
  granted: "Pulses from your people, plus the morning check-in.",
  denied: "Blocked on this phone. Turn them on in Settings, Notifications, Pulse.",
  unsupported: "This browser can't do notifications. On iPhone, open Pulse from your home screen.",
  default: "Pulses from your people, plus the morning check-in.",
};

function Section({ title, children, note }) {
  const t = useTheme();
  return (
    <View style={{ marginTop: 28 }}>
      <Label style={{ marginLeft: 4, marginBottom: 8 }}>{title}</Label>
      {children}
      {note && <Text style={{ fontFamily: FONTS.sans, fontSize: T.small, lineHeight: 18, color: t.faint, marginTop: 8, marginHorizontal: 4 }}>{note}</Text>}
    </View>
  );
}

export default function SettingsScreen({
  onClose, name, setName, people, setGroup, mbti, setMbti, songs, setSongs, spotify, setSpotify,
  morningTime, setMorningTime, theme, setTheme, pushPerm, enablePush, changePassword, signOut,
}) {
  const t = useTheme();
  const insets = useSafeAreaInsets();
  const [openMood, setOpenMood] = useState(null);
  const [draft, setDraft] = useState(name);
  const saveName = () => {
    if (draft.trim() && draft.trim() !== name) setName(draft.trim());
    else setDraft(name);
  };
  const [pw, setPw] = useState("");
  const [pwNote, setPwNote] = useState(null);
  const savePassword = async () => {
    if (!pw) return;
    const err = await changePassword(pw);
    setPwNote(err || "Saved. Use it next time you sign in.");
    if (!err) setPw("");
  };

  // 16px text: iOS zooms the page into any input smaller than that.
  const field = { paddingVertical: 14, paddingHorizontal: 18, borderRadius: 100, backgroundColor: t.surface, borderWidth: 1, borderColor: t.line, color: t.ink, fontFamily: FONTS.sans, fontSize: 16 };

  return (
    <Modal transparent={false} animationType="slide" visible onRequestClose={onClose}>
      <View style={{ flex: 1, backgroundColor: t.bg }}>
        <View style={{ flexDirection: "row", alignItems: "center", justifyContent: "space-between", paddingTop: insets.top + 16, paddingHorizontal: 24 }}>
          <Display size={24}>Settings</Display>
          <Pressable onPress={onClose} hitSlop={12}>
            <Text style={{ fontFamily: FONTS.medium, fontSize: T.body, color: t.ink }}>Done</Text>
          </Pressable>
        </View>

        <ScrollView contentContainerStyle={{ paddingHorizontal: 24, paddingBottom: insets.bottom + 40 }} keyboardShouldPersistTaps="handled">
          <Section title="Your name">
            <TextInput
              value={draft} onChangeText={setDraft} onBlur={saveName} onSubmitEditing={saveName}
              maxLength={24} autoComplete="given-name" placeholderTextColor={t.faint}
              style={field}
            />
          </Section>

          <Section title="Password" note={pwNote || "Swap the one you were given for your own."}>
            <View style={{ flexDirection: "row", gap: 8 }}>
              <TextInput
                value={pw} onChangeText={(v) => { setPw(v); setPwNote(null); }} onSubmitEditing={savePassword}
                placeholder="New password" placeholderTextColor={t.faint}
                secureTextEntry autoCapitalize="none" autoCorrect={false} autoComplete="new-password" textContentType="newPassword"
                style={[field, { flex: 1 }]}
              />
              <Btn variant="secondary" onPress={savePassword} disabled={!pw} style={{ paddingVertical: 14 }}>Save</Btn>
            </View>
          </Section>

          <Section title="People" note="Everyone on Pulse sees your level. Groups decide whose phones buzz when you send a pulse.">
            <Panel style={{ paddingVertical: 6 }}>
              <PeopleEditor people={people} setGroup={setGroup} />
            </Panel>
          </Section>

          <Section title="Notifications" note={PUSH_NOTE[pushPerm]}>
            {pushPerm === "default" ? (
              <Btn variant="secondary" onPress={enablePush}>Turn on notifications</Btn>
            ) : (
              <Panel style={{ flexDirection: "row", alignItems: "center", paddingVertical: 14, paddingHorizontal: 16 }}>
                <Text style={{ flex: 1, fontFamily: FONTS.sans, fontSize: T.body, color: t.ink }}>{pushPerm === "granted" ? "On" : "Off"}</Text>
                {pushPerm === "granted" && <Icon name="check" size={18} color={t.ink} />}
              </Panel>
            )}
          </Section>

          <Section title="Colours">
            <Panel style={{ padding: 0 }}>
              {Object.entries(THEMES).map(([id, th], i) => (
                <Pressable key={id} onPress={() => setTheme(id)} style={{ flexDirection: "row", alignItems: "center", gap: 14, paddingVertical: 14, paddingHorizontal: 16, borderTopWidth: i ? 1 : 0, borderColor: t.line }}>
                  <View style={{ flexDirection: "row", borderRadius: 5, overflow: "hidden" }}>
                    {stopsFor(id, t.scheme).map((stop, k) => (
                      <View key={k} style={{ width: 14, height: 14, backgroundColor: stop }} />
                    ))}
                  </View>
                  <Text style={{ flex: 1, fontFamily: FONTS.sans, fontSize: T.body, color: t.ink }}>{th.label}</Text>
                  {theme === id && <Icon name="check" size={18} color={t.ink} />}
                </Pressable>
              ))}
            </Panel>
          </Section>

          <Section title="Morning check-in" note={morningTime === "off" ? "No morning prompt." : "One quick question, once a day."}>
            <Segmented options={TIMES} value={morningTime} onChange={setMorningTime} />
          </Section>

          <Section title="Personality type" note={mbti ? MBTI_NOTE(mbti) : "Optional. It tailors your weekly summary."}>
            <View style={{ flexDirection: "row", flexWrap: "wrap", gap: 6 }}>
              {MBTI.map((k) => {
                const on = mbti === k;
                return (
                  <Pressable key={k} onPress={() => setMbti(on ? null : k)} style={{ width: "23.5%", paddingVertical: 10, borderRadius: 100, alignItems: "center", backgroundColor: on ? t.ink : t.surface, borderWidth: 1, borderColor: on ? t.ink : t.line }}>
                    <Text style={{ fontFamily: FONTS.medium, fontSize: T.small, letterSpacing: 0.4, color: on ? t.inverse : t.muted }}>{k}</Text>
                  </Pressable>
                );
              })}
            </View>
          </Section>

          <Section title="Songs">
            <Panel style={{ padding: 0 }}>
              <Pressable onPress={() => setSpotify(!spotify)} style={{ flexDirection: "row", alignItems: "center", gap: 12, paddingVertical: 14, paddingHorizontal: 16 }}>
                <Icon name="music" size={18} color={t.muted} />
                <Text style={{ flex: 1, fontFamily: FONTS.sans, fontSize: T.body, color: t.ink }}>Connect Spotify</Text>
                <Toggle on={spotify} />
              </Pressable>

              {spotify && MOODS.map(([k, label]) => {
                const expanded = openMood === k;
                return (
                  <View key={k} style={{ borderTopWidth: 1, borderColor: t.line }}>
                    <Pressable onPress={() => setOpenMood(expanded ? null : k)} style={{ flexDirection: "row", alignItems: "center", paddingVertical: 14, paddingHorizontal: 16 }}>
                      <View style={{ flex: 1 }}>
                        <Text style={{ fontFamily: FONTS.sans, fontSize: T.body, color: t.ink }}>{label}</Text>
                        <Text numberOfLines={1} style={{ fontFamily: FONTS.sans, fontSize: T.small, color: t.faint, marginTop: 2 }}>{songs[k] || "Choose a song"}</Text>
                      </View>
                      <View style={{ transform: [{ rotate: expanded ? "90deg" : "0deg" }] }}>
                        <Icon name="chevron" size={16} color={t.faint} />
                      </View>
                    </Pressable>
                    {expanded && LIBRARY[k].map((tr) => {
                      const val = `${tr.t} — ${tr.a}`;
                      const on = songs[k] === val;
                      return (
                        <Pressable key={tr.t} onPress={() => setSongs({ ...songs, [k]: on ? "" : val })} style={{ flexDirection: "row", alignItems: "center", paddingVertical: 10, paddingLeft: 32, paddingRight: 16 }}>
                          <View style={{ flex: 1 }}>
                            <Text numberOfLines={1} style={{ fontFamily: FONTS.sans, fontSize: T.small, color: t.ink }}>{tr.t}</Text>
                            <Text numberOfLines={1} style={{ fontFamily: FONTS.sans, fontSize: T.caption, color: t.faint }}>{tr.a}</Text>
                          </View>
                          {on && <Icon name="check" size={16} color={t.ink} />}
                        </Pressable>
                      );
                    })}
                  </View>
                );
              })}
            </Panel>
          </Section>

          <Btn variant="ghost" onPress={signOut} style={{ marginTop: 28 }}>Sign out</Btn>

          <Text style={{ fontFamily: FONTS.sans, fontSize: T.caption, color: t.faint, textAlign: "center", marginTop: 12 }}>
            Only people on Pulse see your level.
          </Text>
        </ScrollView>
      </View>
    </Modal>
  );
}
