import React, { useEffect, useState } from "react";
import { View, Text, ScrollView, Pressable } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import Animated, { useSharedValue, useAnimatedStyle, withTiming, Easing } from "react-native-reanimated";
import { useTheme, FONTS, T } from "../theme";
import { SUGGESTED, statusFor } from "../lib/data";
import { Btn, Display } from "../components/primitives";
import LiquidCell from "../components/LiquidCell";
import VibeCheckModal from "../components/VibeCheckModal";
import PeopleEditor from "../components/PeopleEditor";
import Icon from "../components/Icon";

function FadeStep({ step, children }) {
  const fade = useSharedValue(0);
  useEffect(() => {
    fade.value = 0;
    fade.value = withTiming(1, { duration: 380, easing: Easing.out(Easing.cubic) });
  }, [step]);
  const style = useAnimatedStyle(() => ({ opacity: fade.value, transform: [{ translateY: (1 - fade.value) * 10 }] }));
  return <Animated.View style={[{ flex: 1 }, style]}>{children}</Animated.View>;
}

function TopBar({ step, onBack }) {
  const t = useTheme();
  return (
    <View style={{ flexDirection: "row", alignItems: "center", gap: 16, height: 44 }}>
      <Pressable onPress={onBack} hitSlop={12} accessibilityRole="button" accessibilityLabel="Back">
        <Icon name="back" color={t.muted} />
      </Pressable>
      <View style={{ flex: 1, flexDirection: "row", gap: 6 }}>
        {[1, 2].map((k) => (
          <View key={k} style={{ flex: 1, height: 2, borderRadius: 1, backgroundColor: k <= step ? t.ink : t.line }} />
        ))}
      </View>
      <View style={{ width: 20 }} />
    </View>
  );
}

export default function OnboardingScreen({ onFinish }) {
  const t = useTheme();
  const insets = useSafeAreaInsets();
  const [step, setStep] = useState(0);
  const [level, setLevel] = useState(50);
  const [quiz, setQuiz] = useState(false);
  const [members, setMembers] = useState([
    { n: "Ronaldo", g: "household" }, { n: "Kyle", g: "household" }, { n: "Erin", g: "friends" },
  ]);

  const st = statusFor(level);
  const finish = () => onFinish({ level, members });

  const pad = { paddingTop: insets.top + 8, paddingHorizontal: 24, paddingBottom: insets.bottom + 20 };

  return (
    <View style={{ flex: 1, backgroundColor: t.bg }}>
      <FadeStep step={step}>
        {step === 0 && (
          <View style={[{ flex: 1 }, pad]}>
            <View style={{ flex: 1, alignItems: "center", justifyContent: "center" }}>
              <View pointerEvents="none">
                <LiquidCell level={64} onChange={() => {}} w={72} h={136} showNum={false} />
              </View>
              <Display size={56} style={{ marginTop: 36 }}>Pulse</Display>
              <Text style={{ fontFamily: FONTS.sans, fontSize: T.body, lineHeight: 22, color: t.muted, textAlign: "center", marginTop: 10, maxWidth: 290 }}>
                Let the people closest to you know how you're feeling, without having to explain.
              </Text>
            </View>
            <Btn onPress={() => setStep(1)}>Get started</Btn>
          </View>
        )}

        {step === 1 && (
          <View style={[{ flex: 1 }, pad]}>
            <TopBar step={1} onBack={() => setStep(0)} />
            <Display size={36} style={{ marginTop: 24 }}>How are you feeling right now?</Display>
            <Text style={{ fontFamily: FONTS.sans, fontSize: T.body, color: t.muted, marginTop: 8 }}>Drag to set it. You can change it any time.</Text>

            <View style={{ flex: 1, alignItems: "center", justifyContent: "center" }}>
              <LiquidCell level={level} onChange={setLevel} w={124} h={236} />
              <Display size={32} style={{ marginTop: 20 }}>{st.t}</Display>
              <Text style={{ fontFamily: FONTS.sans, fontSize: T.body, color: t.muted, marginTop: 2 }}>{st.s}</Text>
            </View>

            <Btn onPress={() => setStep(2)}>Continue</Btn>
            <Btn variant="ghost" onPress={() => setQuiz(true)} style={{ marginTop: 4 }}>Not sure? Answer two questions</Btn>
          </View>
        )}

        {step === 2 && (
          <View style={[{ flex: 1 }, pad]}>
            <TopBar step={2} onBack={() => setStep(1)} />
            <ScrollView style={{ flex: 1 }} contentContainerStyle={{ paddingBottom: 24 }} keyboardShouldPersistTaps="handled">
              <Display size={36} style={{ marginTop: 24 }}>Who should see it?</Display>
              <Text style={{ fontFamily: FONTS.sans, fontSize: T.body, color: t.muted, marginTop: 8 }}>Add a few people. You can change this later.</Text>

              <View style={{ marginTop: 24 }}>
                <PeopleEditor members={members} setMembers={setMembers} suggestions={SUGGESTED} />
              </View>
            </ScrollView>

            <Btn onPress={finish}>{members.length ? "Done" : "Skip for now"}</Btn>
          </View>
        )}
      </FadeStep>

      {quiz && <VibeCheckModal onDone={(v) => { setLevel(v); setQuiz(false); }} onSkip={() => setQuiz(false)} />}
    </View>
  );
}
