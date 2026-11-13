import React, { useRef } from "react";
import { View, Text, ScrollView, Pressable } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useTheme, rgba, FONTS, T } from "../theme";
import { Display } from "./primitives";

// Splits text on **bold** and [●placeholder] so both can be styled. A
// placeholder is a fact still to confirm, highlighted so review can't miss it.
function Rich({ children, style }) {
  const t = useTheme();
  const parts = String(children).split(/(\*\*[^*]+\*\*|\[●[^\]]*\])/g).filter(Boolean);
  return (
    <Text style={style}>
      {parts.map((p, i) => {
        if (p.startsWith("**")) return <Text key={i} style={{ fontFamily: FONTS.medium, color: t.ink }}>{p.slice(2, -2)}</Text>;
        if (p.startsWith("[●")) return <Text key={i} style={{ backgroundColor: rgba("#E0AE8C", 0.45), color: t.ink }}>{p}</Text>;
        return p;
      })}
    </Text>
  );
}

function Block({ b }) {
  const t = useTheme();
  const body = { fontFamily: FONTS.sans, fontSize: T.body, lineHeight: 23, color: t.muted };
  if (typeof b === "string") return <Rich style={[body, { marginTop: 10 }]}>{b}</Rich>;
  if (b.h) return <Text style={{ fontFamily: FONTS.medium, fontSize: T.body, color: t.ink, marginTop: 18 }}>{b.h}</Text>;
  if (b.note) {
    return (
      <View style={{ marginTop: 14, padding: 16, borderRadius: 18, backgroundColor: t.sunk }}>
        <Rich style={[body, { color: t.ink }]}>{b.note}</Rich>
      </View>
    );
  }
  if (b.list) {
    return (
      <View style={{ marginTop: 8 }}>
        {b.list.map((item, i) => (
          <View key={i} style={{ flexDirection: "row", gap: 10, marginTop: 6 }}>
            <Text style={[body, { color: t.faint }]}>•</Text>
            <Rich style={[body, { flex: 1 }]}>{item}</Rich>
          </View>
        ))}
      </View>
    );
  }
  // Side by side: [{ head, items }, ...].
  if (b.columns) {
    return (
      <View style={{ flexDirection: "row", gap: 10, marginTop: 14 }}>
        {b.columns.map((c) => (
          <View key={c.head} style={{ flex: 1, padding: 12, borderRadius: 16, backgroundColor: t.sunk }}>
            <Text style={{ fontFamily: FONTS.medium, fontSize: T.small, color: t.ink, marginBottom: 4 }}>{c.head}</Text>
            {c.items.map((it, i) => <Rich key={i} style={{ fontFamily: FONTS.sans, fontSize: T.small, lineHeight: 18, color: t.muted, marginTop: 6 }}>{it}</Rich>)}
          </View>
        ))}
      </View>
    );
  }
  // A table as one card per row: the first cell is the card's title, the
  // rest are labelled with their column heading. Reads well at 320pt.
  if (b.table) {
    const { head, rows } = b.table;
    return (
      <View style={{ marginTop: 12, gap: 8 }}>
        {rows.map((row, i) => (
          <View key={i} style={{ padding: 14, borderRadius: 16, borderWidth: 1, borderColor: t.line }}>
            <Rich style={{ fontFamily: FONTS.medium, fontSize: T.body, lineHeight: 21, color: t.ink }}>{row[0]}</Rich>
            {row.slice(1).map((cell, k) => (
              <View key={k} style={{ marginTop: 6 }}>
                <Text style={{ fontFamily: FONTS.medium, fontSize: T.caption, color: t.faint }}>{head[k + 1]}</Text>
                <Rich style={{ fontFamily: FONTS.sans, fontSize: T.small, lineHeight: 19, color: t.muted }}>{cell}</Rich>
              </View>
            ))}
          </View>
        ))}
      </View>
    );
  }
  return null;
}

// One document from lib/legal: title, version and date, an optional
// contents list whose items jump to their section, the intro, then every
// section. Scrolls on its own.
export default function LegalDoc({ doc, contents = true }) {
  const t = useTheme();
  const insets = useSafeAreaInsets();
  const scroll = useRef(null);
  const offsets = useRef({});
  const draft = /draft/i.test(doc.version);

  return (
    <ScrollView ref={scroll} contentContainerStyle={{ paddingHorizontal: 24, paddingTop: 20, paddingBottom: insets.bottom + 48 }}>
      <Display size={28}>{doc.title}</Display>
      <View style={{ flexDirection: "row", flexWrap: "wrap", alignItems: "center", gap: 8, marginTop: 8 }}>
        <Text style={{ fontFamily: FONTS.sans, fontSize: T.small, color: t.faint }}>{`Version ${doc.version.replace(/\s*\(draft\)/i, "")} · Last updated ${doc.updated}`}</Text>
        {draft && (
          <View style={{ paddingVertical: 2, paddingHorizontal: 8, borderRadius: 100, backgroundColor: rgba("#E0AE8C", 0.45) }}>
            <Text style={{ fontFamily: FONTS.bold, fontSize: 11, color: t.ink }}>DRAFT</Text>
          </View>
        )}
      </View>

      {doc.intro.map((b, i) => <Block key={i} b={b} />)}

      {contents && (
        <View style={{ marginTop: 20, paddingVertical: 6, paddingHorizontal: 16, borderRadius: 18, borderWidth: 1, borderColor: t.line }}>
          <Text style={{ fontFamily: FONTS.medium, fontSize: T.small, color: t.ink, marginTop: 8, marginBottom: 2 }}>Contents</Text>
          {doc.sections.map((s) => (
            <Pressable
              key={s.id} accessibilityRole="link"
              onPress={() => scroll.current?.scrollTo({ y: Math.max(0, (offsets.current[s.id] ?? 0) - 12), animated: true })}
              style={({ pressed }) => ({ paddingVertical: 7, opacity: pressed ? 0.6 : 1 })}
            >
              <Text style={{ fontFamily: FONTS.sans, fontSize: T.small, color: t.muted }}>{s.heading}</Text>
            </Pressable>
          ))}
        </View>
      )}

      {doc.sections.map((s) => (
        <View key={s.id} onLayout={(e) => { offsets.current[s.id] = e.nativeEvent.layout.y; }} style={{ marginTop: 28 }}>
          <Text accessibilityRole="header" style={{ fontFamily: FONTS.bold, fontSize: T.title, letterSpacing: -0.3, color: t.ink }}>{s.heading}</Text>
          {s.blocks.map((b, i) => <Block key={i} b={b} />)}
        </View>
      ))}
    </ScrollView>
  );
}
