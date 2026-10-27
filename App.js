import React, { useCallback, useEffect, useRef, useState } from "react";
import { View, Text, ActivityIndicator, Pressable } from "react-native";
import { StatusBar } from "expo-status-bar";
import { GestureHandlerRootView } from "react-native-gesture-handler";
import { SafeAreaProvider, useSafeAreaInsets } from "react-native-safe-area-context";
import { NavigationContainer, DefaultTheme, DarkTheme, useNavigationContainerRef } from "@react-navigation/native";
import { createBottomTabNavigator } from "@react-navigation/bottom-tabs";
import { useFonts } from "expo-font";
// Per-weight imports: the package index pulls in every Roboto file, which
// the web export then ships.
import { Roboto_400Regular } from "@expo-google-fonts/roboto/400Regular";
import { Roboto_500Medium } from "@expo-google-fonts/roboto/500Medium";
import { Roboto_700Bold } from "@expo-google-fonts/roboto/700Bold";

import SplashScreen from "./screens/SplashScreen";
import InstallScreen from "./screens/InstallScreen";
import SignInScreen from "./screens/SignInScreen";
import OnboardingScreen from "./screens/OnboardingScreen";
import YouScreen from "./screens/YouScreen";
import CircleScreen from "./screens/CircleScreen";
import WeekScreen from "./screens/WeekScreen";
import SettingsScreen from "./screens/SettingsScreen";
import PulseBurst from "./components/PulseBurst";
import MorningPrompt from "./components/MorningPrompt";
import VibeCheckModal from "./components/VibeCheckModal";
import Icon from "./components/Icon";
import { Btn } from "./components/primitives";
import { useTheme, FONTS, T } from "./theme";
import { setRamp } from "./lib/data";
import { supabase } from "./lib/supabase";
import * as api from "./lib/api";
import { pushPermission, enablePush, refreshPush, forgetDevice } from "./lib/push";
import { needsInstall, registerServiceWorker, takeLaunchParams, onNotificationOpen, onForeground } from "./lib/pwa";

const Tab = createBottomTabNavigator();

const TABS = { you: ["Me", "battery"], circle: ["Circle", "circle"], week: ["Week", "week"] };

// Read at module load, once per page load, before anything can re-render.
const LAUNCH = takeLaunchParams();

// Past this morning's check-in time, still before noon, and no level set
// since. Covers people who ignored the notification or don't have one.
const morningDue = (time, updatedAt) => {
  if (time === "off") return false;
  const [h, m] = time.split(":").map(Number);
  const at = new Date();
  at.setHours(h, m, 0, 0);
  return new Date() >= at && new Date().getHours() < 12 && new Date(updatedAt) < at;
};

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
  const nav = useNavigationContainerRef();

  // undefined while we check storage for a session, then a session or null.
  const [session, setSession] = useState(undefined);
  const [me, setMe] = useState(null);
  const [failed, setFailed] = useState(false);
  const [splashDone, setSplashDone] = useState(false);
  const uid = session?.user.id;

  const [people, setPeople] = useState([]);
  const [toMe, setToMe] = useState({});
  const [myPulse, setMyPulse] = useState(null);
  const [log, setLog] = useState([]);
  const [pushPerm, setPushPerm] = useState(pushPermission());
  const [focus, setFocus] = useState(LAUNCH.person ? { id: LAUNCH.person } : null);

  const [level, setLevel] = useState(50);
  const [reason, setReason] = useState(null);
  const [sent, setSent] = useState(false);
  const [sendError, setSendError] = useState(false);
  const [matches, setMatches] = useState([]);
  const [quiz, setQuiz] = useState(false);
  const [morning, setMorning] = useState(false);
  const [mbti, setMbti] = useState(null);
  const [songs, setSongs] = useState({ low: "", mid: "", high: "" });
  const [spotify, setSpotify] = useState(false);
  const [burst, setBurst] = useState(0);
  const [wantsChat, setWantsChat] = useState(false);
  const [myWindow, setMyWindow] = useState(null);
  const [pulseTo, setPulseTo] = useState(["household", "family", "friends"]);
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
    registerServiceWorker();
    const timer = setTimeout(() => setSplashDone(true), 1300);
    supabase.auth.getSession().then(({ data }) => setSession(data.session));
    const { data } = supabase.auth.onAuthStateChange((_e, s) => setSession(s));
    return () => {
      clearTimeout(timer);
      data.subscription.unsubscribe();
    };
  }, []);

  const hydrate = useCallback(() => {
    setFailed(false);
    api.loadMe(uid).then(({ profile: p, settings: s }) => {
      setLevel(p.level);
      setReason(p.reason);
      setWantsChat(p.wants_chat);
      setMyWindow(api.aroundFor(p.around, p.around_until) ? p.around : null);
      setMbti(s.mbti);
      setSongs({ low: "", mid: "", high: "", ...s.songs });
      setSpotify(s.spotify);
      setMorningTime(s.morning_time);
      setTheme(s.theme);
      const tz = Intl.DateTimeFormat().resolvedOptions().timeZone;
      if (tz && tz !== s.timezone) api.saveSettings(uid, { timezone: tz }).catch(() => {});
      setMe(p);
      refreshPush(uid);
    }).catch(() => setFailed(true));
  }, [uid]);

  useEffect(() => {
    if (uid) hydrate();
    else setMe(null);
  }, [uid]);

  // Everyone else, pulses, seen marks and the week. Small enough to refetch
  // whole whenever anything changes or the app comes back to the front.
  const refresh = useCallback(async () => {
    if (!uid) return;
    try {
      const [ps, mine, incoming, week] = await Promise.all([api.loadPeople(uid), api.myLatestPulse(uid), api.pulsesToMe(uid), api.weekLog(uid)]);
      setPeople(ps);
      setMyPulse(mine);
      setToMe(incoming);
      setLog(week);
    } catch {
      // Keep what's on screen. The next change or foreground tries again.
    }
  }, [uid]);

  const signedIn = !!me;
  useEffect(() => {
    if (!signedIn) return;
    refresh();
    let timer;
    const soon = () => {
      clearTimeout(timer);
      timer = setTimeout(refresh, 300);
    };
    const stopWatch = api.watch(soon);
    const stopForeground = onForeground(soon);
    return () => {
      clearTimeout(timer);
      stopWatch();
      stopForeground();
    };
  }, [signedIn, refresh]);

  // Writes are fire-and-forget. Realtime and the foreground refetch keep the
  // screen honest if one fails.
  const persist = (patch) => uid && api.saveProfile(uid, patch).catch(() => {});
  const persistSettings = (patch) => uid && api.saveSettings(uid, patch).catch(() => {});

  // Dragging fires on every percent, so only save once the drag settles.
  const levelTimer = useRef();
  const changeLevel = (v) => {
    setLevel(v);
    clearTimeout(levelTimer.current);
    levelTimer.current = setTimeout(() => persist({ level: v }), 1500);
  };
  const setLevelNow = (v) => {
    clearTimeout(levelTimer.current);
    setLevel(v);
    persist({ level: v });
  };
  const changeReason = (r) => { setReason(r); persist({ reason: r }); };
  const changeWantsChat = (v) => { setWantsChat(v); persist({ wants_chat: v }); };
  const changeWindow = (w) => { setMyWindow(w); persist({ around: w, around_until: w ? api.untilFor(w) : null }); };
  const changeName = (n) => { setMe((m) => ({ ...m, display_name: n })); persist({ display_name: n }); };
  const changeSetting = (set, key) => (v) => { set(v); persistSettings({ [key]: v }); };
  const changeGroup = (id, g) => {
    setPeople((ps) => ps.map((p) => (p.id === id ? { ...p, g } : p)));
    api.setGroup(uid, id, g).catch(() => {});
  };
  const turnOnPush = () => enablePush(uid).then(setPushPerm, () => setPushPerm(pushPermission()));
  const nudge = (id, kind) => api.nudge(id, kind).catch(() => {});
  const markSeen = (personId) => {
    const p = toMe[personId];
    if (!p || p.seen) return;
    setToMe((m) => ({ ...m, [personId]: { ...p, seen: true } }));
    api.markSeen(p.id).catch(() => {});
  };

  useEffect(() => {
    if (level > 40 && wantsChat) changeWantsChat(false);
    if (level <= 60 && myWindow) changeWindow(null);
  }, [level]);

  const main = !!me?.onboarded;
  useEffect(() => {
    if (!main || (!LAUNCH.morning && !morningDue(morningTime, me.level_updated_at))) return;
    const timer = setTimeout(() => setMorning(true), 900);
    return () => clearTimeout(timer);
  }, [main]);

  // Notification taps while the app is open.
  useEffect(() => onNotificationOpen(({ person, morning: m }) => {
    if (m) setMorning(true);
    if (person) {
      setSettingsOpen(false);
      setFocus({ id: person });
      if (nav.isReady()) nav.navigate("circle");
    }
  }), []);

  const sendPulse = async () => {
    setSent(true);
    setSendError(false);
    setBurst((b) => b + 1);
    setTimeout(() => setSent(false), 1900);
    setMatches(people.filter((p) => p.l > 40 && Math.abs(p.l - level) <= 18 && p.extra).map((p) => ({ id: p.id, n: p.n, phrase: "Meet up" })));
    clearTimeout(levelTimer.current);
    try {
      // Save the level first so the notification describes where you are now.
      await api.saveProfile(uid, { level });
      const id = await api.sendPulse({ level, reason: level <= 40 ? reason : null, groups: pulseTo });
      setMyPulse({ id, seen: [] });
    } catch {
      setSendError(true);
    }
  };

  // Resolves with an error message, or null once it's saved.
  const changePassword = async (password) => (await supabase.auth.updateUser({ password })).error?.message ?? null;

  const signOut = async () => {
    setSettingsOpen(false);
    await forgetDevice().catch(() => {});
    await supabase.auth.signOut();
  };

  const seenBy = (myPulse?.seen || []).map((id) => people.find((p) => p.id === id)?.n).filter(Boolean);

  if (!fontsLoaded) {
    return (
      <View style={{ flex: 1, backgroundColor: t.bg, alignItems: "center", justifyContent: "center" }}>
        <ActivityIndicator color={t.faint} />
      </View>
    );
  }

  let screen;
  if (needsInstall) screen = <InstallScreen />;
  else if (failed) {
    screen = (
      <View style={{ flex: 1, backgroundColor: t.bg, alignItems: "center", justifyContent: "center", padding: 24 }}>
        <Text style={{ fontFamily: FONTS.sans, fontSize: T.body, color: t.muted, marginBottom: 16 }}>Couldn't reach Pulse.</Text>
        <Btn variant="secondary" onPress={hydrate}>Try again</Btn>
      </View>
    );
  } else if (!splashDone || session === undefined || (session && !me)) screen = <SplashScreen />;
  else if (!session) screen = <SignInScreen />;
  else if (!main) {
    screen = (
      <OnboardingScreen
        initialName={me.display_name}
        people={people} setGroup={changeGroup}
        pushPerm={pushPerm} enablePush={turnOnPush}
        onFinish={({ name, level: l }) => {
          setLevel(l);
          setMe((m) => ({ ...m, display_name: name, onboarded: true, level_updated_at: new Date().toISOString() }));
          persist({ display_name: name, level: l, onboarded: true });
        }}
      />
    );
  } else {
    screen = (
      <View style={{ flex: 1 }}>
        <NavigationContainer ref={nav} theme={navTheme}>
          <Tab.Navigator initialRouteName={focus ? "circle" : "you"} tabBar={(props) => <PulseTabBar {...props} />} screenOptions={{ headerShown: false }}>
            <Tab.Screen name="you">
              {() => (
                <YouScreen
                  level={level} setLevel={changeLevel} reason={reason} setReason={changeReason}
                  sent={sent} sendPulse={sendPulse} sendError={sendError} matches={matches} nudge={nudge}
                  openQuiz={() => setQuiz(true)}
                  wantsChat={wantsChat} setWantsChat={changeWantsChat}
                  myWindow={myWindow} setMyWindow={changeWindow}
                  seenBy={seenBy} openSettings={() => setSettingsOpen(true)}
                  members={people} pulseTo={pulseTo} setPulseTo={setPulseTo}
                />
              )}
            </Tab.Screen>
            <Tab.Screen name="circle">
              {() => (
                <CircleScreen
                  people={people} pulses={toMe} markSeen={markSeen} nudge={nudge} focus={focus}
                  level={level} reason={reason} wantsChat={wantsChat} myWindow={myWindow}
                  openSettings={() => setSettingsOpen(true)}
                />
              )}
            </Tab.Screen>
            <Tab.Screen name="week">
              {() => <WeekScreen mbti={mbti} level={level} log={log} />}
            </Tab.Screen>
          </Tab.Navigator>
        </NavigationContainer>

        {settingsOpen && (
          <SettingsScreen
            onClose={() => setSettingsOpen(false)}
            name={me.display_name} setName={changeName}
            people={people} setGroup={changeGroup}
            mbti={mbti} setMbti={changeSetting(setMbti, "mbti")}
            songs={songs} setSongs={changeSetting(setSongs, "songs")}
            spotify={spotify} setSpotify={changeSetting(setSpotify, "spotify")}
            morningTime={morningTime} setMorningTime={changeSetting(setMorningTime, "morning_time")}
            theme={theme} setTheme={changeSetting(setTheme, "theme")}
            pushPerm={pushPerm} enablePush={turnOnPush} changePassword={changePassword} signOut={signOut}
          />
        )}
        {burst > 0 && <PulseBurst key={burst} level={level} />}
        {morning && <MorningPrompt onPick={(v) => { setLevelNow(v); setMorning(false); }} onDismiss={() => setMorning(false)} />}
        {quiz && <VibeCheckModal onDone={(v) => { setLevelNow(v); setQuiz(false); }} onSkip={() => setQuiz(false)} />}
      </View>
    );
  }

  return (
    <GestureHandlerRootView style={{ flex: 1 }}>
      <SafeAreaProvider>
        <StatusBar style="auto" />
        {screen}
      </SafeAreaProvider>
    </GestureHandlerRootView>
  );
}
