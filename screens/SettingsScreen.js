import React, { useState } from "react";
import { View, Text, Modal, ScrollView, Pressable, TextInput } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { INK, PAPER, GOLD, AQUA, FONTS, T, rgba } from "../theme";
import { GROUPS, MBTI, THEMES, RAMP, colorFor } from "../lib/data";
import { Label, Panel, Script } from "../components/primitives";

export default function SettingsScreen({ onClose, members, setMembers, mbti, setMbti, songs, morningTime, setMorningTime, theme, setTheme, level }) {
  const insets = useSafeAreaInsets();
  const [newName, setNewName] = useState("");
  const [addTo, setAddTo] = useState("household");

  const add = () => {
    const n = newName.trim();
    if (n && !members.some((m) => m.n === n)) setMembers([...members, { n, g: addTo }]);
    setNewName("");
  };

  return (
    <Modal transparent={false} animationType="slide" visible onRequestClose={onClose}>
      <View style={{ flex: 1, backgroundColor: INK }}>
        <View style={{ flexDirection: "row", alignItems: "center", justifyContent: "space-between", paddingTop: insets.top + 18, paddingHorizontal: 22 }}>
          <Script size={26}>Settings</Script>
          <Pressable onPress={onClose}>
            <Text style={{ fontFamily: FONTS.mono, fontSize: T.micro, color: rgba(PAPER, 0.5) }}>DONE</Text>
          </Pressable>
        </View>

        <ScrollView contentContainerStyle={{ padding: 22, paddingBottom: insets.bottom + 40, gap: 14 }}>
          <Panel>
            <Label>YOUR CIRCLES</Label>
            <Text style={{ fontFamily: FONTS.sans, fontSize: T.micro, color: rgba(PAPER, 0.48), marginTop: 6 }}>
              Everyone sees the same battery. Circles only change who you can pulse.
            </Text>
            {GROUPS.map((g) => {
              const list = members.filter((m) => m.g === g.id);
              return (
                <View key={g.id} style={{ marginTop: 14 }}>
                  <View style={{ flexDirection: "row", alignItems: "baseline", gap: 8 }}>
                    <Script size={22} color={rgba(PAPER, 0.85)}>{g.label}</Script>
                    <Text style={{ fontFamily: FONTS.mono, fontSize: T.micro, color: rgba(PAPER, 0.45) }}>{list.length}/6</Text>
                  </View>
                  <View style={{ flexDirection: "row", flexWrap: "wrap", gap: 7, marginTop: 8 }}>
                    {list.map((m) => (
                      <Pressable key={m.n} onPress={() => setMembers(members.filter((x) => x.n !== m.n))} style={{ flexDirection: "row", alignItems: "center", gap: 7, paddingVertical: 7, paddingHorizontal: 12, borderRadius: 100, backgroundColor: rgba(GOLD, 0.1), borderWidth: 1, borderColor: rgba(GOLD, 0.4) }}>
                        <Text style={{ fontFamily: FONTS.sansSemiBold, fontSize: T.small, color: PAPER }}>{m.n}</Text>
                        <Text style={{ fontFamily: FONTS.mono, fontSize: T.small, color: rgba(PAPER, 0.4) }}>×</Text>
                      </Pressable>
                    ))}
                    {list.length === 0 && <Text style={{ fontFamily: FONTS.sans, fontSize: T.micro, color: rgba(PAPER, 0.4) }}>Empty</Text>}
                  </View>
                </View>
              );
            })}

            <View style={{ marginTop: 16, paddingTop: 14, borderTopWidth: 1, borderColor: rgba(PAPER, 0.07) }}>
              <View style={{ flexDirection: "row", gap: 6 }}>
                {GROUPS.map((g) => {
                  const on = addTo === g.id;
                  return (
                    <Pressable key={g.id} onPress={() => setAddTo(g.id)} style={{ flex: 1, alignItems: "center", paddingVertical: 8, borderRadius: 100, backgroundColor: on ? rgba(GOLD, 0.14) : rgba(PAPER, 0.03), borderWidth: 1, borderColor: on ? rgba(GOLD, 0.5) : rgba(PAPER, 0.07) }}>
                      <Text style={{ fontFamily: FONTS.sansSemiBold, fontSize: T.micro, color: on ? GOLD : rgba(PAPER, 0.45) }}>{g.label}</Text>
                    </Pressable>
                  );
                })}
              </View>
              <View style={{ flexDirection: "row", gap: 8, marginTop: 9 }}>
                <TextInput
                  value={newName}
                  onChangeText={setNewName}
                  onSubmitEditing={add}
                  placeholder="Partner, friend, family…"
                  placeholderTextColor={rgba(PAPER, 0.3)}
                  style={{ flex: 1, paddingVertical: 11, paddingHorizontal: 13, borderRadius: 100, backgroundColor: rgba(PAPER, 0.03), borderWidth: 1, borderColor: rgba(PAPER, 0.08), color: PAPER, fontFamily: FONTS.sans, fontSize: T.body }}
                />
                <Pressable onPress={add} style={{ width: 44, borderRadius: 100, backgroundColor: newName.trim() ? GOLD : rgba(PAPER, 0.04), alignItems: "center", justifyContent: "center" }}>
                  <Text style={{ fontSize: 20, color: newName.trim() ? INK : rgba(PAPER, 0.3) }}>+</Text>
                </Pressable>
              </View>
            </View>
          </Panel>

          <Panel>
            <Label>BATTERY COLOURS</Label>
            <Text style={{ fontFamily: FONTS.sans, fontSize: T.micro, color: rgba(PAPER, 0.48), marginTop: 6 }}>
              How your level looks, to you and to your circles.
            </Text>

            <View style={{ gap: 8, marginTop: 14 }}>
              {Object.entries(THEMES).map(([id, t]) => {
                const on = theme === id;
                return (
                  <Pressable key={id} onPress={() => setTheme(id)} style={{ padding: 12, borderRadius: 16, backgroundColor: on ? rgba(t.stops[4], 0.1) : rgba(PAPER, 0.03), borderWidth: 1, borderColor: on ? rgba(t.stops[4], 0.55) : rgba(PAPER, 0.07) }}>
                    <View style={{ flexDirection: "row", alignItems: "center", gap: 10 }}>
                      <View style={{ flexDirection: "row", borderRadius: 100, overflow: "hidden", shadowColor: t.stops[4], shadowOpacity: on ? 0.45 : 0, shadowRadius: 10, shadowOffset: { width: 0, height: 0 } }}>
                        {t.stops.map((stopColor, i) => (
                          <View key={i} style={{ width: 17, height: 17, backgroundColor: stopColor }} />
                        ))}
                      </View>
                      <View style={{ flex: 1 }}>
                        <Script size={21} color={on ? PAPER : rgba(PAPER, 0.7)}>{t.label}</Script>
                        <Text style={{ fontFamily: FONTS.sans, fontSize: T.micro, color: rgba(PAPER, 0.48), marginTop: 2 }}>{t.note}</Text>
                      </View>
                      {on && <Text style={{ fontFamily: FONTS.mono, fontSize: T.small, color: t.stops[4] }}>✓</Text>}
                    </View>
                  </Pressable>
                );
              })}
            </View>

            <View style={{ flexDirection: "row", alignItems: "center", gap: 12, marginTop: 14, paddingTop: 14, borderTopWidth: 1, borderColor: rgba(PAPER, 0.07) }}>
              <Label color={rgba(PAPER, 0.3)}>YOU RIGHT NOW</Label>
              <View style={{ flex: 1, height: 4, borderRadius: 4, backgroundColor: rgba(PAPER, 0.06), overflow: "hidden" }}>
                <View style={{ position: "absolute", left: 0, top: 0, bottom: 0, width: `${level}%`, backgroundColor: colorFor(level), shadowColor: colorFor(level), shadowOpacity: 0.8, shadowRadius: 8, shadowOffset: { width: 0, height: 0 } }} />
              </View>
              <Text style={{ fontFamily: FONTS.sansExtraBold, fontSize: 16, color: colorFor(level) }}>{level}</Text>
            </View>
          </Panel>

          <Panel>
            <Label>MORNING CHECK-IN</Label>
            <Script size={26} style={{ marginTop: 8 }}>{`Ask me at ${morningTime}`}</Script>
            <View style={{ flexDirection: "row", gap: 7, marginTop: 12 }}>
              {["07:00", "07:40", "08:30", "off"].map((t) => {
                const on = morningTime === t;
                return (
                  <Pressable key={t} onPress={() => setMorningTime(t)} style={{ flex: 1, alignItems: "center", paddingVertical: 10, borderRadius: 100, backgroundColor: on ? rgba(GOLD, 0.16) : rgba(PAPER, 0.03), borderWidth: 1, borderColor: on ? rgba(GOLD, 0.6) : rgba(PAPER, 0.08) }}>
                    <Text style={{ fontFamily: FONTS.mono, fontSize: T.micro, color: on ? GOLD : rgba(PAPER, 0.45) }}>{t.toUpperCase()}</Text>
                  </Pressable>
                );
              })}
            </View>
            <Text style={{ fontFamily: FONTS.sans, fontSize: T.micro, color: rgba(PAPER, 0.48), marginTop: 10 }}>One quiet prompt. Never twice in a day.</Text>
          </Panel>

          <Panel>
            <Label>YOUR TYPE</Label>
            <View style={{ flexDirection: "row", flexWrap: "wrap", gap: 6, marginTop: 12 }}>
              {MBTI.map((t) => {
                const on = mbti === t;
                return (
                  <Pressable key={t} onPress={() => setMbti(on ? null : t)} style={{ width: "22.5%", paddingVertical: 9, borderRadius: 10, alignItems: "center", backgroundColor: on ? rgba(AQUA, 0.15) : rgba(PAPER, 0.03), borderWidth: 1, borderColor: on ? rgba(AQUA, 0.6) : rgba(PAPER, 0.06) }}>
                    <Text style={{ fontFamily: FONTS.mono, fontSize: T.micro, color: on ? AQUA : rgba(PAPER, 0.4) }}>{t}</Text>
                  </Pressable>
                );
              })}
            </View>
          </Panel>

          <Panel>
            <Label>YOUR SOUNDTRACK</Label>
            {["low", "mid", "high"].map((k, i) => {
              const dot = [RAMP[0], RAMP[2], RAMP[4]][i];
              return (
                <View key={k} style={{ flexDirection: "row", alignItems: "center", gap: 10, marginTop: 10 }}>
                  <View style={{ width: 8, height: 8, borderRadius: 4, backgroundColor: dot, shadowColor: dot, shadowOpacity: 1, shadowRadius: 6, shadowOffset: { width: 0, height: 0 } }} />
                  <Text numberOfLines={1} style={{ flex: 1, fontFamily: FONTS.sans, fontSize: T.small, color: songs[k] ? PAPER : rgba(PAPER, 0.3) }}>
                    {songs[k] || "Not set"}
                  </Text>
                </View>
              );
            })}
          </Panel>

          <Text style={{ fontFamily: FONTS.mono, fontSize: T.micro, color: rgba(PAPER, 0.38), textAlign: "center", lineHeight: T.micro * 1.8, marginTop: 4 }}>
            Nothing is tracked in the background.{"\n"}Only your circles see your level.
          </Text>
        </ScrollView>
      </View>
    </Modal>
  );
}
