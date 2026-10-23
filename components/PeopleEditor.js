import React, { useState } from "react";
import { View, Text, Pressable, TextInput } from "react-native";
import { useTheme, FONTS, T } from "../theme";
import { GROUPS } from "../lib/data";
import { Segmented, Chip } from "./primitives";
import Icon from "./Icon";

const MAX_PER_GROUP = 6;

// Add/remove people and pick which group they go in. Shared by onboarding
// and settings. `suggestions` is an optional [{ n }] list shown as chips.
export default function PeopleEditor({ members, setMembers, suggestions = [] }) {
  const t = useTheme();
  const [grp, setGrp] = useState("friends");
  const [newName, setNewName] = useState("");

  const names = members.map((m) => m.n);
  const groupFull = members.filter((m) => m.g === grp).length >= MAX_PER_GROUP;
  const add = (raw) => {
    const n = raw.trim();
    if (!n || groupFull || names.includes(n)) return;
    setMembers([...members, { n, g: grp }]);
    setNewName("");
  };
  const remove = (n) => setMembers(members.filter((x) => x.n !== n));
  const open = suggestions.filter((p) => !names.includes(p.n));

  return (
    <View>
      <Segmented options={GROUPS.map((g) => [g.id, g.label])} value={grp} onChange={setGrp} />

      <View style={{ flexDirection: "row", gap: 8, marginTop: 12 }}>
        <TextInput
          value={newName}
          onChangeText={setNewName}
          onSubmitEditing={() => add(newName)}
          placeholder={groupFull ? "This group is full" : "Add a name"}
          editable={!groupFull}
          placeholderTextColor={t.faint}
          style={{ flex: 1, paddingVertical: 13, paddingHorizontal: 18, borderRadius: 100, backgroundColor: t.surface, borderWidth: 1, borderColor: t.line, color: t.ink, fontFamily: FONTS.sans, fontSize: T.body }}
        />
        <Pressable onPress={() => add(newName)} accessibilityRole="button" accessibilityLabel="Add" style={{ width: 48, height: 48, borderRadius: 24, backgroundColor: newName.trim() ? t.ink : t.sunk, alignItems: "center", justifyContent: "center" }}>
          <Icon name="plus" color={newName.trim() ? t.inverse : t.faint} />
        </Pressable>
      </View>

      {open.length > 0 && (
        <View style={{ flexDirection: "row", flexWrap: "wrap", gap: 8, marginTop: 12 }}>
          {open.map((p) => (
            <Chip key={p.n} onPress={() => add(p.n)}>{`+ ${p.n}`}</Chip>
          ))}
        </View>
      )}

      <View style={{ marginTop: 16 }}>
        {members.map((m, i) => (
          <View key={m.n} style={{ flexDirection: "row", alignItems: "center", paddingVertical: 13, borderTopWidth: i ? 1 : 0, borderColor: t.line }}>
            <Text style={{ flex: 1, fontFamily: FONTS.sans, fontSize: T.body, color: t.ink }}>{m.n}</Text>
            <Text style={{ fontFamily: FONTS.sans, fontSize: T.small, color: t.faint, marginRight: 14 }}>{GROUPS.find((g) => g.id === m.g).label}</Text>
            <Pressable onPress={() => remove(m.n)} hitSlop={10} accessibilityRole="button" accessibilityLabel={`Remove ${m.n}`}>
              <Icon name="close" size={16} color={t.faint} />
            </Pressable>
          </View>
        ))}
      </View>
    </View>
  );
}
