import React from "react";
import { View, Modal, Pressable } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useTheme } from "../theme";

// Bottom sheet over a scrim. Tapping the scrim dismisses.
export default function Sheet({ onDismiss, children }) {
  const t = useTheme();
  const insets = useSafeAreaInsets();
  return (
    <Modal transparent animationType="fade" visible onRequestClose={onDismiss}>
      <Pressable onPress={onDismiss} style={{ flex: 1, backgroundColor: t.scrim, justifyContent: "flex-end" }}>
        <Pressable style={{ backgroundColor: t.surface, borderTopLeftRadius: 28, borderTopRightRadius: 28, paddingTop: 10, paddingHorizontal: 24, paddingBottom: insets.bottom + 20 }}>
          <View style={{ alignSelf: "center", width: 36, height: 4, borderRadius: 2, backgroundColor: t.lineStrong, marginBottom: 20 }} />
          {children}
        </Pressable>
      </Pressable>
    </Modal>
  );
}
