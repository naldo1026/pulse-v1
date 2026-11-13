import React from "react";
import { View, Text, Modal, ScrollView, Pressable } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useTheme, FONTS, T } from "../theme";
import { Label, Display } from "../components/primitives";
import FindPeople, { ShareUsername } from "../components/FindPeople";

// Full screen, like Settings. Opened from the Circle, Settings, or a
// "wants to add you" notification.
export default function PeopleScreen({ onClose, username, requests, onChanged }) {
  const t = useTheme();
  const insets = useSafeAreaInsets();
  return (
    <Modal transparent={false} animationType="slide" visible onRequestClose={onClose}>
      <View style={{ flex: 1, backgroundColor: t.bg }}>
        <View style={{ flexDirection: "row", alignItems: "center", justifyContent: "space-between", paddingTop: insets.top + 16, paddingHorizontal: 24 }}>
          <Display size={24}>Add people</Display>
          <Pressable onPress={onClose} hitSlop={12}>
            <Text style={{ fontFamily: FONTS.medium, fontSize: T.body, color: t.ink }}>Done</Text>
          </Pressable>
        </View>

        <ScrollView contentContainerStyle={{ paddingHorizontal: 24, paddingTop: 12, paddingBottom: insets.bottom + 40 }} keyboardShouldPersistTaps="handled">
          <Text style={{ fontFamily: FONTS.sans, fontSize: T.body, lineHeight: 22, color: t.muted }}>
            Only people in your circle see your level. Add someone, and once they accept, you'll see each other.
          </Text>

          <Label style={{ marginTop: 28, marginLeft: 4, marginBottom: 8 }}>Your username</Label>
          <ShareUsername username={username} />

          <Label style={{ marginTop: 28, marginLeft: 4, marginBottom: 8 }}>Find someone</Label>
          <FindPeople requests={requests} onChanged={onChanged} />
        </ScrollView>
      </View>
    </Modal>
  );
}
