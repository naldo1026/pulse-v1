import React, { useEffect, useState } from "react";
import { View, Text, ScrollView, Pressable, TextInput } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import Animated, { useSharedValue, useAnimatedStyle, withTiming, Easing } from "react-native-reanimated";
import { INK, PANEL, PAPER, GOLD, VIOLET, AQUA, SPOT, FONTS, T, rgba } from "../theme";
import { GROUPS, SUGGESTED, VIBE_ROUNDS, MBTI, MBTI_NOTE, LIBRARY, RAMP, colorFor, statusFor } from "../lib/data";
import { Btn, Label, Script } from "../components/primitives";
import LiquidCell from "../components/LiquidCell";
import VibeCheckModal from "../components/VibeCheckModal";

const TOTAL = 6;

function Dots({ i }) {
  return (
    <View style={{ flexDirection: "row", gap: 6, marginBottom: 24 }}>
      {Array.from({ length: TOTAL }).map((_, k) => (
        <View key={k} style={{ width: k === i ? 20 : 6, height: 5, borderRadius: 3, backgroundColor: k === i ? GOLD : rgba(PAPER, 0.15) }} />
      ))}
    </View>
  );
}

function FadeStep({ step, children }) {
  const fade = useSharedValue(0);
  useEffect(() => {
    fade.value = 0;
    fade.value = withTiming(1, { duration: 380, easing: Easing.out(Easing.cubic) });
  }, [step]);
  const style = useAnimatedStyle(() => ({ opacity: fade.value, transform: [{ translateY: (1 - fade.value) * 10 }] }));
  return <Animated.View style={style}>{children}</Animated.View>;
}

export default function OnboardingScreen({ onFinish }) {
  const insets = useSafeAreaInsets();
  const [step, setStep] = useState(0);
  const [members, setMembers] = useState([
    { n: "Ronaldo", g: "household" }, { n: "Kyle", g: "household" }, { n: "Erin", g: "friends" },
  ]);
  const [grp, setGrp] = useState("household");
  const [newName, setNewName] = useState("");
  const [songs, setSongs] = useState({ low: "", mid: "", high: "" });
  const [mbti, setMbti] = useState(null);
  const [spotify, setSpotify] = useState(false);
  const [level, setLevel] = useState(50);
  const [quiz, setQuiz] = useState(false);
  const [demo, setDemo] = useState(28);
  const [picking, setPicking] = useState(null);
  const [round, setRound] = useState(0);
  const [picks, setPicks] = useState({});

  const inGroup = (g) => members.filter((m) => m.g === g).map((m) => m.n);
  const allIn = members.map((m) => m.n);
  const addPerson = () => {
    const n = newName.trim();
    if (!n || inGroup(grp).length >= 6 || allIn.includes(n)) return;
    setMembers((m) => [...m, { n, g: grp }]);
    setNewName("");
  };
  const removePerson = (n) => setMembers((m) => m.filter((x) => x.n !== n));
  const c = colorFor(level);
  const st = statusFor(level);

  return (
    <View style={{ flex: 1, backgroundColor: INK }}>
      {step > 0 && step < 7 && (
        <Pressable onPress={() => setStep(7)} style={{ position: "absolute", right: 22, top: insets.top + 22, zIndex: 5 }}>
          <Text style={{ fontFamily: FONTS.mono, fontSize: T.micro, color: rgba(PAPER, 0.4) }}>SKIP</Text>
        </Pressable>
      )}

      <ScrollView contentContainerStyle={{ flexGrow: 1, paddingTop: insets.top + 60, paddingHorizontal: 24, paddingBottom: insets.bottom + 34, justifyContent: "center" }}>
        <FadeStep step={step}>
          {step === 0 && (
            <View>
              <View style={{ width: 66, height: 66, borderRadius: 22, backgroundColor: PANEL, borderWidth: 1, borderColor: rgba(PAPER, 0.1), alignItems: "center", justifyContent: "center", shadowColor: VIOLET, shadowOpacity: 0.35, shadowRadius: 20, shadowOffset: { width: 0, height: 0 }, marginBottom: 26 }}>
                <View style={{ width: 18, height: 30, borderRadius: 5, borderWidth: 2, borderColor: VIOLET, shadowColor: VIOLET, shadowOpacity: 0.7, shadowRadius: 10, shadowOffset: { width: 0, height: 0 } }}>
                  <View style={{ position: "absolute", left: 2, right: 2, bottom: 2, height: "55%", backgroundColor: VIOLET, borderRadius: 3 }} />
                </View>
              </View>
              <Script size={56}>{"Your battery,\nyour business."}</Script>
              <Text style={{ fontFamily: FONTS.sans, fontSize: T.body, color: rgba(PAPER, 0.5), marginTop: 18, lineHeight: T.body * 1.55, maxWidth: 280 }}>
                Set it once. The people closest to you just know. Nobody has to ask if you're okay.
              </Text>
              <Btn onPress={() => setStep(1)} color={GOLD} style={{ marginTop: 34 }}>Get started</Btn>
            </View>
          )}

          {step === 1 && (
            <View>
              <Dots i={0} />
              <Script size={44}>Try it. Drag the cell.</Script>
              <Text style={{ fontFamily: FONTS.sans, fontSize: T.small, color: rgba(PAPER, 0.5), marginTop: 8, lineHeight: T.small * 1.55 }}>
                This is the whole app. Watch what Kyle sees.
              </Text>

              <View style={{ flexDirection: "row", gap: 16, marginTop: 22, alignItems: "stretch" }}>
                <LiquidCell level={demo} onChange={setDemo} w={104} h={210} />

                <View style={{ flex: 1, justifyContent: "center", gap: 10 }}>
                  <Label>KYLE'S PHONE</Label>
                  <View style={{ padding: 14, borderRadius: 18, backgroundColor: PANEL, borderWidth: 1, borderColor: rgba(PAPER, 0.08) }}>
                    <View style={{ flexDirection: "row", alignItems: "center", gap: 9 }}>
                      <View style={{ width: 26, height: 26, borderRadius: 13, borderWidth: 1.5, borderColor: colorFor(demo), shadowColor: colorFor(demo), shadowOpacity: 0.6, shadowRadius: 8, shadowOffset: { width: 0, height: 0 }, alignItems: "center", justifyContent: "center" }}>
                        <Text style={{ fontFamily: FONTS.sansBold, fontSize: 11, color: PAPER }}>Y</Text>
                      </View>
                      <Text style={{ fontFamily: FONTS.sansSemiBold, fontSize: T.small, color: PAPER }}>You</Text>
                      <View style={{ flex: 1 }} />
                      <Text style={{ fontFamily: FONTS.sansExtraBold, fontSize: 17, color: colorFor(demo) }}>{demo}</Text>
                    </View>
                    <Script size={22} color={rgba(PAPER, 0.8)} style={{ marginTop: 8 }}>{statusFor(demo).t}</Script>
                  </View>

                  <Text style={{ fontFamily: FONTS.sans, fontSize: T.micro, color: rgba(PAPER, 0.4), lineHeight: T.micro * 1.5 }}>
                    {demo <= 40
                      ? "He leaves you alone. You didn't have to say a word."
                      : demo <= 70
                        ? "He knows you're about, but won't push it."
                        : "He knows tonight's the night to ask."}
                  </Text>
                </View>
              </View>

              <View style={{ marginTop: 20, padding: 15, borderRadius: 18, backgroundColor: rgba(GOLD, 0.06), borderWidth: 1, borderColor: rgba(GOLD, 0.22) }}>
                <Script size={26} color={GOLD}>That's it. No explaining.</Script>
                <Text style={{ fontFamily: FONTS.sans, fontSize: T.small, color: rgba(PAPER, 0.55), marginTop: 5, lineHeight: T.small * 1.5 }}>
                  You never have to say "sorry, I'm just tired" again. Your battery already said it.
                </Text>
              </View>

              <Btn onPress={() => setStep(2)} color={GOLD} style={{ marginTop: 20 }}>Makes sense</Btn>
            </View>
          )}

          {step === 2 && (
            <View>
              <Dots i={1} />
              <Script size={44}>Build your circles.</Script>
              <Text style={{ fontFamily: FONTS.sans, fontSize: T.small, color: rgba(PAPER, 0.45), marginTop: 8, lineHeight: T.small * 1.5 }}>
                Three circles, up to six people each. Everyone sees the same battery, so you never have to keep up two versions of yourself.
              </Text>

              <View style={{ flexDirection: "row", gap: 6, marginTop: 18 }}>
                {GROUPS.map((g) => {
                  const on = grp === g.id;
                  const n = inGroup(g.id).length;
                  return (
                    <Pressable key={g.id} onPress={() => { setGrp(g.id); setPicking(null); }} style={{ flex: 1, paddingVertical: 10, paddingHorizontal: 4, borderRadius: 14, alignItems: "center", backgroundColor: on ? rgba(GOLD, 0.13) : rgba(PAPER, 0.03), borderWidth: 1, borderColor: on ? rgba(GOLD, 0.55) : rgba(PAPER, 0.07) }}>
                      <Script size={19} color={on ? GOLD : rgba(PAPER, 0.6)}>{g.short}</Script>
                      <Text style={{ fontFamily: FONTS.mono, fontSize: T.micro, color: on ? rgba(GOLD, 0.7) : rgba(PAPER, 0.25), marginTop: 4 }}>{n}/6</Text>
                    </Pressable>
                  );
                })}
              </View>

              <Text style={{ fontFamily: FONTS.sans, fontSize: T.micro, color: rgba(PAPER, 0.46), marginTop: 10, textAlign: "center" }}>
                {GROUPS.find((g) => g.id === grp).note}
              </Text>

              <View style={{ flexDirection: "row", flexWrap: "wrap", gap: 11, marginTop: 16 }}>
                {Array.from({ length: 6 }).map((_, i) => {
                  const n = inGroup(grp)[i];
                  const open = !n;
                  return (
                    <Pressable
                      key={i}
                      onPress={() => (n ? removePerson(n) : setPicking(i))}
                      style={{
                        width: "30%", aspectRatio: 1, borderRadius: 999,
                        backgroundColor: open ? "transparent" : rgba(GOLD, 0.1),
                        borderWidth: open ? 1.5 : 2,
                        borderStyle: open ? "dashed" : "solid",
                        borderColor: open ? rgba(PAPER, picking === i ? 0.5 : 0.18) : GOLD,
                        shadowColor: GOLD, shadowOpacity: open ? 0 : 0.4, shadowRadius: 14, shadowOffset: { width: 0, height: 0 },
                        alignItems: "center", justifyContent: "center",
                      }}
                    >
                      {open ? (
                        <Text style={{ fontFamily: FONTS.mono, fontSize: 19, color: rgba(PAPER, picking === i ? 0.6 : 0.22) }}>+</Text>
                      ) : (
                        <>
                          <Text style={{ fontFamily: FONTS.sansBold, fontSize: 19, color: PAPER }}>{n[0].toUpperCase()}</Text>
                          <Text numberOfLines={1} style={{ fontFamily: FONTS.sans, fontSize: T.micro, color: rgba(PAPER, 0.55), marginTop: 1, maxWidth: "82%" }}>{n}</Text>
                        </>
                      )}
                    </Pressable>
                  );
                })}
              </View>

              {picking !== null && (
                <View style={{ marginTop: 16, padding: 16, borderRadius: 20, backgroundColor: PANEL, borderWidth: 1, borderColor: rgba(PAPER, 0.1) }}>
                  <View style={{ flexDirection: "row", justifyContent: "space-between", alignItems: "center" }}>
                    <Label>{`ADD TO ${GROUPS.find((g) => g.id === grp).label.toUpperCase()}`}</Label>
                    <Pressable onPress={() => setPicking(null)}>
                      <Text style={{ fontFamily: FONTS.mono, fontSize: T.small, color: rgba(PAPER, 0.48) }}>×</Text>
                    </Pressable>
                  </View>
                  <View style={{ flexDirection: "row", flexWrap: "wrap", gap: 7, marginTop: 12 }}>
                    {SUGGESTED.filter((p) => !allIn.includes(p.n)).map((p) => (
                      <Pressable key={p.n} onPress={() => { setMembers((m) => [...m, { n: p.n, g: grp }]); setPicking(null); }} style={{ paddingVertical: 9, paddingHorizontal: 15, borderRadius: 100, backgroundColor: rgba(PAPER, 0.04), borderWidth: 1, borderColor: rgba(PAPER, 0.1) }}>
                        <Text style={{ fontFamily: FONTS.sansSemiBold, fontSize: T.small, color: rgba(PAPER, 0.75) }}>{p.n}</Text>
                      </Pressable>
                    ))}
                  </View>
                  <View style={{ flexDirection: "row", gap: 8, marginTop: 12 }}>
                    <TextInput
                      value={newName}
                      onChangeText={setNewName}
                      onSubmitEditing={() => { addPerson(); setPicking(null); }}
                      placeholder="Or type a name"
                      placeholderTextColor={rgba(PAPER, 0.3)}
                      style={{ flex: 1, paddingVertical: 12, paddingHorizontal: 15, borderRadius: 100, backgroundColor: rgba(PAPER, 0.03), borderWidth: 1, borderColor: rgba(PAPER, 0.09), color: PAPER, fontFamily: FONTS.sans, fontSize: T.body }}
                    />
                    <Pressable onPress={() => { addPerson(); setPicking(null); }} style={{ width: 48, borderRadius: 100, backgroundColor: newName.trim() ? GOLD : rgba(PAPER, 0.04), alignItems: "center", justifyContent: "center" }}>
                      <Text style={{ fontSize: 19, color: newName.trim() ? INK : rgba(PAPER, 0.3) }}>+</Text>
                    </Pressable>
                  </View>
                </View>
              )}

              <Btn onPress={() => setStep(3)} color={GOLD} style={{ marginTop: 16 }}>
                {allIn.length === 0 ? "I'll add people later" : `Continue with ${allIn.length}`}
              </Btn>
            </View>
          )}

          {step === 3 && (
            <View>
              <Dots i={2} />
              <View style={{ flexDirection: "row", alignItems: "center", gap: 8 }}>
                <Label color={rgba(PAPER, 0.4)}>TEACHING PULSE ABOUT YOU</Label>
                <View style={{ flex: 1, height: 1, backgroundColor: rgba(PAPER, 0.1) }} />
                <Text style={{ fontFamily: FONTS.mono, fontSize: T.micro, color: rgba(PAPER, 0.48) }}>{round + 1}/3</Text>
              </View>

              <Script size={40} style={{ marginTop: 14 }}>{VIBE_ROUNDS[round].ask}</Script>

              <View style={{ flexDirection: "row", gap: 16, marginTop: 18, alignItems: "flex-start" }}>
                <LiquidCell level={VIBE_ROUNDS[round].at} onChange={() => {}} w={72} h={150} showNum={false} />
                <View style={{ flex: 1, gap: 7 }}>
                  {VIBE_ROUNDS[round].opts.map((o) => {
                    const on = picks[round] === o;
                    const col = colorFor(VIBE_ROUNDS[round].at);
                    return (
                      <Pressable
                        key={o}
                        onPress={() => {
                          setPicks((p) => ({ ...p, [round]: on ? null : o }));
                          if (!on && round < 2) setTimeout(() => setRound(round + 1), 260);
                        }}
                        style={{ paddingVertical: 11, paddingHorizontal: 14, borderRadius: 100, backgroundColor: on ? rgba(col, 0.16) : rgba(PAPER, 0.03), borderWidth: 1, borderColor: on ? rgba(col, 0.65) : rgba(PAPER, 0.08), shadowColor: col, shadowOpacity: on ? 0.3 : 0, shadowRadius: 12, shadowOffset: { width: 0, height: 0 } }}
                      >
                        <Script size={22} color={on ? col : rgba(PAPER, 0.7)}>{o}</Script>
                      </Pressable>
                    );
                  })}
                </View>
              </View>

              <Text style={{ fontFamily: FONTS.sans, fontSize: T.small, color: rgba(PAPER, 0.4), marginTop: 16, lineHeight: T.small * 1.5 }}>
                {VIBE_ROUNDS[round].why}
              </Text>

              {Object.values(picks).filter(Boolean).length > 0 && (
                <View style={{ marginTop: 16, padding: 14, borderRadius: 18, backgroundColor: rgba(PAPER, 0.03), borderWidth: 1, borderColor: rgba(PAPER, 0.07) }}>
                  <Label color={rgba(PAPER, 0.32)}>PULSE NOW KNOWS</Label>
                  <View style={{ marginTop: 8, gap: 6 }}>
                    {VIBE_ROUNDS.map((r, i) => picks[i] && (
                      <View key={i} style={{ flexDirection: "row", alignItems: "center", gap: 9 }}>
                        <View style={{ width: 7, height: 7, borderRadius: 3.5, backgroundColor: colorFor(r.at), shadowColor: colorFor(r.at), shadowOpacity: 1, shadowRadius: 6, shadowOffset: { width: 0, height: 0 } }} />
                        <Text style={{ fontFamily: FONTS.mono, fontSize: T.micro, color: rgba(PAPER, 0.4), width: 30 }}>{r.at}%</Text>
                        <Text style={{ fontFamily: FONTS.sans, fontSize: T.small, color: rgba(PAPER, 0.75) }}>{picks[i]}</Text>
                      </View>
                    ))}
                  </View>
                </View>
              )}

              <View style={{ flexDirection: "row", gap: 9, marginTop: 18 }}>
                {round > 0 && (
                  <Pressable onPress={() => setRound(round - 1)} style={{ paddingVertical: 16, paddingHorizontal: 22, borderRadius: 100, borderWidth: 1, borderColor: rgba(PAPER, 0.16) }}>
                    <Text style={{ fontFamily: FONTS.sansSemiBold, fontSize: T.body, color: rgba(PAPER, 0.6) }}>Back</Text>
                  </Pressable>
                )}
                <Btn onPress={() => (round < 2 ? setRound(round + 1) : setStep(4))} color={GOLD} style={{ flex: 1 }}>
                  {round < 2 ? "Next" : "Done"}
                </Btn>
              </View>
            </View>
          )}

          {step === 4 && (
            <View>
              <Dots i={3} />
              <Script size={46}>Your soundtrack</Script>
              <Text style={{ fontFamily: FONTS.sans, fontSize: T.small, color: rgba(PAPER, 0.5), marginTop: 8, lineHeight: T.small * 1.55 }}>
                {spotify ? "Pick one song for each mood." : "Connect Spotify and pick a song for each mood."}
              </Text>

              <Pressable
                onPress={() => setSpotify(!spotify)}
                style={{ flexDirection: "row", alignItems: "center", gap: 11, padding: 14, borderRadius: 18, marginTop: 18, backgroundColor: spotify ? rgba(SPOT, 0.12) : PANEL, borderWidth: 1, borderColor: spotify ? rgba(SPOT, 0.6) : rgba(PAPER, 0.07), shadowColor: SPOT, shadowOpacity: spotify ? 0.3 : 0, shadowRadius: 16, shadowOffset: { width: 0, height: 0 } }}
              >
                <View style={{ width: 28, height: 28, borderRadius: 14, backgroundColor: SPOT, alignItems: "center", justifyContent: "center" }}>
                  <Text style={{ fontSize: T.body, color: INK, fontFamily: FONTS.sansExtraBold }}>♪</Text>
                </View>
                <View style={{ flex: 1 }}>
                  <Text style={{ fontFamily: FONTS.sansSemiBold, fontSize: T.body, color: PAPER }}>{spotify ? "Spotify connected" : "Connect Spotify"}</Text>
                  {spotify && <Text style={{ fontFamily: FONTS.mono, fontSize: T.micro, color: rgba(PAPER, 0.48), marginTop: 2 }}>FROM YOUR LIBRARY</Text>}
                </View>
                {spotify && <Text style={{ fontFamily: FONTS.mono, fontSize: T.small, color: SPOT }}>✓</Text>}
              </Pressable>

              {spotify ? (
                <View style={{ marginTop: 16, gap: 16 }}>
                  {[["low", "When you're low", RAMP[0]], ["mid", "A so-so day", RAMP[2]], ["high", "When you're hyped", RAMP[4]]].map(([k, l, col]) => {
                    return (
                      <View key={k}>
                        <Label color={col}>{l.toUpperCase()}</Label>
                        <View style={{ gap: 6, marginTop: 8 }}>
                          {LIBRARY[k].map((tr) => {
                            const label = `${tr.t} — ${tr.a}`;
                            const on = songs[k] === label;
                            return (
                              <Pressable
                                key={tr.t}
                                onPress={() => setSongs((sg) => ({ ...sg, [k]: on ? "" : label }))}
                                style={{ flexDirection: "row", alignItems: "center", gap: 11, paddingVertical: 10, paddingHorizontal: 12, borderRadius: 14, backgroundColor: on ? rgba(col, 0.13) : rgba(PAPER, 0.03), borderWidth: 1, borderColor: on ? rgba(col, 0.6) : rgba(PAPER, 0.06) }}
                              >
                                <View style={{ width: 32, height: 32, borderRadius: 7, backgroundColor: rgba(col, on ? 0.5 : 0.2), alignItems: "center", justifyContent: "center" }}>
                                  <Text style={{ fontSize: T.small, color: on ? PAPER : rgba(PAPER, 0.5) }}>♪</Text>
                                </View>
                                <View style={{ flex: 1 }}>
                                  <Text numberOfLines={1} style={{ fontFamily: FONTS.sansSemiBold, fontSize: T.small, color: PAPER }}>{tr.t}</Text>
                                  <Text style={{ fontFamily: FONTS.sans, fontSize: 11, color: rgba(PAPER, 0.4) }}>{tr.a}</Text>
                                </View>
                                {on && <Text style={{ fontFamily: FONTS.mono, fontSize: T.small, color: col }}>✓</Text>}
                              </Pressable>
                            );
                          })}
                        </View>
                      </View>
                    );
                  })}
                </View>
              ) : (
                <View style={{ marginTop: 20, paddingVertical: 26, paddingHorizontal: 18, borderRadius: 18, backgroundColor: PANEL, borderWidth: 1, borderStyle: "dashed", borderColor: rgba(PAPER, 0.1), alignItems: "center" }}>
                  <Text style={{ fontSize: 26, opacity: 0.35, color: PAPER }}>♪</Text>
                  <Text style={{ fontFamily: FONTS.sans, fontSize: T.small, color: rgba(PAPER, 0.4), marginTop: 8, lineHeight: T.small * 1.5, textAlign: "center" }}>
                    Connect above to pick from your library.{"\n"}You can always do this later.
                  </Text>
                </View>
              )}

              <Btn onPress={() => setStep(5)} color={GOLD} style={{ marginTop: 20 }}>Continue</Btn>
            </View>
          )}

          {step === 5 && (
            <View>
              <Dots i={4} />
              <Script size={46}>Know your type?</Script>
              <Text style={{ fontFamily: FONTS.sans, fontSize: T.small, color: rgba(PAPER, 0.45), marginTop: 8, lineHeight: T.small * 1.55 }}>
                Myers-Briggs is four letters describing how you recharge, take things in, decide and plan. Pulse mainly uses the first one.
              </Text>

              <View style={{ flexDirection: "row", gap: 9, marginTop: 16 }}>
                {[["I", "Introvert", "refills alone"], ["E", "Extravert", "refills around people"]].map(([k, name, note]) => {
                  const on = mbti && mbti[0] === k;
                  return (
                    <View key={k} style={{ flex: 1, padding: 14, borderRadius: 18, backgroundColor: on ? rgba(AQUA, 0.1) : PANEL, borderWidth: 1, borderColor: on ? rgba(AQUA, 0.5) : rgba(PAPER, 0.07) }}>
                      <View style={{ flexDirection: "row", alignItems: "baseline", gap: 7 }}>
                        <Text style={{ fontFamily: FONTS.sansExtraBold, fontSize: 20, color: on ? AQUA : rgba(PAPER, 0.55) }}>{k}</Text>
                        <Text style={{ fontFamily: FONTS.sansSemiBold, fontSize: T.small, color: rgba(PAPER, 0.55) }}>{name}</Text>
                      </View>
                      <Text style={{ fontFamily: FONTS.sans, fontSize: T.micro, color: rgba(PAPER, 0.4), marginTop: 4 }}>{note}</Text>
                    </View>
                  );
                })}
              </View>

              <View style={{ flexDirection: "row", flexWrap: "wrap", gap: 7, marginTop: 14 }}>
                {MBTI.map((t) => {
                  const on = mbti === t;
                  return (
                    <Pressable
                      key={t}
                      onPress={() => setMbti(on ? null : t)}
                      style={{ width: "22.75%", paddingVertical: 11, borderRadius: 12, alignItems: "center", backgroundColor: on ? rgba(AQUA, 0.15) : PANEL, borderWidth: 1, borderColor: on ? rgba(AQUA, 0.65) : rgba(PAPER, 0.07), shadowColor: AQUA, shadowOpacity: on ? 0.35 : 0, shadowRadius: 10, shadowOffset: { width: 0, height: 0 } }}
                    >
                      <Text style={{ fontFamily: FONTS.mono, fontSize: T.micro, color: on ? AQUA : rgba(PAPER, 0.45) }}>{t}</Text>
                    </Pressable>
                  );
                })}
              </View>

              {mbti && (
                <View style={{ marginTop: 14, padding: 15, borderRadius: 18, backgroundColor: rgba(AQUA, 0.07), borderWidth: 1, borderColor: rgba(AQUA, 0.28) }}>
                  <Script size={26} color={AQUA}>{MBTI_NOTE(mbti).axis}</Script>
                  <Text style={{ fontFamily: FONTS.sans, fontSize: T.small, color: rgba(PAPER, 0.6), marginTop: 6, lineHeight: T.small * 1.5 }}>{MBTI_NOTE(mbti).line}</Text>
                </View>
              )}

              <Text style={{ fontFamily: FONTS.mono, fontSize: T.micro, color: rgba(PAPER, 0.45), marginTop: 14, lineHeight: T.micro * 1.7 }}>
                It's a fun frame, not a science.{"\n"}Skip it and the app works the same.
              </Text>
              <Btn onPress={() => setStep(6)} color={GOLD} style={{ marginTop: 14 }}>{mbti ? "Continue" : "Skip this"}</Btn>
            </View>
          )}

          {step === 6 && (
            <View>
              <Dots i={5} />
              <Script size={46}>{"How are you\nright now?"}</Script>
              <Text style={{ fontFamily: FONTS.sans, fontSize: T.small, color: rgba(PAPER, 0.5), marginTop: 8, lineHeight: T.small * 1.55 }}>Drag the cell. You can change it any time.</Text>

              <View style={{ alignItems: "center", marginTop: 22 }}>
                <LiquidCell level={level} onChange={setLevel} w={132} h={232} />
              </View>

              <View style={{ alignItems: "center", marginTop: 18 }}>
                <Script size={40} color={c}>{st.t}</Script>
                <Text style={{ fontFamily: FONTS.sans, fontSize: T.small, color: rgba(PAPER, 0.45), marginTop: 6 }}>{st.s}</Text>
              </View>

              <Btn onPress={() => setStep(7)} color={c} style={{ marginTop: 24 }}>That's about right</Btn>

              <Pressable onPress={() => setQuiz(true)} style={{ marginTop: 12, paddingVertical: 13, borderRadius: 100, alignItems: "center", borderWidth: 1, borderColor: rgba(PAPER, 0.14) }}>
                <Text style={{ fontFamily: FONTS.sansMedium, fontSize: T.small, color: rgba(PAPER, 0.6) }}>Not sure? Answer two questions</Text>
              </Pressable>
            </View>
          )}

          {step === 7 && (
            <View>
              <View style={{ width: 70, height: 70, borderRadius: 35, borderWidth: 2, borderColor: GOLD, alignItems: "center", justifyContent: "center", shadowColor: GOLD, shadowOpacity: 0.5, shadowRadius: 20, shadowOffset: { width: 0, height: 0 }, marginBottom: 24 }}>
                <Text style={{ fontSize: 28, color: GOLD }}>✓</Text>
              </View>
              <Script size={52}>You're all set.</Script>
              <Text style={{ fontFamily: FONTS.sans, fontSize: T.body, color: rgba(PAPER, 0.5), marginTop: 12, lineHeight: T.body * 1.5 }}>{members.length} people can see your battery now.</Text>
              <Btn onPress={() => onFinish({ level, vibes: picks, songs, mbti, spotify, members })} color={GOLD} style={{ marginTop: 30 }}>Enter Pulse</Btn>
            </View>
          )}
        </FadeStep>
      </ScrollView>

      {quiz && <VibeCheckModal onDone={(v) => { setLevel(v); setQuiz(false); }} onSkip={() => setQuiz(false)} />}
    </View>
  );
}
