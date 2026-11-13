import React, { useCallback, useEffect, useMemo, useRef, useState } from "react";
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
import PeopleScreen from "./screens/PeopleScreen";
import UsernameScreen from "./screens/UsernameScreen";
import PulseBurst from "./components/PulseBurst";
import CheckInSheet from "./components/CheckInSheet";
import VibeCheckModal from "./components/VibeCheckModal";
import ReasonCard from "./components/ReasonCard";
import Icon from "./components/Icon";
import { Btn } from "./components/primitives";
import { useTheme, FONTS, T } from "./theme";
import { setRamp, colorFor } from "./lib/data";
import { prepare, newsKeys } from "./lib/insights";
import { loadSeen, saveSeen } from "./lib/seen";
import { supabase } from "./lib/supabase";
import * as api from "./lib/api";
import { pushPermission, enablePush, refreshPush, forgetDevice } from "./lib/push";
import { needsInstall, registerServiceWorker, takeLaunchParams, onNotificationOpen, onForeground } from "./lib/pwa";

const Tab = createBottomTabNavigator();

const TABS = { week: ["My Week", "week"], you: ["Me", "battery"], circle: ["Circle", "circle"] };

// Read at module load, once per page load, before anything can re-render.
const LAUNCH = takeLaunchParams();

// When a level change earns a "What made this change?" card.
const REASON_MIN_CHANGE = 10;
const REASON_EVERY_MS = 30 * 60 * 1000;

// Past this morning's check-in time, still before noon, and no level set
// since. Covers people who ignored the notification or don't have one.
const morningDue = (time, updatedAt) => {
  if (time === "off") return false;
  const [h, m] = time.split(":").map(Number);
  const at = new Date();
  at.setHours(h, m, 0, 0);
  return new Date() >= at && new Date().getHours() < 12 && new Date(updatedAt) < at;
};

// dots: tab names that have something new, e.g. { week: true }.
function PulseTabBar({ state, navigation, dots = {} }) {
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
            <View>
              <Icon name={TABS[route.name][1]} size={22} strokeWidth={isFocused ? 1.9 : 1.6} color={isFocused ? t.ink : t.faint} />
              {dots[route.name] && (
                <View
                  accessibilityLabel="Something new"
                  style={{ position: "absolute", top: -2, right: -5, width: 9, height: 9, borderRadius: 5, backgroundColor: colorFor(85), borderWidth: 1.5, borderColor: t.bg }}
                />
              )}
            </View>
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
  // Requests waiting either way: api.myRequests().
  const [requests, setRequests] = useState([]);
  const [toMe, setToMe] = useState({});
  const [myPulse, setMyPulse] = useState(null);
  // loadHistory's 56 days for My Week, or null until the first load.
  const [history, setHistory] = useState(null);
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
  // A "wants to add you" notification opens straight onto Add people.
  const [peopleOpen, setPeopleOpen] = useState(!!LAUNCH.requests);
  const [morningTime, setMorningTime] = useState("07:40");
  const [theme, setTheme] = useState("dusk");
  const [phone, setPhone] = useState("");
  // { date, questions } once a level's been set and today's check-in is still to do.
  const [checkIn, setCheckIn] = useState(null);
  const [dragging, setDragging] = useState(false);
  const [pickingDoodle, setPickingDoodle] = useState(false);
  // The level change the card is asking about: lastLevelChange's result, plus
  // shownAt once it's actually on screen.
  const [reasonPrompt, setReasonPrompt] = useState(null);
  // The level last saved, to tell a real change from saving the same level again.
  const savedLevel = useRef(null);
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
      savedLevel.current = p.level;
      setLevel(p.level);
      setReason(p.reason);
      setWantsChat(p.wants_chat);
      setMyWindow(api.aroundFor(p.around, p.around_until) ? p.around : null);
      setMbti(s.mbti);
      setSongs({ low: "", mid: "", high: "", ...s.songs });
      setSpotify(s.spotify);
      setMorningTime(s.morning_time);
      setTheme(s.theme);
      setPhone(p.phone || "");
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

  // Your circle, requests, pulses, seen marks and the week. Small enough to
  // refetch whole whenever anything changes or the app comes back to the front.
  const refresh = useCallback(async () => {
    if (!uid) return;
    try {
      const [ps, asks, mine, incoming, past] = await Promise.all([
        api.loadPeople(uid), api.myRequests(), api.myLatestPulse(uid), api.pulsesToMe(uid), api.loadHistory(uid),
      ]);
      setPeople(ps);
      setRequests(asks);
      setMyPulse(mine);
      setToMe(incoming);
      setHistory(past);
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

  // The local date we know today's check-in is saved for, so setting a level
  // again doesn't ask the database every time.
  const checkedInOn = useRef(null);
  // Fetched when the morning prompt opens, so picking a level can go straight
  // into the questions in the same sheet.
  const morningCheckIn = useRef(null);
  const reasonShownAt = useRef(0);
  const reasonWrites = useRef(Promise.resolve());
  useEffect(() => {
    checkedInOn.current = null;
    setCheckIn(null);
    setHistory(null);
    setPeople([]);
    setRequests([]);
    reasonShownAt.current = 0;
    setReasonPrompt(null);
  }, [uid]);

  // Today's check-in if it's still to do, otherwise null. If this fails, the
  // next level set tries again: a prompt must never get in the way of a level.
  const fetchCheckIn = async () => {
    const date = api.localDate();
    if (checkedInOn.current === date) return null;
    try {
      const [done, questions] = await Promise.all([api.checkedIn(uid, date), api.todaysQuestions(date)]);
      if (done) checkedInOn.current = date;
      // Checked again because it may have been finished during the fetch.
      return checkedInOn.current === date || !questions.length ? null : { date, questions };
    } catch {
      return null;
    }
  };
  // Resolves with whether the check-in is going to ask.
  const askCheckIn = async () => {
    const found = await fetchCheckIn();
    if (found) setCheckIn((c) => c || found);
    return !!found;
  };
  const saveCheckIn = (status, answers) => {
    checkedInOn.current = checkIn.date;
    api.saveCheckIn({ status, answers, date: checkIn.date }).catch(() => {});
  };
  const closeCheckIn = () => {
    setCheckIn(null);
    setMorning(false);
  };

  // Queues the card if this level change is worth asking about. The database
  // has the last time it showed, so a reload can't get round the 30 minutes.
  const askReason = async () => {
    if (Date.now() - reasonShownAt.current < REASON_EVERY_MS) return;
    try {
      const [change, lastAt] = await Promise.all([api.lastLevelChange(uid), api.lastReasonAt(uid)]);
      if (!change || Math.abs(change.after - change.before) < REASON_MIN_CHANGE) return;
      // The level before this one is from an earlier day, so this is today's first.
      if (api.localDate(new Date(change.prevAt)) !== api.localDate()) return;
      if (lastAt && Date.now() - lastAt < REASON_EVERY_MS) return;
      setReasonPrompt((p) => p || change);
    } catch {
      // Never mind. It only ever asks about the change just made.
    }
  };
  // Only one prompt at a time, and the check-in goes first.
  const afterLevelSaved = async (changed) => {
    if (!(await askCheckIn()) && changed) askReason();
  };
  // In order, so an answer can't arrive before the row it updates.
  const writeReason = (prompt, reason = null, source = null) => {
    reasonWrites.current = reasonWrites.current
      .then(() => api.saveChangeReason(uid, { ...prompt, reason, source }))
      .catch(() => {});
  };
  const answerReason = (reason, source) => {
    writeReason(reasonPrompt, reason, source);
    setReasonPrompt(null);
  };
  // Repeats the row written when it showed, in case that write failed.
  const skipReason = () => {
    writeReason(reasonPrompt);
    setReasonPrompt(null);
  };

  // Dragging fires on every percent, so only save once the drag settles.
  const levelTimer = useRef(null);
  const saveLevel = (v) => {
    levelTimer.current = null;
    const changed = v !== savedLevel.current;
    savedLevel.current = v;
    if (uid) api.saveProfile(uid, { level: v }).then(() => afterLevelSaved(changed), () => {});
  };
  const changeLevel = (v) => {
    setLevel(v);
    clearTimeout(levelTimer.current);
    levelTimer.current = setTimeout(() => saveLevel(v), 1500);
  };
  const setLevelNow = (v) => {
    clearTimeout(levelTimer.current);
    setLevel(v);
    saveLevel(v);
  };
  const pickMorningLevel = (v) => {
    setLevelNow(v);
    if (morningCheckIn.current) setCheckIn(morningCheckIn.current);
    setMorning(false);
  };
  const changeReason = (r) => { setReason(r); persist({ reason: r }); };
  const changeWantsChat = (v) => { setWantsChat(v); persist({ wants_chat: v }); };
  const changeWindow = (w) => { setMyWindow(w); persist({ around: w, around_until: w ? api.untilFor(w) : null }); };
  const changeName = (n) => { setMe((m) => ({ ...m, display_name: n })); persist({ display_name: n }); };
  const changePhone = (digits) => { setPhone(digits); persist({ phone: digits || null }); };
  const changeSetting = (set, key) => (v) => { set(v); persistSettings({ [key]: v }); };
  const changeGroup = (id, g) => {
    setPeople((ps) => ps.map((p) => (p.id === id ? { ...p, g } : p)));
    api.setGroup(uid, id, g).catch(() => {});
  };
  // Off the screen straight away. If it fails, the refetch brings them back.
  const removePerson = (id) => {
    setPeople((ps) => ps.filter((p) => p.id !== id));
    api.removeFromCircle(id).catch(() => {}).finally(refresh);
  };
  // Resolves with null once saved, or what's wrong. extra goes along with it,
  // like the name during onboarding.
  const saveUsername = async (u, extra = {}) => {
    try {
      const problem = await api.saveUsername(uid, u, extra);
      if (!problem) setMe((m) => ({ ...m, ...extra, username: u }));
      return problem;
    } catch {
      return "Couldn't save that. Check your connection and try again.";
    }
  };
  const openPeople = () => {
    setSettingsOpen(false);
    setPeopleOpen(true);
  };
  const changeDoodle = (id, d) => {
    const p = people.find((x) => x.id === id);
    setPeople((ps) => ps.map((x) => (x.id === id ? { ...x, d } : x)));
    api.setDoodle(uid, id, p.g, d).catch(() => {});
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

  // ------------------------------------------------ what's new on My Week

  // The tab the navigator's on.
  const [route, setRoute] = useState(focus ? "circle" : "you");
  const news = useMemo(() => (history ? newsKeys(prepare({ ...history, mbti })) : null), [history, mbti]);
  // What My Week last showed on this device: { week, keys }.
  const [seen, setSeen] = useState(null);
  // Keys that are new on this visit to My Week. Cleared on leaving, so each
  // "New" tag shows once.
  const [freshKeys, setFreshKeys] = useState([]);
  useEffect(() => {
    setSeen(uid ? loadSeen(uid) : null);
    setFreshKeys([]);
  }, [uid]);
  useEffect(() => {
    if (!news || !uid) return;
    const onWeek = route === "week";
    // Elsewhere, only the very first run on a device saves: it starts from
    // what's there now, so a new phone doesn't light up with old news.
    if (!onWeek && seen) return;
    const all = news.keys.map((k) => k.key);
    if (onWeek && seen) {
      const old = new Set(seen.keys);
      const add = all.filter((k) => !old.has(k));
      if (add.length) setFreshKeys((f) => [...new Set([...f, ...add])]);
    }
    if (seen && seen.week === news.week && all.every((k) => seen.keys.includes(k))) return;
    const next = { week: news.week, keys: all };
    saveSeen(uid, next);
    setSeen(next);
  }, [news, route, uid, seen]);
  useEffect(() => {
    if (route !== "week") setFreshKeys([]);
  }, [route]);
  // Something unlocked, a record, a win or a change, or a new week, since My
  // Week was last opened.
  const weekDot = route !== "week" && !!news && !!seen
    && (seen.week !== news.week || news.keys.some((k) => !seen.keys.includes(k.key)));
  const freshCards = useMemo(
    () => new Set((news?.keys || []).filter((k) => freshKeys.includes(k.key)).map((k) => k.card)),
    [news, freshKeys],
  );

  const main = !!me?.onboarded;
  useEffect(() => {
    if (!main || (!LAUNCH.morning && !morningDue(morningTime, me.level_updated_at))) return;
    const timer = setTimeout(() => setMorning(true), 900);
    return () => clearTimeout(timer);
  }, [main]);

  useEffect(() => {
    morningCheckIn.current = null;
    if (morning) fetchCheckIn().then((c) => { morningCheckIn.current = c; });
  }, [morning]);

  // A card left up is about a change that's no longer "just now" by the time
  // you're back. It's already saved as a skip, so it can just go.
  useEffect(() => onForeground(() => setReasonPrompt(null)), []);

  // Monday's morning push opens the check-in, then My Week. Once the morning
  // prompt has been up and both it and the check-in are gone, go there.
  const weekAfterMorning = useRef(!!LAUNCH.week);
  const morningShown = useRef(false);
  useEffect(() => {
    if (morning) morningShown.current = true;
    else if (morningShown.current && !checkIn && weekAfterMorning.current && nav.isReady()) {
      weekAfterMorning.current = false;
      morningShown.current = false;
      nav.navigate("week");
    }
  }, [morning, checkIn]);

  // Notification taps while the app is open.
  useEffect(() => onNotificationOpen(({ person, morning: m, week, requests: asked }) => {
    if (m) {
      weekAfterMorning.current = week;
      setMorning(true);
    }
    if (asked) openPeople();
    if (person) {
      setSettingsOpen(false);
      setFocus({ id: person });
      if (nav.isReady()) nav.navigate("circle");
    }
  }), []);

  // Re-render when the hour's up so the send button comes back.
  const nextSendAt = api.nextSendFor(myPulse);
  const [, setTick] = useState(0);
  useEffect(() => {
    const wait = nextSendAt - Date.now();
    if (!(wait > 0)) return;
    const timer = setTimeout(() => setTick((n) => n + 1), wait + 500);
    return () => clearTimeout(timer);
  }, [+nextSendAt]);

  const sendPulse = async () => {
    setSent(true);
    setSendError(false);
    setBurst((b) => b + 1);
    setTimeout(() => setSent(false), 1900);
    setMatches(people.filter((p) => p.l > 40 && Math.abs(p.l - level) <= 18 && p.extra).map((p) => ({ id: p.id, n: p.n, phrase: "Meet up" })));
    const dragged = levelTimer.current !== null;
    clearTimeout(levelTimer.current);
    levelTimer.current = null;
    const changed = level !== savedLevel.current;
    savedLevel.current = level;
    try {
      // Save the level first so the notification describes where you are now.
      await api.saveProfile(uid, { level });
      if (dragged) afterLevelSaved(changed);
      const id = await api.sendPulse({ level, reason: level <= 40 ? reason : null, groups: pulseTo });
      setMyPulse({ id, at: new Date().toISOString(), seen: [] });
    } catch (e) {
      // Already sent one this hour (another device, say): pick it up so the
      // button shows when you can send again.
      if (String(e?.message).includes("one pulse an hour")) refresh();
      else setSendError(true);
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

  // Prompts wait for the burst, any other sheet and a finger on the battery.
  // The burst is over well before `sent` clears.
  const promptWaits = sent || quiz || settingsOpen || peopleOpen || pickingDoodle || dragging;
  const askingMorning = morning && !checkIn;
  const reasonHidden = promptWaits || morning || !!checkIn;

  // One row per prompt, written as soon as it's on screen. Closing the app
  // then counts as a skip, and the 30 minutes runs from here.
  useEffect(() => {
    if (!reasonPrompt || reasonPrompt.shownAt || reasonHidden) return;
    const shown = { ...reasonPrompt, shownAt: new Date().toISOString() };
    reasonShownAt.current = Date.now();
    setReasonPrompt(shown);
    writeReason(shown);
  }, [reasonPrompt, reasonHidden]);

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
        initialName={me.display_name} initialUsername={me.username} saveUsername={saveUsername}
        requests={requests} onPeopleChanged={refresh}
        pushPerm={pushPerm} enablePush={turnOnPush}
        onFinish={({ name, level: l }) => {
          setLevel(l);
          setMe((m) => ({ ...m, display_name: name, onboarded: true, level_updated_at: new Date().toISOString() }));
          savedLevel.current = l;
          persist({ display_name: name, level: l, onboarded: true });
        }}
      />
    );
  } else if (!me.username) {
    screen = <UsernameScreen name={me.display_name} saveUsername={saveUsername} />;
  } else {
    const asking = requests.filter((r) => r.incoming).map((r) => r.n);
    screen = (
      <View style={{ flex: 1 }}>
        <NavigationContainer ref={nav} theme={navTheme} onStateChange={(s) => s && setRoute(s.routes[s.index].name)}>
          <Tab.Navigator initialRouteName={focus ? "circle" : "you"} tabBar={(props) => <PulseTabBar {...props} dots={{ week: weekDot, circle: route !== "circle" && asking.length > 0 }} />} screenOptions={{ headerShown: false }}>
            <Tab.Screen name="week">
              {() => <WeekScreen level={level} history={history} mbti={mbti} freshCards={freshCards} />}
            </Tab.Screen>
            <Tab.Screen name="you">
              {() => (
                <YouScreen
                  level={level} setLevel={changeLevel} reason={reason} setReason={changeReason}
                  sent={sent} sendPulse={sendPulse} sendError={sendError} nextSendAt={nextSendAt} matches={matches} nudge={nudge}
                  openQuiz={() => setQuiz(true)} onDragging={setDragging} reasonOpen={!!reasonPrompt}
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
                  people={people} pulses={toMe} markSeen={markSeen} nudge={nudge} setDoodle={changeDoodle} focus={focus}
                  level={level} reason={reason} wantsChat={wantsChat} myWindow={myWindow}
                  openSettings={() => setSettingsOpen(true)} openPeople={openPeople} asking={asking} onPicking={setPickingDoodle}
                />
              )}
            </Tab.Screen>
          </Tab.Navigator>
        </NavigationContainer>

        {settingsOpen && (
          <SettingsScreen
            onClose={() => setSettingsOpen(false)}
            name={me.display_name} setName={changeName}
            username={me.username} saveUsername={saveUsername}
            phone={phone} setPhone={changePhone}
            people={people} setGroup={changeGroup} removePerson={removePerson} openPeople={openPeople}
            mbti={mbti} setMbti={changeSetting(setMbti, "mbti")}
            songs={songs} setSongs={changeSetting(setSongs, "songs")}
            spotify={spotify} setSpotify={changeSetting(setSpotify, "spotify")}
            morningTime={morningTime} setMorningTime={changeSetting(setMorningTime, "morning_time")}
            theme={theme} setTheme={changeSetting(setTheme, "theme")}
            pushPerm={pushPerm} enablePush={turnOnPush} changePassword={changePassword} signOut={signOut}
          />
        )}
        {peopleOpen && (
          <PeopleScreen onClose={() => setPeopleOpen(false)} username={me.username} requests={requests} onChanged={refresh} />
        )}
        {reasonPrompt && (
          <ReasonCard
            before={reasonPrompt.before} after={reasonPrompt.after} hidden={reasonHidden}
            onAnswer={answerReason} onSkip={skipReason}
          />
        )}
        {burst > 0 && <PulseBurst key={burst} level={level} />}
        {(askingMorning || (checkIn && !promptWaits)) && (
          <CheckInSheet
            morning={askingMorning} checkIn={checkIn}
            onPick={pickMorningLevel} onLater={() => setMorning(false)}
            onSave={saveCheckIn} onClose={closeCheckIn}
          />
        )}
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
