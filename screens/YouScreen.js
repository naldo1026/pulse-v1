import React, { useEffect } from "react";
import { View, Text, ScrollView, Pressable } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import Animated, { useSharedValue, useAnimatedStyle, withSequence, withTiming } from "react-native-reanimated";
import { INK, PANEL, PAPER, GOLD, AQUA, VIOLET, SPOT, FONTS, T, rgba } from "../theme";
import { PEOPLE, WEEK, DAYS, GROUPS, REASONS, colorFor, statusFor } from "../lib/data";
import { Btn, Label, Panel, Chip, Script } from "../components/primitives";
import LiquidCell from "../components/LiquidCell";

const WINDOWS = [["an hour", "1h"], ["till 10", "10pm"], ["all evening", "late"]];

export default function YouScreen({
  level, setLevel, reason, setReason, sent, sendPulse, matches,
  mbti, spotify, songs, openQuiz, wantsChat, setWantsChat,
  myWindow, setMyWindow, seenBy, openSettings, members, pulseTo, setPulseTo,
}) {
  const insets = useSafeAreaInsets();
  const c = colorFor(level);
  const s = statusFor(level);
  const low = PEOPLE.find((p) => p.l <= 40);
  const hist = [...WEEK, level];
  const avg = Math.round(hist.reduce((a, b) => a + b, 0) / hist.length);
  const track = level <= 40 ? (songs.low || "Skinny Love — Bon Iver") : level <= 70 ? (songs.mid || "Sunflower — Post Malone") : (songs.high || "Levitating — Dua Lipa");

  const pulse = useSharedValue(1);
  useEffect(() => {
    if (sent) pulse.value = withSequence(withTiming(1.04, { duration: 140 }), withTiming(1, { duration: 140 }), withTiming(1.04, { duration: 140 }), withTiming(1, { duration: 140 }));
  }, [sent]);
  const pulseStyle = useAnimatedStyle(() => ({ transform: [{ scale: pulse.value }] }));

  return (
    <View style={{ flex: 1, backgroundColor: INK }}>
      <View style={{ flexDirection: "row", alignItems: "center", justifyContent: "space-between", paddingTop: insets.top + 8, paddingHorizontal: 22 }}>
        <View style={{ flexDirection: "row", alignItems: "center", gap: 8 }}>
          <View style={{ width: 7, height: 7, borderRadius: 3.5, backgroundColor: c, shadowColor: c, shadowOpacity: 1, shadowRadius: 6, shadowOffset: { width: 0, height: 0 } }} />
          <Script size={26}>Pulse</Script>
        </View>
        <View style={{ flexDirection: "row", alignItems: "center", gap: 14 }}>
          <Text style={{ fontFamily: FONTS.mono, fontSize: T.micro, color: rgba(PAPER, 0.4) }}>18:04</Text>
          <Pressable onPress={openSettings}>
            <Text style={{ fontFamily: FONTS.mono, fontSize: 15, color: rgba(PAPER, 0.4) }}>⚙</Text>
          </Pressable>
        </View>
      </View>

      <ScrollView contentContainerStyle={{ padding: 22, paddingBottom: insets.bottom + 34 }}>
        <View style={{ flexDirection: "row", alignItems: "flex-end", gap: 16 }}>
          <LiquidCell level={level} onChange={setLevel} w={150} h={310} />
          <View style={{ flex: 1, paddingBottom: 14 }}>
            <Script size={40} color={c} style={{ lineHeight: 40 }}>{s.t}</Script>
            <View style={{ flexDirection: "row", gap: 9, marginTop: 12 }}>
              <View style={{ width: 2, borderRadius: 2, backgroundColor: rgba(c, 0.45) }} />
              <Script size={25} color={rgba(PAPER, 0.72)} style={{ flex: 1, lineHeight: 30 }}>{s.s}</Script>
            </View>
            <Pressable onPress={openQuiz} style={{ marginTop: 14 }}>
              <Text style={{ fontFamily: FONTS.mono, fontSize: T.micro, color: rgba(PAPER, 0.48), letterSpacing: 1.1 }}>NOT SURE?{"\n"}VIBE CHECK</Text>
            </Pressable>
          </View>
        </View>

        <Panel style={{ marginTop: 22 }}>
          <View style={{ flexDirection: "row", justifyContent: "space-between", alignItems: "center" }}>
            <Label>LAST 7 DAYS</Label>
            <Text style={{ fontFamily: FONTS.mono, fontSize: T.micro, color: rgba(PAPER, 0.45) }}>ONLY YOU</Text>
          </View>
          <View style={{ flexDirection: "row", alignItems: "flex-end", gap: 7, height: 46, marginTop: 14 }}>
            {hist.map((v, i) => {
              const hc = colorFor(v);
              const last = i === hist.length - 1;
              return (
                <View key={i} style={{ flex: 1, alignItems: "center", gap: 5 }}>
                  <View style={{ width: "100%", height: Math.max(5, (v / 100) * 36), borderRadius: 3, backgroundColor: hc, opacity: last ? 1 : 0.42, shadowColor: hc, shadowOpacity: last ? 0.75 : 0, shadowRadius: 10, shadowOffset: { width: 0, height: 0 } }} />
                  <Text style={{ fontFamily: FONTS.mono, fontSize: T.micro, color: rgba(PAPER, last ? 0.6 : 0.25) }}>{DAYS[i]}</Text>
                </View>
              );
            })}
          </View>
          <Text style={{ fontFamily: FONTS.sans, fontSize: T.small, color: rgba(PAPER, 0.5), marginTop: 12 }}>
            Averaging <Text style={{ color: colorFor(avg), fontFamily: FONTS.sansBold }}>{avg}%</Text> this week.
          </Text>
        </Panel>

        <Panel style={{ marginTop: 12 }}>
          {level <= 40 ? (
            <>
              <Label>BECAUSE</Label>
              <View style={{ flexDirection: "row", flexWrap: "wrap", gap: 8, marginTop: 12 }}>
                {REASONS.map((r) => (
                  <Chip key={r} on={reason === r} color={c} onPress={() => setReason(reason === r ? null : r)}>{r}</Chip>
                ))}
              </View>
              <Pressable
                onPress={() => setWantsChat(!wantsChat)}
                style={{ flexDirection: "row", alignItems: "center", gap: 10, marginTop: 14, padding: 13, borderRadius: 16, backgroundColor: wantsChat ? rgba(AQUA, 0.12) : "transparent", borderWidth: 1, borderColor: wantsChat ? rgba(AQUA, 0.55) : rgba(PAPER, 0.08) }}
              >
                <View style={{ width: 7, height: 7, borderRadius: 3.5, backgroundColor: wantsChat ? AQUA : rgba(PAPER, 0.2), shadowColor: AQUA, shadowOpacity: wantsChat ? 1 : 0, shadowRadius: 6, shadowOffset: { width: 0, height: 0 } }} />
                <Script size={23} color={wantsChat ? AQUA : rgba(PAPER, 0.5)} style={{ flex: 1, lineHeight: 24 }}>
                  {wantsChat ? "Open to a chat, if anyone's around" : "Actually, I could use a chat"}
                </Script>
              </Pressable>

              {low && (
                <View style={{ flexDirection: "row", alignItems: "center", gap: 11, marginTop: 16, paddingTop: 16, borderTopWidth: 1, borderColor: rgba(PAPER, 0.07) }}>
                  <View style={{ width: 30, height: 30, borderRadius: 15, borderWidth: 1.5, borderColor: VIOLET, shadowColor: VIOLET, shadowOpacity: 0.6, shadowRadius: 10, shadowOffset: { width: 0, height: 0 }, alignItems: "center", justifyContent: "center" }}>
                    <Text style={{ fontFamily: FONTS.sansBold, fontSize: T.small, color: PAPER }}>{low.n[0]}</Text>
                  </View>
                  <Script size={24} color={rgba(PAPER, 0.85)}>{low.n} is low too</Script>
                </View>
              )}
            </>
          ) : (
            <>
              <Label>YOU COULD</Label>
              <Script size={30} style={{ marginTop: 8 }}>
                {mbti && mbti[0] === "I"
                  ? (level > 80 ? "See a few close people" : level > 60 ? "Two or three, max" : "One quiet coffee")
                  : (level > 80 ? "Get everyone out" : level > 60 ? "Round up the group" : "Low-key company")}
              </Script>
              {level > 60 && (
                <View style={{ marginTop: 16 }}>
                  <Label>PUT IT OUT THERE FOR</Label>
                  {myWindow && (
                    <View style={{ marginTop: 10, marginBottom: 4, padding: 14, borderRadius: 18, backgroundColor: rgba(c, 0.09), borderWidth: 1, borderColor: rgba(c, 0.35) }}>
                      <View style={{ flexDirection: "row", alignItems: "center", gap: 9 }}>
                        <View style={{ width: 7, height: 7, borderRadius: 3.5, backgroundColor: c, shadowColor: c, shadowOpacity: 1, shadowRadius: 6, shadowOffset: { width: 0, height: 0 } }} />
                        <Label color={rgba(c, 0.8)}>YOUR INVITE IS LIVE</Label>
                        <View style={{ flex: 1 }} />
                        <Pressable onPress={() => setMyWindow(null)}>
                          <Text style={{ fontFamily: FONTS.mono, fontSize: T.micro, color: rgba(PAPER, 0.4) }}>CANCEL</Text>
                        </Pressable>
                      </View>
                      <Script size={27} style={{ marginTop: 7 }}>Your circle can see you're around {myWindow}</Script>
                      <Text style={{ fontFamily: FONTS.mono, fontSize: T.micro, letterSpacing: 1.3, color: rgba(PAPER, 0.45), marginTop: 7 }}>Expires on its own. Nobody is notified twice.</Text>
                    </View>
                  )}
                  <View style={{ flexDirection: "row", gap: 8, marginTop: 10 }}>
                    {WINDOWS.map(([t, tag]) => {
                      const on = myWindow === t;
                      return (
                        <Pressable
                          key={t}
                          onPress={() => setMyWindow(on ? null : t)}
                          style={{ flex: 1, alignItems: "center", paddingVertical: 12, paddingHorizontal: 4, borderRadius: 16, backgroundColor: on ? rgba(c, 0.16) : rgba(PAPER, 0.035), borderWidth: 1, borderColor: on ? rgba(c, 0.7) : rgba(PAPER, 0.08), shadowColor: c, shadowOpacity: on ? 0.3 : 0, shadowRadius: 14, shadowOffset: { width: 0, height: 0 } }}
                        >
                          <Script size={24} color={on ? c : rgba(PAPER, 0.7)}>{t}</Script>
                          <Text style={{ fontFamily: FONTS.mono, fontSize: T.micro, letterSpacing: 1.5, color: on ? rgba(c, 0.7) : rgba(PAPER, 0.25), marginTop: 5 }}>{tag.toUpperCase()}</Text>
                        </Pressable>
                      );
                    })}
                  </View>
                </View>
              )}
            </>
          )}
        </Panel>

        <Panel style={{ marginTop: 12, flexDirection: "row", alignItems: "center", gap: 12 }}>
          <View style={{ width: 34, height: 34, borderRadius: 11, backgroundColor: rgba(spotify ? SPOT : PAPER, 0.1), alignItems: "center", justifyContent: "center" }}>
            <Text style={{ fontSize: 15, color: spotify ? SPOT : rgba(PAPER, 0.4) }}>♪</Text>
          </View>
          <View style={{ flex: 1 }}>
            <Label color={rgba(PAPER, 0.3)}>{spotify ? "MATCHED TO YOUR MOOD" : "SOUNDTRACK"}</Label>
            <Text numberOfLines={1} style={{ fontFamily: FONTS.sansSemiBold, fontSize: T.body, color: PAPER, marginTop: 4 }}>{spotify ? track : "Connect Spotify"}</Text>
          </View>
          {spotify && <Text style={{ fontFamily: FONTS.mono, fontSize: T.micro, color: SPOT }}>▶</Text>}
        </Panel>

        <View style={{ marginTop: 14 }}>
          <Label>SEND TO</Label>
          <View style={{ flexDirection: "row", gap: 7, marginTop: 9 }}>
            {GROUPS.map((g) => {
              const on = pulseTo.includes(g.id);
              const n = members.filter((m) => m.g === g.id).length;
              return (
                <Pressable
                  key={g.id}
                  onPress={() => setPulseTo(on ? pulseTo.filter((x) => x !== g.id) : [...pulseTo, g.id])}
                  style={{ flex: 1, alignItems: "center", paddingVertical: 10, paddingHorizontal: 4, borderRadius: 14, backgroundColor: on ? rgba(c, 0.14) : rgba(PAPER, 0.03), borderWidth: 1, borderColor: on ? rgba(c, 0.6) : rgba(PAPER, 0.08), opacity: n ? 1 : 0.4 }}
                >
                  <Script size={18} color={on ? c : rgba(PAPER, 0.5)}>{g.short}</Script>
                  <Text style={{ fontFamily: FONTS.mono, fontSize: T.micro, color: on ? rgba(c, 0.65) : rgba(PAPER, 0.25), marginTop: 3 }}>{n}</Text>
                </Pressable>
              );
            })}
          </View>
        </View>

        <Animated.View style={pulseStyle}>
          <Btn onPress={sendPulse} color={c} filled={!sent} style={{ marginTop: 14 }} textStyle={{ color: sent ? c : INK }}>
            {sent ? "Pulse sent" : pulseTo.length === 3 ? "Send pulse to everyone" : pulseTo.length === 0 ? "Pick a circle" : `Send to ${pulseTo.length} circle${pulseTo.length > 1 ? "s" : ""}`}
          </Btn>
        </Animated.View>

        {seenBy.length > 0 && (
          <View style={{ marginTop: 12, padding: 15, borderRadius: 18, backgroundColor: rgba(PAPER, 0.03), borderWidth: 1, borderColor: rgba(PAPER, 0.07) }}>
            <View style={{ flexDirection: "row", alignItems: "center", gap: 10 }}>
              <View style={{ flexDirection: "row" }}>
                {seenBy.map((n, i) => (
                  <View key={n} style={{ width: 26, height: 26, borderRadius: 13, marginLeft: i ? -8 : 0, backgroundColor: INK, borderWidth: 1.5, borderColor: GOLD, shadowColor: GOLD, shadowOpacity: 0.5, shadowRadius: 8, shadowOffset: { width: 0, height: 0 }, alignItems: "center", justifyContent: "center" }}>
                    <Text style={{ fontFamily: FONTS.sansBold, fontSize: 11, color: PAPER }}>{n[0]}</Text>
                  </View>
                ))}
              </View>
              <Script size={23} color={rgba(PAPER, 0.8)} style={{ flex: 1 }}>
                {seenBy.length === 1 ? `${seenBy[0]} saw it` : `${seenBy.slice(0, -1).join(", ")} and ${seenBy[seenBy.length - 1]} saw it`}
              </Script>
              <Text style={{ fontFamily: FONTS.mono, fontSize: T.micro, color: rgba(PAPER, 0.44) }}>NO REPLY NEEDED</Text>
            </View>
          </View>
        )}

        {matches.length > 0 && (
          <View style={{ marginTop: 12 }}>
            <Label>SIMILAR ENERGY RIGHT NOW</Label>
            <View style={{ gap: 8, marginTop: 10 }}>
              {matches.map((m) => (
                <Panel key={m.n} style={{ paddingVertical: 12, paddingHorizontal: 14, flexDirection: "row", alignItems: "center", justifyContent: "space-between" }}>
                  <Text style={{ fontFamily: FONTS.sansMedium, fontSize: T.small, color: PAPER }}>
                    {m.phrase} with <Text style={{ fontFamily: FONTS.sansBold }}>{m.n}</Text>
                  </Text>
                  <Pressable style={{ paddingVertical: 5, paddingHorizontal: 11, borderRadius: 100, borderWidth: 1, borderColor: rgba(c, 0.5) }}>
                    <Text style={{ fontFamily: FONTS.sansSemiBold, fontSize: T.micro, letterSpacing: 0.4, color: c }}>ASK</Text>
                  </Pressable>
                </Panel>
              ))}
            </View>
          </View>
        )}
      </ScrollView>
    </View>
  );
}
