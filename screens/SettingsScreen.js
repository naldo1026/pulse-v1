import React, { useState } from "react";
import { View, Text, Modal, ScrollView, Pressable } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useTheme, FONTS, T } from "../theme";
import { MBTI, MBTI_NOTE, THEMES, LIBRARY, SUGGESTED, stopsFor } from "../lib/data";
import { Label, Panel, Display, Segmented, Toggle } from "../components/primitives";
import PeopleEditor from "../components/PeopleEditor";
import Icon from "../components/Icon";

const TIMES = [["07:00", "7:00"], ["07:40", "7:40"], ["08:30", "8:30"], ["off", "Off"]];
const MOODS = [["low", "When you're low"], ["mid", "In between"], ["high", "When you're full"]];

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
  onClose, members, setMembers, mbti, setMbti, songs, setSongs, spotify, setSpotify,
  morningTime, setMorningTime, theme, setTheme,
}) {
  const t = useTheme();
  const insets = useSafeAreaInsets();
  const [openMood, setOpenMood] = useState(null);

  return (
    <Modal transparent={false} animationType="slide" visible onRequestClose={onClose}>
      <View style={{ flex: 1, backgroundColor: t.bg }}>
        <View style={{ flexDirection: "row", alignItems: "center", justifyContent: "space-between", paddingTop: insets.top + 16, paddingHorizontal: 24 }}>
          <Display size={26}>Settings</Display>
          <Pressable onPress={onClose} hitSlop={12}>
            <Text style={{ fontFamily: FONTS.medium, fontSize: T.body, color: t.ink }}>Done</Text>
          </Pressable>
        </View>

        <ScrollView contentContainerStyle={{ paddingHorizontal: 24, paddingBottom: insets.bottom + 40 }} keyboardShouldPersistTaps="handled">
          <Section title="People" note="Everyone sees the same level. Groups just decide who you send pulses to.">
            <Panel>
              <PeopleEditor members={members} setMembers={setMembers} suggestions={SUGGESTED} />
            </Panel>
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
                  <Pressable key={k} onPress={() => setMbti(on ? null : k)} style={{ width: "23.5%", paddingVertical: 10, borderRadius: 10, alignItems: "center", backgroundColor: on ? t.ink : t.surface, borderWidth: 1, borderColor: on ? t.ink : t.line }}>
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

          <Text style={{ fontFamily: FONTS.sans, fontSize: T.caption, color: t.faint, textAlign: "center", marginTop: 32 }}>
            Only your people see your level. Nothing runs in the background.
          </Text>
        </ScrollView>
      </View>
    </Modal>
  );
}
