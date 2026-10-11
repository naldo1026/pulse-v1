import React, { useEffect, useState } from "react";
import { View, Text, ActivityIndicator, Pressable } from "react-native";
import { StatusBar } from "expo-status-bar";
import { GestureHandlerRootView } from "react-native-gesture-handler";
import { SafeAreaProvider, useSafeAreaInsets } from "react-native-safe-area-context";
import { NavigationContainer, DefaultTheme } from "@react-navigation/native";
import { createBottomTabNavigator } from "@react-navigation/bottom-tabs";
import { useFonts } from "expo-font";
import { Caveat_700Bold } from "@expo-google-fonts/caveat";
import {
  PlusJakartaSans_400Regular, PlusJakartaSans_500Medium, PlusJakartaSans_600SemiBold,
  PlusJakartaSans_700Bold, PlusJakartaSans_800ExtraBold,
} from "@expo-google-fonts/plus-jakarta-sans";
import { IBMPlexMono_400Regular, IBMPlexMono_500Medium } from "@expo-google-fonts/ibm-plex-mono";

import SplashScreen from "./screens/SplashScreen";
import OnboardingScreen from "./screens/OnboardingScreen";
import YouScreen from "./screens/YouScreen";
import CircleScreen from "./screens/CircleScreen";
import WeekScreen from "./screens/WeekScreen";
import SettingsScreen from "./screens/SettingsScreen";
import PulseBurst from "./components/PulseBurst";
import MorningPrompt from "./components/MorningPrompt";
import VibeCheckModal from "./components/VibeCheckModal";
import { INK, PANEL, PAPER, GOLD, FONTS, rgba } from "./theme";
import { PEOPLE, setRamp, colorFor } from "./lib/data";

const Tab = createBottomTabNavigator();

const navTheme = {
  ...DefaultTheme,
  colors: { ...DefaultTheme.colors, background: INK, card: PANEL, border: rgba(PAPER, 0.08) },
};

function PulseTabBar({ state, descriptors, navigation }) {
  const insets = useSafeAreaInsets();
  return (
    <View style={{ flexDirection: "row", gap: 6, paddingHorizontal: 16, paddingTop: 9, paddingBottom: insets.bottom + 9, backgroundColor: rgba(INK, 0.96), borderTopWidth: 1, borderColor: rgba(PAPER, 0.08) }}>
      {state.routes.map((route, index) => {
        const isFocused = state.index === index;
        const onPress = () => {
          const event = navigation.emit({ type: "tabPress", target: route.key, canPreventDefault: true });
          if (!isFocused && !event.defaultPrevented) navigation.navigate(route.name);
        };
        return (
          <Pressable
            key={route.key}
            onPress={onPress}
            style={{ flex: 1, alignItems: "center", paddingVertical: 9, borderRadius: 100, backgroundColor: isFocused ? rgba(PAPER, 0.08) : "transparent", borderWidth: 1, borderColor: isFocused ? rgba(PAPER, 0.14) : "transparent" }}
          >
            <Text style={{ fontFamily: FONTS.script, fontSize: 21, color: isFocused ? PAPER : rgba(PAPER, 0.35) }}>{route.name}</Text>
          </Pressable>
        );
      })}
    </View>
  );
}

export default function App() {
  const [fontsLoaded] = useFonts({
    Caveat_700Bold,
    PlusJakartaSans_400Regular, PlusJakartaSans_500Medium, PlusJakartaSans_600SemiBold, PlusJakartaSans_700Bold, PlusJakartaSans_800ExtraBold,
    IBMPlexMono_400Regular, IBMPlexMono_500Medium,
  });

  const [stage, setStage] = useState("splash");
  const [profile, setProfile] = useState(null);
  const [level, setLevel] = useState(35);
  const [reason, setReason] = useState("long day");
  const [sent, setSent] = useState(false);
  const [matches, setMatches] = useState([]);
  const [ack, setAck] = useState({});
  const [quiz, setQuiz] = useState(false);
  const [morning, setMorning] = useState(false);
  const [mbti, setMbti] = useState(null);
  const [burst, setBurst] = useState(0);
  const [wantsChat, setWantsChat] = useState(false);
  const [myWindow, setMyWindow] = useState(null);
  const [members, setMembers] = useState([
    { n: "Ronaldo", g: "household" }, { n: "Kyle", g: "household" }, { n: "Erin", g: "friends" },
  ]);
  const [pulseTo, setPulseTo] = useState(["household", "family", "friends"]);
  const [seenBy, setSeenBy] = useState([]);
  const [settingsOpen, setSettingsOpen] = useState(false);
  const [morningTime, setMorningTime] = useState("07:40");
  const [theme, setThemeState] = useState("dusk");
  // Apply immediately so this render already uses the new ramp.
  setRamp(theme);
  const setTheme = (id) => { setRamp(id); setThemeState(id); };

  useEffect(() => {
    if (stage !== "splash") return;
    const t = setTimeout(() => setStage("onboarding"), 2200);
    return () => clearTimeout(t);
  }, [stage]);

  useEffect(() => {
    if (stage !== "main" || morningTime === "off") return;
    const t = setTimeout(() => setMorning(true), 900);
    return () => clearTimeout(t);
  }, [stage]);

  useEffect(() => {
    if (level > 40 && wantsChat) setWantsChat(false);
    if (level <= 60 && myWindow) setMyWindow(null);
  }, [level]);

  const sendPulse = () => {
    setSent(true);
    setSeenBy([]);
    setBurst((b) => b + 1);
    setTimeout(() => setSeenBy(["Kyle"]), 2600);
    setTimeout(() => setSeenBy(["Kyle", "Erin"]), 5200);
    setMatches(
      PEOPLE.filter((p) => p.l > 40 && Math.abs(p.l - level) <= 18 && /beer|dinner|coffee|walk/i.test(p.note))
        .map((p) => ({ n: p.n, phrase: /beer/i.test(p.note) ? "Grab a beer" : /coffee/i.test(p.note) ? "Grab a coffee" : "Meet up" }))
    );
    setTimeout(() => setSent(false), 1900);
  };

  if (!fontsLoaded) {
    return (
      <View style={{ flex: 1, backgroundColor: INK, alignItems: "center", justifyContent: "center" }}>
        <ActivityIndicator color={GOLD} />
      </View>
    );
  }

  return (
    <GestureHandlerRootView style={{ flex: 1 }}>
      <SafeAreaProvider>
        <StatusBar style="light" />
        {stage === "splash" && <SplashScreen />}

        {stage === "onboarding" && (
          <OnboardingScreen
            onFinish={(p) => {
              setProfile(p);
              setLevel(p.level);
              setMbti(p.mbti);
              if (p.members) setMembers(p.members);
              setStage("main");
            }}
          />
        )}

        {stage === "main" && (
          <View style={{ flex: 1 }}>
            <NavigationContainer theme={navTheme}>
              <Tab.Navigator tabBar={(props) => <PulseTabBar {...props} />} screenOptions={{ headerShown: false }}>
                <Tab.Screen name="you">
                  {() => (
                    <YouScreen
                      level={level} setLevel={setLevel} reason={reason} setReason={setReason}
                      sent={sent} sendPulse={sendPulse} matches={matches}
                      mbti={mbti} spotify={profile?.spotify} songs={profile?.songs || {}}
                      openQuiz={() => setQuiz(true)}
                      wantsChat={wantsChat} setWantsChat={setWantsChat}
                      myWindow={myWindow} setMyWindow={setMyWindow}
                      seenBy={seenBy} openSettings={() => setSettingsOpen(true)}
                      members={members} pulseTo={pulseTo} setPulseTo={setPulseTo}
                    />
                  )}
                </Tab.Screen>
                <Tab.Screen name="circle">
                  {() => (
                    <CircleScreen
                      ack={ack} setAck={setAck} members={members}
                      level={level} reason={reason} wantsChat={wantsChat} myWindow={myWindow}
                      openSettings={() => setSettingsOpen(true)}
                    />
                  )}
                </Tab.Screen>
                <Tab.Screen name="week">
                  {() => <WeekScreen mbti={mbti} />}
                </Tab.Screen>
              </Tab.Navigator>
            </NavigationContainer>

            {settingsOpen && (
              <SettingsScreen
                onClose={() => setSettingsOpen(false)}
                members={members} setMembers={setMembers}
                mbti={mbti} setMbti={setMbti} songs={profile?.songs || {}}
                morningTime={morningTime} setMorningTime={setMorningTime}
                theme={theme} setTheme={setTheme} level={level}
              />
            )}
            {burst > 0 && <PulseBurst key={burst} color={colorFor(level)} />}
            {morning && <MorningPrompt onPick={(v) => { setLevel(v); setMorning(false); }} onDismiss={() => setMorning(false)} />}
            {quiz && <VibeCheckModal onDone={(v) => { setLevel(v); setQuiz(false); }} onSkip={() => setQuiz(false)} />}
          </View>
        )}
      </SafeAreaProvider>
    </GestureHandlerRootView>
  );
}
