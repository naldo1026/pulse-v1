import React, { useEffect, useState } from "react";
import { View, Text, ActivityIndicator, Pressable } from "react-native";
import { StatusBar } from "expo-status-bar";
import { GestureHandlerRootView } from "react-native-gesture-handler";
import { SafeAreaProvider, useSafeAreaInsets } from "react-native-safe-area-context";
import { NavigationContainer, DefaultTheme, DarkTheme } from "@react-navigation/native";
import { createBottomTabNavigator } from "@react-navigation/bottom-tabs";
import { useFonts } from "expo-font";
// Per-weight imports: the package index pulls in every Roboto file, which
// the web export then ships.
import { Roboto_400Regular } from "@expo-google-fonts/roboto/400Regular";
import { Roboto_500Medium } from "@expo-google-fonts/roboto/500Medium";
import { Roboto_700Bold } from "@expo-google-fonts/roboto/700Bold";

import SplashScreen from "./screens/SplashScreen";
import OnboardingScreen from "./screens/OnboardingScreen";
import YouScreen from "./screens/YouScreen";
import CircleScreen from "./screens/CircleScreen";
import WeekScreen from "./screens/WeekScreen";
import SettingsScreen from "./screens/SettingsScreen";
import PulseBurst from "./components/PulseBurst";
import MorningPrompt from "./components/MorningPrompt";
import VibeCheckModal from "./components/VibeCheckModal";
import Icon from "./components/Icon";
import { useTheme, FONTS, T } from "./theme";
import { PEOPLE, setRamp } from "./lib/data";

const Tab = createBottomTabNavigator();

const TABS = { you: ["Me", "battery"], circle: ["Circle", "circle"], week: ["Week", "week"] };

function PulseTabBar({ state, navigation }) {
  const t = useTheme();
  const insets = useSafeAreaInsets();
  return (
    <View style={{ flexDirection: "row", paddingTop: 8, paddingBottom: insets.bottom + 6, backgroundColor: t.bg, borderTopWidth: 1, borderColor: t.line }}>
      {state.routes.map((route, index) => {
        const isFocused = state.index === index;
        const onPress = () => {
          const event = navigation.emit({ type: "tabPress", target: route.key, canPreventDefault: true });
          if (!isFocused && !event.defaultPrevented) navigation.navigate(route.name);
        };
        return (
          <Pressable key={route.key} onPress={onPress} style={{ flex: 1, alignItems: "center", paddingVertical: 4 }}>
            <Icon name={TABS[route.name][1]} size={22} strokeWidth={isFocused ? 1.9 : 1.6} color={isFocused ? t.ink : t.faint} />
            <Text style={{ fontFamily: FONTS.medium, fontSize: 11, marginTop: 3, color: isFocused ? t.ink : t.faint }}>{TABS[route.name][0]}</Text>
          </Pressable>
        );
      })}
    </View>
  );
}

export default function App() {
  const t = useTheme();
  const [fontsLoaded] = useFonts({
    Roboto_400Regular, Roboto_500Medium, Roboto_700Bold,
  });

  const [stage, setStage] = useState("splash");
  const [level, setLevel] = useState(35);
  const [reason, setReason] = useState("Long day");
  const [sent, setSent] = useState(false);
  const [matches, setMatches] = useState([]);
  const [ack, setAck] = useState({});
  const [quiz, setQuiz] = useState(false);
  const [morning, setMorning] = useState(false);
  const [mbti, setMbti] = useState(null);
  const [songs, setSongs] = useState({ low: "", mid: "", high: "" });
  const [spotify, setSpotify] = useState(false);
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
  const [theme, setTheme] = useState("dusk");
  // Apply immediately so this render already uses the right ramp, including
  // when the phone flips between light and dark.
  setRamp(theme, t.scheme);

  const navTheme = {
    ...(t.scheme === "dark" ? DarkTheme : DefaultTheme),
    colors: { ...(t.scheme === "dark" ? DarkTheme : DefaultTheme).colors, background: t.bg, card: t.bg, border: t.line, text: t.ink },
  };

  useEffect(() => {
    if (stage !== "splash") return;
    const timer = setTimeout(() => setStage("onboarding"), 1300);
    return () => clearTimeout(timer);
  }, [stage]);

  useEffect(() => {
    if (stage !== "main" || morningTime === "off") return;
    const timer = setTimeout(() => setMorning(true), 900);
    return () => clearTimeout(timer);
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
      <View style={{ flex: 1, backgroundColor: t.bg, alignItems: "center", justifyContent: "center" }}>
        <ActivityIndicator color={t.faint} />
      </View>
    );
  }

  return (
    <GestureHandlerRootView style={{ flex: 1 }}>
      <SafeAreaProvider>
        <StatusBar style="auto" />
        {stage === "splash" && <SplashScreen />}

        {stage === "onboarding" && (
          <OnboardingScreen
            onFinish={(p) => {
              setLevel(p.level);
              setMembers(p.members);
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
                  {() => <WeekScreen mbti={mbti} level={level} />}
                </Tab.Screen>
              </Tab.Navigator>
            </NavigationContainer>

            {settingsOpen && (
              <SettingsScreen
                onClose={() => setSettingsOpen(false)}
                members={members} setMembers={setMembers}
                mbti={mbti} setMbti={setMbti}
                songs={songs} setSongs={setSongs} spotify={spotify} setSpotify={setSpotify}
                morningTime={morningTime} setMorningTime={setMorningTime}
                theme={theme} setTheme={setTheme}
              />
            )}
            {burst > 0 && <PulseBurst key={burst} level={level} />}
            {morning && <MorningPrompt onPick={(v) => { setLevel(v); setMorning(false); }} onDismiss={() => setMorning(false)} />}
            {quiz && <VibeCheckModal onDone={(v) => { setLevel(v); setQuiz(false); }} onSkip={() => setQuiz(false)} />}
          </View>
        )}
      </SafeAreaProvider>
    </GestureHandlerRootView>
  );
}
