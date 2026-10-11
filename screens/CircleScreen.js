import React, { useRef, useState } from "react";
import { View, Text, ScrollView, Pressable, Dimensions } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { INK, PANEL, PAPER, GOLD, FONTS, T, rgba } from "../theme";
import { PEOPLE, GROUPS, colorFor } from "../lib/data";
import { Label, Script } from "../components/primitives";
import Orb from "../components/Orb";

const RING = 108;

function CirclePage({ group, people, me, ack, setAck, joined, setJoined, openSettings, width }) {
  const [sel, setSel] = useState(null);
  const chosen = sel ? people.find((p) => p.n === sel) : null;
  const avg = people.length ? Math.round(people.reduce((a, p) => a + p.l, 0) / people.length) : 0;

  return (
    <View style={{ width, paddingHorizontal: 22 }}>
      <View style={{ alignItems: "center", paddingTop: 4 }}>
        <Script size={38}>{group.label}</Script>
        <Text style={{ fontFamily: FONTS.sans, fontSize: T.micro, color: rgba(PAPER, 0.45), marginTop: 4 }}>
          {people.length ? `${people.length} people · ${avg}% average` : group.note}
        </Text>
      </View>

      <View style={{ height: 268, marginTop: 8 }}>
        <View style={{ position: "absolute", left: "50%", top: "50%", width: RING * 2, height: RING * 2, marginLeft: -RING, marginTop: -RING, borderRadius: RING, borderWidth: 1, borderStyle: "dashed", borderColor: rgba(PAPER, 0.1) }} />

        <View style={{ position: "absolute", left: "50%", top: "50%" }}>
          <Orb p={me} size={78} selected={!sel} onPress={() => setSel(null)} />
        </View>
        <View pointerEvents="none" style={{ position: "absolute", left: "50%", top: "50%", marginTop: 44, marginLeft: -40, width: 80, alignItems: "center" }}>
          <Script size={20} color={rgba(PAPER, 0.75)}>you</Script>
        </View>

        {people.map((p, i) => {
          const a = (i / people.length) * Math.PI * 2 - Math.PI / 2;
          return (
            <View key={p.n} style={{ position: "absolute", left: "50%", top: "50%", marginLeft: Math.cos(a) * RING, marginTop: Math.sin(a) * RING }}>
              <Orb p={p} size={54} selected={sel === p.n} onPress={() => setSel(sel === p.n ? null : p.n)} />
              <View pointerEvents="none" style={{ position: "absolute", top: 30, left: -40, width: 80, alignItems: "center" }}>
                <Text numberOfLines={1} style={{ fontFamily: FONTS.sansSemiBold, fontSize: T.micro, color: rgba(PAPER, 0.7) }}>{p.n}</Text>
              </View>
            </View>
          );
        })}

        {people.length === 0 && (
          <Pressable onPress={openSettings} style={{ position: "absolute", left: 0, right: 0, bottom: 8, alignItems: "center" }}>
            <Text style={{ fontFamily: FONTS.sansSemiBold, fontSize: T.small, color: GOLD }}>Add someone to this circle</Text>
          </Pressable>
        )}
      </View>

      <View style={{ marginTop: 6 }}>
        {chosen ? (
          <View style={{ padding: 16, borderRadius: 22, backgroundColor: PANEL, borderWidth: 1, borderColor: rgba(PAPER, 0.07) }}>
            <View style={{ flexDirection: "row", alignItems: "flex-start", gap: 12 }}>
              <View style={{ flex: 1 }}>
                <Script size={28}>{chosen.n}</Script>
                <Text style={{ fontFamily: FONTS.sans, fontSize: T.small, color: rgba(PAPER, 0.55), marginTop: 4 }}>{chosen.note}</Text>
              </View>
              <View style={{ alignItems: "flex-end" }}>
                <Text style={{ fontFamily: FONTS.sansExtraBold, fontSize: 26, color: colorFor(chosen.l) }}>{chosen.l}</Text>
                <Text style={{ fontFamily: FONTS.sansSemiBold, fontSize: T.micro, color: rgba(PAPER, 0.4), marginTop: 3 }}>{chosen.ago} ago</Text>
              </View>
            </View>

            {chosen.extra && (
              <View style={{ marginTop: 14, padding: 13, borderRadius: 16, backgroundColor: rgba(colorFor(chosen.l), 0.08), borderWidth: 1, borderColor: rgba(colorFor(chosen.l), 0.3) }}>
                <Label color={rgba(colorFor(chosen.l), 0.85)}>Open invite</Label>
                <Script size={25} style={{ marginTop: 5 }}>{chosen.n} is {chosen.extra}</Script>
                <View style={{ flexDirection: "row", gap: 8, marginTop: 11 }}>
                  <Pressable
                    onPress={() => setJoined((j) => ({ ...j, [chosen.n]: !j[chosen.n] }))}
                    style={{ flex: 2, alignItems: "center", paddingVertical: 10, borderRadius: 100, backgroundColor: joined[chosen.n] ? "transparent" : colorFor(chosen.l), borderWidth: 1, borderColor: colorFor(chosen.l) }}
                  >
                    <Text style={{ fontFamily: FONTS.sansBold, fontSize: T.small, color: joined[chosen.n] ? colorFor(chosen.l) : INK }}>{joined[chosen.n] ? "You're in" : "I'm in"}</Text>
                  </Pressable>
                  <Pressable style={{ flex: 1, alignItems: "center", paddingVertical: 10, borderRadius: 100, borderWidth: 1, borderColor: rgba(PAPER, 0.12) }}>
                    <Text style={{ fontFamily: FONTS.sansMedium, fontSize: T.small, color: rgba(PAPER, 0.45) }}>Maybe</Text>
                  </Pressable>
                </View>
              </View>
            )}

            <Pressable
              onPress={() => setAck((a) => ({ ...a, [chosen.n]: !a[chosen.n] }))}
              style={{ marginTop: 12, paddingVertical: 11, alignItems: "center", borderRadius: 100, borderWidth: 1, borderColor: ack[chosen.n] ? rgba(GOLD, 0.6) : rgba(PAPER, 0.12), backgroundColor: ack[chosen.n] ? rgba(GOLD, 0.1) : "transparent" }}
            >
              <Text style={{ fontFamily: FONTS.sansSemiBold, fontSize: T.small, color: ack[chosen.n] ? GOLD : rgba(PAPER, 0.55) }}>{ack[chosen.n] ? "✓ They know you saw it" : "Let them know you saw it"}</Text>
            </Pressable>
          </View>
        ) : (
          <View style={{ padding: 16, borderRadius: 22, backgroundColor: PANEL, borderWidth: 1, borderColor: rgba(PAPER, 0.07), alignItems: "center" }}>
            <Script size={26} color={rgba(PAPER, 0.8)}>
              {!people.length ? "Nobody here yet." : avg <= 35 ? "A quiet one all round." : avg >= 70 ? "Plenty of life in here." : "A mixed evening."}
            </Script>
            <Text style={{ fontFamily: FONTS.sans, fontSize: T.micro, color: rgba(PAPER, 0.42), marginTop: 5 }}>
              {people.length ? "Tap anyone to see more." : "Swipe across to your other circles."}
            </Text>
          </View>
        )}
      </View>
    </View>
  );
}

export default function CircleScreen({ ack, setAck, members, level, reason, wantsChat, myWindow, openSettings }) {
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
    note: level <= 40 ? (reason || "quiet one") : "up for something",
    extra: myWindow ? `around ${myWindow}` : null, chat: wantsChat,
  };

  return (
    <View style={{ flex: 1, backgroundColor: INK }} onLayout={(e) => setWidth(e.nativeEvent.layout.width)}>
      <View style={{ flexDirection: "row", alignItems: "center", justifyContent: "space-between", paddingTop: insets.top + 8, paddingHorizontal: 22, paddingBottom: 10 }}>
        <Script size={26}>Circles</Script>
        <Pressable onPress={openSettings}>
          <Text style={{ fontFamily: FONTS.mono, fontSize: T.body, color: rgba(PAPER, 0.45) }}>⚙</Text>
        </Pressable>
      </View>

      <ScrollView
        ref={scroller}
        horizontal
        pagingEnabled
        showsHorizontalScrollIndicator={false}
        onMomentumScrollEnd={(e) => setPage(Math.round(e.nativeEvent.contentOffset.x / width))}
      >
        {GROUPS.map((g) => (
          <CirclePage
            key={g.id} group={g} people={known.filter((p) => p.g === g.id)} me={me}
            ack={ack} setAck={setAck} joined={joined} setJoined={setJoined} openSettings={openSettings} width={width}
          />
        ))}
      </ScrollView>

      <View style={{ flexDirection: "row", gap: 7, justifyContent: "center", paddingVertical: 12 }}>
        {GROUPS.map((g, i) => (
          <Pressable key={g.id} onPress={() => scroller.current?.scrollTo({ x: i * width, animated: true })}>
            <View style={{ width: i === page ? 22 : 7, height: 7, borderRadius: 4, backgroundColor: i === page ? GOLD : rgba(PAPER, 0.18) }} />
          </Pressable>
        ))}
      </View>
    </View>
  );
}
