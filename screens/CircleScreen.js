import React, { useRef, useState } from "react";
import { View, Text, ScrollView, Pressable, Dimensions } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useTheme, FONTS, T } from "../theme";
import { PEOPLE, GROUPS, statusFor } from "../lib/data";
import { Btn, Panel, Display, Segmented } from "../components/primitives";
import Orb from "../components/Orb";
import Icon from "../components/Icon";
import LightStreak from "../components/LightStreak";

const RING = 104;

const moodOf = (avg) => (avg <= 35 ? "mostly quiet" : avg >= 70 ? "plenty of energy" : "a mixed bag");

function CirclePage({ people, me, ack, setAck, joined, setJoined, openSettings, width }) {
  const t = useTheme();
  const [sel, setSel] = useState(null);
  const chosen = sel ? people.find((p) => p.n === sel) : null;
  const avg = people.length ? Math.round(people.reduce((a, p) => a + p.l, 0) / people.length) : 0;

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
            <View key={p.n} style={{ position: "absolute", left: "50%", top: "50%", marginLeft: Math.cos(a) * RING, marginTop: Math.sin(a) * RING }}>
              <Orb p={p} size={52} selected={sel === p.n} onPress={() => setSel(sel === p.n ? null : p.n)} />
              <View pointerEvents="none" style={{ position: "absolute", top: 32, left: -40, width: 80, alignItems: "center" }}>
                <Text numberOfLines={1} style={{ fontFamily: FONTS.sans, fontSize: T.caption, color: t.muted }}>{p.n}</Text>
              </View>
            </View>
          );
        })}
      </View>

      <Text style={{ fontFamily: FONTS.sans, fontSize: T.small, color: t.muted, textAlign: "center" }}>
        {people.length ? `${people.length} ${people.length === 1 ? "person" : "people"} · ${moodOf(avg)}` : "Nobody here yet"}
      </Text>

      {people.length === 0 && (
        <Btn variant="secondary" onPress={openSettings} style={{ marginTop: 16, alignSelf: "center", paddingVertical: 11 }}>Add someone</Btn>
      )}

      {chosen && (
        <Panel style={{ marginTop: 20 }}>
          <View style={{ flexDirection: "row", alignItems: "flex-start" }}>
            <View style={{ flex: 1 }}>
              <Display size={24}>{chosen.n}</Display>
              <Text style={{ fontFamily: FONTS.sans, fontSize: T.body, color: t.muted, marginTop: 2 }}>{chosen.note}</Text>
            </View>
            <View style={{ alignItems: "flex-end", paddingTop: 4 }}>
              <Text style={{ fontFamily: FONTS.medium, fontSize: T.body, color: t.ink }}>{statusFor(chosen.l).t}</Text>
              <Text style={{ fontFamily: FONTS.sans, fontSize: T.caption, color: t.faint, marginTop: 2 }}>{chosen.ago} ago</Text>
            </View>
          </View>

          {chosen.extra && (
            <View style={{ marginTop: 16, paddingTop: 16, borderTopWidth: 1, borderColor: t.line }}>
              <Text style={{ fontFamily: FONTS.sans, fontSize: T.body, color: t.ink }}>{chosen.n} is {chosen.extra}.</Text>
              <View style={{ flexDirection: "row", gap: 8, marginTop: 12 }}>
                <Btn
                  variant={joined[chosen.n] ? "secondary" : "primary"}
                  onPress={() => setJoined((j) => ({ ...j, [chosen.n]: !j[chosen.n] }))}
                  style={{ flex: 2, paddingVertical: 11 }}
                >
                  {joined[chosen.n] ? "You're in" : "I'm in"}
                </Btn>
                <Btn variant="ghost" style={{ flex: 1, paddingVertical: 11 }}>Maybe</Btn>
              </View>
            </View>
          )}

          <Pressable
            onPress={() => setAck((a) => ({ ...a, [chosen.n]: !a[chosen.n] }))}
            style={{ flexDirection: "row", alignItems: "center", justifyContent: "center", gap: 6, marginTop: 16, paddingVertical: 11, borderRadius: 100, borderWidth: 1, borderColor: t.lineStrong }}
          >
            {ack[chosen.n] && <Icon name="check" size={16} color={t.ink} />}
            <Text style={{ fontFamily: FONTS.medium, fontSize: T.body, color: ack[chosen.n] ? t.ink : t.muted }}>{ack[chosen.n] ? "Seen" : "Mark as seen"}</Text>
          </Pressable>
        </Panel>
      )}
    </ScrollView>
  );
}

export default function CircleScreen({ ack, setAck, members, level, reason, wantsChat, myWindow, openSettings }) {
  const t = useTheme();
  const insets = useSafeAreaInsets();
  const [joined, setJoined] = useState({});
  const [page, setPage] = useState(0);
  const [width, setWidth] = useState(Dimensions.get("window").width);
  const scroller = useRef(null);

  const names = members.map((m) => m.n);
  const groupOf = (n) => (members.find((m) => m.n === n) || {}).g;
  const known = PEOPLE.filter((p) => names.includes(p.n)).map((p) => ({ ...p, g: groupOf(p.n) || p.g }));

  const me = {
    n: "You", l: level, ago: "now",
    note: level <= 40 ? (reason || "Quiet one") : "Up for something",
    extra: myWindow ? `around ${myWindow}` : null, chat: wantsChat,
  };

  const goTo = (i) => {
    setPage(i);
    scroller.current?.scrollTo({ x: i * width, animated: true });
  };

  return (
    <View style={{ flex: 1, backgroundColor: t.bg }} onLayout={(e) => setWidth(e.nativeEvent.layout.width)}>
      <LightStreak level={level} />
      <View style={{ flexDirection: "row", alignItems: "center", justifyContent: "space-between", paddingTop: insets.top + 8, paddingHorizontal: 24 }}>
        <Display size={24}>Circle</Display>
        <Pressable onPress={openSettings} hitSlop={12} accessibilityRole="button" accessibilityLabel="Settings">
          <Icon name="settings" color={t.muted} />
        </Pressable>
      </View>

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
            key={g.id} people={known.filter((p) => p.g === g.id)} me={me}
            ack={ack} setAck={setAck} joined={joined} setJoined={setJoined} openSettings={openSettings} width={width}
          />
        ))}
      </ScrollView>
    </View>
  );
}
