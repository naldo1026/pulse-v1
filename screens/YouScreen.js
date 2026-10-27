import React, { useEffect, useState } from "react";
import { View, Text, ScrollView, Pressable } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import Animated, { useSharedValue, useAnimatedStyle } from "react-native-reanimated";
import { useTheme, FONTS, T } from "../theme";
import { GROUPS, REASONS, statusFor } from "../lib/data";
import { Btn, Label, Chip, Display, Segmented, Toggle } from "../components/primitives";
import LiquidCell from "../components/LiquidCell";
import Icon from "../components/Icon";
import LightStreak from "../components/LightStreak";
import { heartbeat } from "../components/PulseBurst";

const WINDOWS = [["an hour", "For an hour"], ["till 10", "Till 10"], ["all evening", "All evening"]];

const listNames = (names) => (names.length === 1 ? names[0] : `${names.slice(0, -1).join(", ")} and ${names[names.length - 1]}`);

export default function YouScreen({
  level, setLevel, reason, setReason, sent, sendPulse, matches,
  openQuiz, wantsChat, setWantsChat, myWindow, setMyWindow,
  seenBy, openSettings, members, pulseTo, setPulseTo, sendError, nudge,
}) {
  const t = useTheme();
  const insets = useSafeAreaInsets();
  const [asked, setAsked] = useState({});
  const s = statusFor(level);
  const canSend = pulseTo.some((g) => members.some((m) => m.g === g));

  const pulse = useSharedValue(1);
  useEffect(() => {
    // Same lub-dub timeline as the screen burst and the haptics.
    if (sent) pulse.value = heartbeat(1, 1.04, 1.03);
  }, [sent]);
  const pulseStyle = useAnimatedStyle(() => ({ transform: [{ scale: pulse.value }] }));

  return (
    <View style={{ flex: 1, backgroundColor: t.bg }}>
      <LightStreak level={level} />
      <View style={{ flexDirection: "row", alignItems: "center", justifyContent: "space-between", paddingTop: insets.top + 8, paddingHorizontal: 24 }}>
        <Display size={24}>Pulse</Display>
        <Pressable onPress={openSettings} hitSlop={12} accessibilityRole="button" accessibilityLabel="Settings">
          <Icon name="settings" color={t.muted} />
        </Pressable>
      </View>

      <ScrollView contentContainerStyle={{ paddingHorizontal: 24, paddingTop: 28, paddingBottom: insets.bottom + 32 }}>
        <View style={{ alignItems: "center" }}>
          <Animated.View style={pulseStyle}>
            <LiquidCell level={level} onChange={setLevel} w={128} h={244} />
          </Animated.View>
          <Display size={40} style={{ marginTop: 24 }}>{s.t}</Display>
          <Text style={{ fontFamily: FONTS.sans, fontSize: T.body, color: t.muted, marginTop: 2 }}>{s.s}</Text>
          <Pressable onPress={openQuiz} hitSlop={8} style={{ marginTop: 12 }}>
            <Text style={{ fontFamily: FONTS.sans, fontSize: T.small, color: t.faint, textDecorationLine: "underline" }}>Not sure?</Text>
          </Pressable>
        </View>

        {level <= 40 && (
          <View style={{ marginTop: 32 }}>
            <Label>What's going on?</Label>
            <View style={{ flexDirection: "row", flexWrap: "wrap", gap: 8, marginTop: 12 }}>
              {REASONS.map((r) => (
                <Chip key={r} on={reason === r} onPress={() => setReason(reason === r ? null : r)}>{r}</Chip>
              ))}
            </View>
            <Pressable onPress={() => setWantsChat(!wantsChat)} style={{ flexDirection: "row", alignItems: "center", marginTop: 20, paddingTop: 16, borderTopWidth: 1, borderColor: t.line }}>
              <Text style={{ flex: 1, fontFamily: FONTS.sans, fontSize: T.body, color: t.ink }}>Open to a chat</Text>
              <Toggle on={wantsChat} />
            </Pressable>
          </View>
        )}

        {level > 60 && (
          <View style={{ marginTop: 32 }}>
            <Label>I'm around</Label>
            <Segmented options={WINDOWS} value={myWindow} onChange={(id) => setMyWindow(myWindow === id ? null : id)} style={{ marginTop: 12 }} />
            {myWindow && (
              <Text style={{ fontFamily: FONTS.sans, fontSize: T.small, color: t.muted, marginTop: 10 }}>
                Your people can see you're around {myWindow}.
              </Text>
            )}
          </View>
        )}

        <View style={{ marginTop: 32 }}>
          <Label>Send to</Label>
          <View style={{ flexDirection: "row", gap: 8, marginTop: 12 }}>
            {GROUPS.map((g) => {
              const n = members.filter((m) => m.g === g.id).length;
              const on = n > 0 && pulseTo.includes(g.id);
              return (
                <Chip key={g.id} on={on} disabled={!n} style={{ opacity: n ? 1 : 0.4 }} onPress={() => setPulseTo(on ? pulseTo.filter((x) => x !== g.id) : [...pulseTo, g.id])}>
                  {g.label}
                </Chip>
              );
            })}
          </View>
        </View>

        <Animated.View style={[pulseStyle, { marginTop: 16 }]}>
          <Btn onPress={sendPulse} variant={sent ? "secondary" : "primary"} disabled={!canSend}>
            {sent ? "Sent" : canSend ? "Send pulse" : "Choose who to send to"}
          </Btn>
        </Animated.View>

        {sendError && (
          <Text style={{ fontFamily: FONTS.sans, fontSize: T.small, color: t.muted, textAlign: "center", marginTop: 14 }}>
            That didn't send. Check your connection and try again.
          </Text>
        )}

        {seenBy.length > 0 && (
          <View style={{ flexDirection: "row", alignItems: "center", justifyContent: "center", gap: 8, marginTop: 14 }}>
            <View style={{ flexDirection: "row" }}>
              {seenBy.map((n, i) => (
                <View key={n} style={{ width: 22, height: 22, borderRadius: 11, marginLeft: i ? -6 : 0, backgroundColor: t.surface, borderWidth: 1, borderColor: t.lineStrong, alignItems: "center", justifyContent: "center" }}>
                  <Text style={{ fontFamily: FONTS.medium, fontSize: 10, color: t.ink }}>{n[0]}</Text>
                </View>
              ))}
            </View>
            <Text style={{ fontFamily: FONTS.sans, fontSize: T.small, color: t.muted }}>{listNames(seenBy)} saw it</Text>
          </View>
        )}

        {matches.length > 0 && (
          <View style={{ marginTop: 32 }}>
            <Label>Also up for something</Label>
            <View style={{ marginTop: 4 }}>
              {matches.map((m) => (
                <View key={m.id} style={{ flexDirection: "row", alignItems: "center", paddingVertical: 14, borderBottomWidth: 1, borderColor: t.line }}>
                  <Text style={{ flex: 1, fontFamily: FONTS.sans, fontSize: T.body, color: t.ink }}>
                    {m.phrase} with <Text style={{ fontFamily: FONTS.medium }}>{m.n}</Text>
                  </Text>
                  <Pressable
                    disabled={asked[m.id]}
                    onPress={() => { setAsked((a) => ({ ...a, [m.id]: true })); nudge(m.id, "ask"); }}
                    style={{ paddingVertical: 6, paddingHorizontal: 14, borderRadius: 100, borderWidth: 1, borderColor: t.lineStrong }}
                  >
                    <Text style={{ fontFamily: FONTS.medium, fontSize: T.small, color: asked[m.id] ? t.faint : t.ink }}>{asked[m.id] ? "Asked" : "Ask"}</Text>
                  </Pressable>
                </View>
              ))}
            </View>
          </View>
        )}
      </ScrollView>
    </View>
  );
}
