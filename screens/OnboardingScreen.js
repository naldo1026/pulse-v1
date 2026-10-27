import React, { useEffect, useState } from "react";
import { View, Text, ScrollView, Pressable, TextInput } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import Animated, { useSharedValue, useAnimatedStyle, withTiming, Easing } from "react-native-reanimated";
import { useTheme, FONTS, T } from "../theme";
import { statusFor } from "../lib/data";
import { Btn, Display } from "../components/primitives";
import LiquidCell from "../components/LiquidCell";
import VibeCheckModal from "../components/VibeCheckModal";
import PeopleEditor from "../components/PeopleEditor";
import Icon from "../components/Icon";
import LightStreak from "../components/LightStreak";

function FadeStep({ step, children }) {
  const fade = useSharedValue(0);
  useEffect(() => {
    fade.value = 0;
    fade.value = withTiming(1, { duration: 380, easing: Easing.out(Easing.cubic) });
  }, [step]);
  const style = useAnimatedStyle(() => ({ opacity: fade.value, transform: [{ translateY: (1 - fade.value) * 10 }] }));
  return <Animated.View style={[{ flex: 1 }, style]}>{children}</Animated.View>;
}

function TopBar({ step, steps, onBack }) {
  const t = useTheme();
  return (
    <View style={{ flexDirection: "row", alignItems: "center", gap: 16, height: 44 }}>
      <Pressable onPress={onBack} hitSlop={12} accessibilityRole="button" accessibilityLabel="Back">
        <Icon name="back" color={t.muted} />
      </Pressable>
      <View style={{ flex: 1, flexDirection: "row", gap: 6 }}>
        {steps.map((k) => (
          <View key={k} style={{ flex: 1, height: 2, borderRadius: 1, backgroundColor: k <= step ? t.ink : t.line }} />
        ))}
      </View>
      <View style={{ width: 20 }} />
    </View>
  );
}

// Welcome, name, level, groups, then notifications (skipped where push
// isn't possible or is already on). Groups save as you set them; the rest
// is handed to onFinish.
export default function OnboardingScreen({ initialName, people, setGroup, pushPerm, enablePush, onFinish }) {
  const t = useTheme();
  const insets = useSafeAreaInsets();
  const [step, setStep] = useState(0);
  const [name, setName] = useState(initialName || "");
  const [level, setLevel] = useState(50);
  const [quiz, setQuiz] = useState(false);
  const [askPush] = useState(pushPerm === "default");

  const st = statusFor(level);
  const steps = askPush ? [1, 2, 3, 4] : [1, 2, 3];
  const finish = () => onFinish({ name: name.trim(), level });

  const pad = { paddingTop: insets.top + 8, paddingHorizontal: 24, paddingBottom: insets.bottom + 20 };

  return (
    <View style={{ flex: 1, backgroundColor: t.bg }}>
      <LightStreak level={step === 0 ? 64 : level} height={step === 0 ? 560 : 440} intensity={step === 0 ? 1.15 : 1} />
      <FadeStep step={step}>
        {step === 0 && (
          <View style={[{ flex: 1 }, pad]}>
            <View style={{ flex: 1, alignItems: "center", justifyContent: "center" }}>
              <View pointerEvents="none">
                <LiquidCell level={64} onChange={() => {}} w={72} h={136} showNum={false} />
              </View>
              <Display size={48} style={{ marginTop: 36 }}>Pulse</Display>
              <Text style={{ fontFamily: FONTS.sans, fontSize: T.body, lineHeight: 22, color: t.muted, textAlign: "center", marginTop: 10, maxWidth: 290 }}>
                Let the people closest to you know how you're feeling, without having to explain.
              </Text>
            </View>
            <Btn onPress={() => setStep(1)}>Get started</Btn>
          </View>
        )}

        {step === 1 && (
          <View style={[{ flex: 1 }, pad]}>
            <TopBar step={1} steps={steps} onBack={() => setStep(0)} />
            <Display size={32} style={{ marginTop: 24 }}>What should people call you?</Display>
            <Text style={{ fontFamily: FONTS.sans, fontSize: T.body, color: t.muted, marginTop: 8 }}>This is how you show up in everyone's circle.</Text>
            <TextInput
              value={name} onChangeText={setName} onSubmitEditing={() => name.trim() && setStep(2)}
              placeholder="Your name" placeholderTextColor={t.faint} autoFocus autoComplete="given-name" maxLength={24}
              style={{ marginTop: 28, paddingVertical: 15, paddingHorizontal: 20, borderRadius: 100, backgroundColor: t.surface, borderWidth: 1, borderColor: t.line, color: t.ink, fontFamily: FONTS.sans, fontSize: 16 }}
            />
            <View style={{ flex: 1 }} />
            <Btn onPress={() => setStep(2)} disabled={!name.trim()}>Continue</Btn>
          </View>
        )}

        {step === 2 && (
          <View style={[{ flex: 1 }, pad]}>
            <TopBar step={2} steps={steps} onBack={() => setStep(1)} />
            <Display size={32} style={{ marginTop: 24 }}>How are you feeling right now?</Display>
            <Text style={{ fontFamily: FONTS.sans, fontSize: T.body, color: t.muted, marginTop: 8 }}>Drag to set it. You can change it any time.</Text>

            <View style={{ flex: 1, alignItems: "center", justifyContent: "center" }}>
              <LiquidCell level={level} onChange={setLevel} w={124} h={236} />
              <Display size={30} style={{ marginTop: 20 }}>{st.t}</Display>
              <Text style={{ fontFamily: FONTS.sans, fontSize: T.body, color: t.muted, marginTop: 2 }}>{st.s}</Text>
            </View>

            <Btn onPress={() => setStep(3)}>Continue</Btn>
            <Btn variant="ghost" onPress={() => setQuiz(true)} style={{ marginTop: 4 }}>Not sure? Answer two questions</Btn>
          </View>
        )}

        {step === 3 && (
          <View style={[{ flex: 1 }, pad]}>
            <TopBar step={3} steps={steps} onBack={() => setStep(2)} />
            <ScrollView style={{ flex: 1 }} contentContainerStyle={{ paddingBottom: 24 }}>
              <Display size={32} style={{ marginTop: 24 }}>Sort your people</Display>
              <Text style={{ fontFamily: FONTS.sans, fontSize: T.body, lineHeight: 22, color: t.muted, marginTop: 8 }}>
                Everyone here can see your level. Groups decide whose phones buzz when you send a pulse.
              </Text>

              <View style={{ marginTop: 16 }}>
                <PeopleEditor people={people} setGroup={setGroup} />
              </View>
            </ScrollView>

            <Btn onPress={askPush ? () => setStep(4) : finish}>{askPush ? "Continue" : "Done"}</Btn>
          </View>
        )}

        {step === 4 && (
          <View style={[{ flex: 1 }, pad]}>
            <TopBar step={4} steps={steps} onBack={() => setStep(3)} />
            <Display size={32} style={{ marginTop: 24 }}>Know when someone sends a pulse</Display>
            <Text style={{ fontFamily: FONTS.sans, fontSize: T.body, lineHeight: 22, color: t.muted, marginTop: 8 }}>
              Pulses from your people, and one quick check-in each morning. Nothing else.
            </Text>
            <View style={{ flex: 1 }} />
            {/* enablePush has to run straight from the tap for iOS to show its prompt. */}
            <Btn onPress={() => enablePush().finally(finish)}>Turn on notifications</Btn>
            <Btn variant="ghost" onPress={finish} style={{ marginTop: 4 }}>Not now</Btn>
          </View>
        )}
      </FadeStep>

      {quiz && <VibeCheckModal onDone={(v) => { setLevel(v); setQuiz(false); }} onSkip={() => setQuiz(false)} />}
    </View>
  );
}
