import React from "react";
import { View, Text } from "react-native";
import { useTheme, FONTS, T } from "../theme";
import { GROUPS } from "../lib/data";
import { Segmented } from "./primitives";

// Everyone on Pulse, each in one of your groups. Shared by onboarding and
// settings. Groups only decide whose phones your pulses reach. Everyone
// can see everyone's level.
export default function PeopleEditor({ people, setGroup }) {
  const t = useTheme();
  if (!people.length) {
    return (
      <Text style={{ fontFamily: FONTS.sans, fontSize: T.body, color: t.muted, paddingVertical: 8 }}>
        Nobody else is here yet. People show up as they join.
      </Text>
    );
  }
  return (
    <View>
      {people.map((p, i) => (
        <View key={p.id} style={{ paddingVertical: 14, borderTopWidth: i ? 1 : 0, borderColor: t.line }}>
          <Text style={{ fontFamily: FONTS.medium, fontSize: T.body, color: t.ink, marginBottom: 10 }}>{p.n}</Text>
          <Segmented options={GROUPS.map((g) => [g.id, g.label])} value={p.g} onChange={(g) => setGroup(p.id, g)} />
        </View>
      ))}
    </View>
  );
}
