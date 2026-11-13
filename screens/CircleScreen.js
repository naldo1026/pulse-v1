import React, { useEffect, useRef, useState } from "react";
import { View, Text, ScrollView, Pressable, Dimensions, Linking } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useTheme, FONTS, T } from "../theme";
import { GROUPS, statusFor, colorFor } from "../lib/data";
import { noteFor } from "../lib/api";
import { Btn, Panel, Display, Segmented } from "../components/primitives";
import Orb from "../components/Orb";
import DoodlePicker from "../components/DoodlePicker";
import Icon from "../components/Icon";
import LightStreak from "../components/LightStreak";

const RING = 104;
// Past this many, a group reads better as a list than a ring.
const RING_MAX = 5;
const ROW_ORB = 40;

const moodOf = (avg) => (avg <= 35 ? "mostly quiet" : avg >= 70 ? "plenty of energy" : "a mixed bag");

// Opens WhatsApp with the message typed out. Without a number, WhatsApp
// asks who to send it to.
const openWhatsApp = (ph, text) => Linking.openURL(`https://wa.me/${ph || ""}?text=${encodeURIComponent(text)}`);

// One person's details and what you can do about them. pulse: { id, seen }
// if they sent you one today. joined: "in" | "maybe" | undefined.
// onHeaderPress lets the list collapse it again.
function PersonPanel({ p, pulse, markSeen, joined, join, pickDoodle, onHeaderPress, style }) {
  const t = useTheme();
  return (
    <Panel style={style}>
      <Pressable onPress={onHeaderPress} disabled={!onHeaderPress} style={{ flexDirection: "row", alignItems: "flex-start" }}>
        <View style={{ flex: 1 }}>
          <Display size={24}>{p.n}</Display>
          <Text style={{ fontFamily: FONTS.sans, fontSize: T.body, color: t.muted, marginTop: 2 }}>{p.note}</Text>
        </View>
        <View style={{ alignItems: "flex-end", paddingTop: 4 }}>
          <Text style={{ fontFamily: FONTS.medium, fontSize: T.body, color: t.ink }}>{statusFor(p.l).t}</Text>
          <Text style={{ fontFamily: FONTS.sans, fontSize: T.caption, color: t.faint, marginTop: 2 }}>{p.ago}</Text>
        </View>
      </Pressable>

      {p.l <= 40 && p.chat && (
        <Btn
          variant="secondary"
          onPress={() => openWhatsApp(p.ph, "Hey, saw you're low and up for a chat. Everything good?")}
          style={{ marginTop: 16, paddingVertical: 11 }}
        >
          Message on WhatsApp
        </Btn>
      )}

      {p.extra && (
        <View style={{ marginTop: 16, paddingTop: 16, borderTopWidth: 1, borderColor: t.line }}>
          <Text style={{ fontFamily: FONTS.sans, fontSize: T.body, color: t.ink }}>{p.n} is {p.extra}.</Text>
          <View style={{ flexDirection: "row", gap: 8, marginTop: 12 }}>
            <Btn
              variant={joined === "in" ? "secondary" : "primary"}
              onPress={() => join(p.id, "in")}
              style={{ flex: 2, paddingVertical: 11 }}
            >
              {joined === "in" ? "You're in" : "I'm in"}
            </Btn>
            <Btn variant={joined === "maybe" ? "secondary" : "ghost"} onPress={() => join(p.id, "maybe")} style={{ flex: 1, paddingVertical: 11 }}>
              Maybe
            </Btn>
          </View>
          <Btn
            variant="secondary"
            onPress={() => openWhatsApp(p.ph, `Hey, saw you're ${p.extra}. Fancy meeting up?`)}
            style={{ marginTop: 8, paddingVertical: 11 }}
          >
            Message on WhatsApp
          </Btn>
        </View>
      )}

      {pulse && (
        <Pressable
          onPress={() => markSeen(p.id)}
          disabled={pulse.seen}
          style={{ flexDirection: "row", alignItems: "center", justifyContent: "center", gap: 6, marginTop: 16, paddingVertical: 11, borderRadius: 100, borderWidth: 1, borderColor: t.lineStrong }}
        >
          {pulse.seen && <Icon name="check" size={16} color={t.ink} />}
          <Text style={{ fontFamily: FONTS.medium, fontSize: T.body, color: pulse.seen ? t.ink : t.muted }}>{pulse.seen ? "Seen" : "Mark as seen"}</Text>
        </Pressable>
      )}

      <Btn variant="ghost" onPress={() => pickDoodle(p.id)} style={{ marginTop: 8, paddingVertical: 11 }}>
        {p.d ? "Change doodle" : "Choose a doodle"}
      </Btn>
    </Panel>
  );
}

// pulses: sender id -> { id, seen } for pulses sent to you today.
// joined: person id -> "in" | "maybe".
// nobody: your whole circle is empty, not just this group.
function CirclePage({ people, me, pulses, markSeen, joined, join, pickDoodle, focus, openSettings, openPeople, nobody, width }) {
  const t = useTheme();
  const [sel, setSel] = useState(null);
  const chosen = sel ? people.find((p) => p.id === sel) : null;
  const toggle = (id) => setSel(sel === id ? null : id);
  const panelFor = (p, props) => (
    <PersonPanel p={p} pulse={pulses[p.id]} markSeen={markSeen} joined={joined[p.id]} join={join} pickDoodle={pickDoodle} {...props} />
  );

  useEffect(() => {
    if (focus && people.some((p) => p.id === focus.id)) setSel(focus.id);
  }, [focus]);
  const avg = people.length ? Math.round(people.reduce((a, p) => a + p.l, 0) / people.length) : 0;

  const summary = (
    <Text style={{ fontFamily: FONTS.sans, fontSize: T.small, color: t.muted, textAlign: "center" }}>
      {people.length ? `${people.length} ${people.length === 1 ? "person" : "people"} · ${moodOf(avg)}` : "Nobody here yet"}
    </Text>
  );

  // A list: tapping a row opens it in place, so the panel never ends up
  // below the fold.
  if (people.length > RING_MAX) {
    return (
      <ScrollView style={{ width }} contentContainerStyle={{ paddingHorizontal: 24, paddingTop: 20, paddingBottom: 24 }}>
        {summary}
        <View style={{ marginTop: 12 }}>
          {people.map((p, i) => (sel === p.id ? (
            <View key={p.id}>{panelFor(p, { onHeaderPress: () => setSel(null), style: { marginVertical: 8 } })}</View>
          ) : (
            <Pressable
              key={p.id}
              onPress={() => toggle(p.id)}
              style={{ flexDirection: "row", alignItems: "center", gap: 14, paddingVertical: 12, borderTopWidth: i && people[i - 1].id !== sel ? 1 : 0, borderColor: t.line }}
            >
              <View style={{ width: ROW_ORB, height: ROW_ORB }}>
                <View style={{ position: "absolute", left: ROW_ORB / 2, top: ROW_ORB / 2 }}>
                  <Orb p={p} size={ROW_ORB} onPress={() => toggle(p.id)} />
                </View>
              </View>
              <View style={{ flex: 1 }}>
                <Text numberOfLines={1} style={{ fontFamily: FONTS.medium, fontSize: T.body, color: t.ink }}>{p.n}</Text>
                <Text numberOfLines={1} style={{ fontFamily: FONTS.sans, fontSize: T.small, color: t.muted, marginTop: 2 }}>{p.extra ? p.extra[0].toUpperCase() + p.extra.slice(1) : p.note}</Text>
              </View>
              <View style={{ alignItems: "flex-end" }}>
                <Text style={{ fontFamily: FONTS.medium, fontSize: T.small, color: t.ink }}>{statusFor(p.l).t}</Text>
                <Text style={{ fontFamily: FONTS.sans, fontSize: T.caption, color: t.faint, marginTop: 2 }}>{p.ago}</Text>
              </View>
            </Pressable>
          )))}
        </View>
      </ScrollView>
    );
  }

  return (
    <ScrollView style={{ width }} contentContainerStyle={{ paddingHorizontal: 24, paddingBottom: 24 }}>
      <View style={{ height: 316 }}>
        <View style={{ position: "absolute", left: "50%", top: "50%", width: RING * 2, height: RING * 2, marginLeft: -RING, marginTop: -RING, borderRadius: RING, borderWidth: 1, borderColor: t.line }} />

        <View style={{ position: "absolute", left: "50%", top: "50%" }}>
          <Orb p={me} size={76} selected={!sel} onPress={() => setSel(null)} />
        </View>
        <View pointerEvents="none" style={{ position: "absolute", left: "50%", top: "50%", marginTop: 44, marginLeft: -40, width: 80, alignItems: "center" }}>
          <Text style={{ fontFamily: FONTS.medium, fontSize: T.caption, color: t.muted }}>You</Text>
        </View>

        {people.map((p, i) => {
          const a = (i / people.length) * Math.PI * 2 - Math.PI / 2;
          return (
            <View key={p.id} style={{ position: "absolute", left: "50%", top: "50%", marginLeft: Math.cos(a) * RING, marginTop: Math.sin(a) * RING }}>
              <Orb p={p} size={52} selected={sel === p.id} onPress={() => toggle(p.id)} />
              <View pointerEvents="none" style={{ position: "absolute", top: 32, left: -40, width: 80, alignItems: "center" }}>
                <Text numberOfLines={1} style={{ fontFamily: FONTS.sans, fontSize: T.caption, color: t.muted }}>{p.n}</Text>
              </View>
            </View>
          );
        })}
      </View>

      {summary}

      {people.length === 0 && (
        <Btn variant="secondary" onPress={nobody ? openPeople : openSettings} style={{ marginTop: 16, alignSelf: "center", paddingVertical: 11 }}>
          {nobody ? "Add people" : "Move someone here"}
        </Btn>
      )}

      {chosen && panelFor(chosen, { style: { marginTop: 20 } })}
    </ScrollView>
  );
}

// "Keanen wants to add you", "Keanen and Sam want to add you", "Keanen and
// 2 others want to add you".
const askedLine = (names) => (names.length === 1 ? `${names[0]} wants to add you`
  : `${names[0]} and ${names.length === 2 ? names[1] : `${names.length - 1} others`} want to add you`);

// focus: { id } from a notification tap. Jumps to that person's group and
// opens them. asking: names of people waiting for you to accept.
export default function CircleScreen({ people, pulses, markSeen, nudge, setDoodle, focus, level, reason, wantsChat, myWindow, openSettings, openPeople, asking, onPicking }) {
  const t = useTheme();
  const insets = useSafeAreaInsets();
  const [joined, setJoined] = useState({});
  const [picking, setPicking] = useState(null);
  const pickingFor = picking && people.find((p) => p.id === picking);
  // Tells App a sheet's open, so the check-in waits its turn.
  useEffect(() => { onPicking(!!pickingFor); }, [!!pickingFor]);
  const [page, setPage] = useState(0);
  const [width, setWidth] = useState(Dimensions.get("window").width);
  const scroller = useRef(null);

  const me = {
    n: "You", l: level, ago: "just now",
    note: noteFor(level, reason, wantsChat),
    extra: myWindow ? `around ${myWindow}` : null, chat: wantsChat,
  };

  const goTo = (i) => {
    setPage(i);
    scroller.current?.scrollTo({ x: i * width, animated: true });
  };

  useEffect(() => {
    const p = focus && people.find((x) => x.id === focus.id);
    if (p) goTo(GROUPS.findIndex((g) => g.id === p.g));
  }, [focus]);

  // Open on the first group with anyone in it. Everyone starts in Friends,
  // so Home is often empty. A deep link (above) takes precedence.
  const opened = useRef(false);
  useEffect(() => {
    if (opened.current || !people.length) return;
    opened.current = true;
    if (!focus && !people.some((p) => p.g === GROUPS[page].id)) goTo(GROUPS.findIndex((g) => people.some((p) => p.g === g.id)));
  }, [people.length]);

  // Tapping the same answer again takes it back locally; only a new
  // answer sends a nudge.
  const join = (id, kind) => {
    const again = joined[id] === kind;
    setJoined((j) => ({ ...j, [id]: again ? null : kind }));
    if (!again) nudge(id, kind);
  };

  return (
    <View style={{ flex: 1, backgroundColor: t.bg }} onLayout={(e) => setWidth(e.nativeEvent.layout.width)}>
      <LightStreak level={level} />
      <View style={{ flexDirection: "row", alignItems: "center", justifyContent: "space-between", paddingTop: insets.top + 8, paddingHorizontal: 24 }}>
        <Display size={24}>Circle</Display>
        <View style={{ flexDirection: "row", alignItems: "center", gap: 20 }}>
          <Pressable onPress={openPeople} hitSlop={12} accessibilityRole="button" accessibilityLabel={asking.length ? "Add people, someone's asked to add you" : "Add people"}>
            <Icon name="addPerson" color={t.muted} />
            {asking.length > 0 && (
              <View style={{ position: "absolute", top: -2, right: -4, width: 9, height: 9, borderRadius: 5, backgroundColor: colorFor(85), borderWidth: 1.5, borderColor: t.bg }} />
            )}
          </Pressable>
          <Pressable onPress={openSettings} hitSlop={12} accessibilityRole="button" accessibilityLabel="Settings">
            <Icon name="settings" color={t.muted} />
          </Pressable>
        </View>
      </View>

      {asking.length > 0 && (
        <Pressable onPress={openPeople} accessibilityRole="button" style={{ marginHorizontal: 24, marginTop: 16 }}>
          <Panel style={{ flexDirection: "row", alignItems: "center", gap: 12, paddingVertical: 14, paddingHorizontal: 16 }}>
            <Text numberOfLines={2} style={{ flex: 1, fontFamily: FONTS.medium, fontSize: T.body, color: t.ink }}>{askedLine(asking)}</Text>
            <Text style={{ fontFamily: FONTS.sans, fontSize: T.small, color: t.muted }}>See</Text>
            <Icon name="chevron" size={16} color={t.faint} />
          </Panel>
        </Pressable>
      )}

      <Segmented
        options={GROUPS.map((g, i) => [i, g.label])}
        value={page}
        onChange={goTo}
        style={{ marginHorizontal: 24, marginTop: 20 }}
      />

      <ScrollView
        ref={scroller}
        horizontal
        pagingEnabled
        showsHorizontalScrollIndicator={false}
        onMomentumScrollEnd={(e) => setPage(Math.round(e.nativeEvent.contentOffset.x / width))}
      >
        {GROUPS.map((g) => (
          <CirclePage
            key={g.id} people={people.filter((p) => p.g === g.id)} me={me}
            pulses={pulses} markSeen={markSeen} joined={joined} join={join} pickDoodle={setPicking} focus={focus}
            openSettings={openSettings} openPeople={openPeople} nobody={!people.length} width={width}
          />
        ))}
      </ScrollView>

      {pickingFor && (
        <DoodlePicker
          p={pickingFor}
          onPick={(d) => { setDoodle(pickingFor.id, d); setPicking(null); }}
          onDismiss={() => setPicking(null)}
        />
      )}
    </View>
  );
}
