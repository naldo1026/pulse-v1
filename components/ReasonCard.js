import React, { useState } from "react";
import { View, Text, TextInput, Pressable } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useTheme, FONTS, T } from "../theme";
import { Chip, Panel } from "./primitives";

const CHIPS = ["Work", "Family", "Tired", "Good chat", "Alone time", "Plans", "Rest"];
const MAX_WORDS = 3;
const TAB_BAR = 61;

// Extra scroll room on the Me tab while the card's up, so Send pulse can always
// be scrolled clear of it. The card should never be what stops a pulse.
export const CARD_ROOM = 290;

const wordsIn = (s) => s.split(/\s+/).filter(Boolean);

// "What made this change?" A small card with no scrim, so the app behind it
// keeps working. Private: this goes to level_reasons, never profiles.reason.
// hidden keeps it mounted, so a half-typed reason survives the pulse burst.
export default function ReasonCard({ before, after, hidden, onAnswer, onSkip }) {
  const t = useTheme();
  const insets = useSafeAreaInsets();
  const [text, setText] = useState("");
  const words = wordsIn(text);

  // Anything that would make a 4th word is refused whole, typed or pasted, so
  // nothing gets cut off without you seeing it.
  const type = (next) => { if (wordsIn(next).length <= MAX_WORDS) setText(next); };
  const saveTyped = () => { if (words.length) onAnswer(words.join(" ").toLowerCase(), "typed"); };

  return (
    <Panel style={{ display: hidden ? "none" : "flex", position: "absolute", left: 12, right: 12, bottom: insets.bottom + TAB_BAR + 8, padding: 16 }}>
      <View style={{ flexDirection: "row", justifyContent: "space-between", alignItems: "center" }}>
        <Text style={{ fontFamily: FONTS.medium, fontSize: T.title, color: t.ink }}>What made this change?</Text>
        <Pressable onPress={onSkip} hitSlop={10}>
          <Text style={{ fontFamily: FONTS.medium, fontSize: T.small, color: t.muted }}>Skip</Text>
        </Pressable>
      </View>
      <Text style={{ fontFamily: FONTS.sans, fontSize: T.small, color: t.muted, marginTop: 2 }}>{before} → {after}. Only you'll see this.</Text>

      <View style={{ flexDirection: "row", flexWrap: "wrap", gap: 6, marginTop: 12 }}>
        {CHIPS.map((c) => <Chip key={c} onPress={() => onAnswer(c, "chip")}>{c}</Chip>)}
      </View>

      <View style={{ flexDirection: "row", alignItems: "center", gap: 10, marginTop: 12, paddingLeft: 16, paddingRight: 14, borderRadius: 100, backgroundColor: t.sunk }}>
        <TextInput
          value={text} onChangeText={type} onSubmitEditing={saveTyped}
          placeholder="Or say it in 3 words" placeholderTextColor={t.faint}
          returnKeyType="done" autoCapitalize="none" maxLength={100}
          style={{ flex: 1, minWidth: 0, paddingVertical: 10, color: t.ink, fontFamily: FONTS.sans, fontSize: 16, outlineStyle: "none" }}
        />
        <Text style={{ fontFamily: FONTS.sans, fontSize: T.caption, color: t.muted, fontVariant: ["tabular-nums"] }}>{words.length}/{MAX_WORDS}</Text>
        {words.length > 0 && (
          <Pressable onPress={saveTyped} hitSlop={10}>
            <Text style={{ fontFamily: FONTS.medium, fontSize: T.small, color: t.ink }}>Save</Text>
          </Pressable>
        )}
      </View>
    </Panel>
  );
}
