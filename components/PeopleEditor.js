import React, { useState } from "react";
import { View, Text } from "react-native";
import { useTheme, FONTS, T } from "../theme";
import { GROUPS } from "../lib/data";
import { Btn, Segmented } from "./primitives";

const SMALL = { paddingVertical: 7, paddingHorizontal: 12 };

// Your circle, each person in one of your groups, in Settings. Groups only
// decide whose phones your pulses reach: everyone in your circle sees your
// level. Removing asks first, on the row itself.
export default function PeopleEditor({ people, setGroup, remove }) {
  const t = useTheme();
  // The id of the person whose Remove was tapped.
  const [confirming, setConfirming] = useState(null);
  if (!people.length) {
    return (
      <Text style={{ fontFamily: FONTS.sans, fontSize: T.body, color: t.muted, paddingVertical: 8 }}>
        Nobody in your circle yet. Add people from the Circle tab.
      </Text>
    );
  }
  return (
    <View>
      {people.map((p, i) => (
        <View key={p.id} style={{ paddingVertical: 14, borderTopWidth: i ? 1 : 0, borderColor: t.line }}>
          <View style={{ flexDirection: "row", alignItems: "center", marginBottom: 10 }}>
            <Text numberOfLines={1} style={{ flex: 1, fontFamily: FONTS.medium, fontSize: T.body, color: t.ink }}>{p.n}</Text>
            {confirming !== p.id && (
              <Btn variant="ghost" onPress={() => setConfirming(p.id)} style={SMALL} textStyle={{ fontSize: T.small }}>Remove</Btn>
            )}
          </View>
          {confirming === p.id ? (
            <View>
              <Text style={{ fontFamily: FONTS.sans, fontSize: T.small, lineHeight: 18, color: t.muted }}>
                Remove {p.n}? You'll stop seeing each other's levels. You can add them again later.
              </Text>
              <View style={{ flexDirection: "row", gap: 8, marginTop: 10 }}>
                <Btn onPress={() => { setConfirming(null); remove(p.id); }} style={{ ...SMALL, flex: 1 }} textStyle={{ fontSize: T.small }}>Remove</Btn>
                <Btn variant="secondary" onPress={() => setConfirming(null)} style={{ ...SMALL, flex: 1 }} textStyle={{ fontSize: T.small }}>Keep</Btn>
              </View>
            </View>
          ) : (
            <Segmented options={GROUPS.map((g) => [g.id, g.label])} value={p.g} onChange={(g) => setGroup(p.id, g)} />
          )}
        </View>
      ))}
    </View>
  );
}
