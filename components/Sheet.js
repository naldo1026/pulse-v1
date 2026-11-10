import React, { useMemo, useRef } from "react";
import { View, Modal, Pressable, Animated, PanResponder } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useTheme } from "../theme";

// Bottom sheet over a scrim. Tapping the scrim dismisses. With
// swipeToClose, dragging the top of the sheet down past a little way (or
// flicking it) dismisses too; it's only the grab area, so a scroll inside
// the sheet never closes it by accident.
export default function Sheet({ onDismiss, children, swipeToClose = false }) {
  const t = useTheme();
  const insets = useSafeAreaInsets();
  const y = useRef(new Animated.Value(0)).current;
  const back = () => Animated.spring(y, { toValue: 0, useNativeDriver: false, bounciness: 4 }).start();
  const pan = useMemo(() => PanResponder.create({
    onStartShouldSetPanResponder: () => swipeToClose,
    onMoveShouldSetPanResponder: (_, g) => swipeToClose && Math.abs(g.dy) > Math.abs(g.dx),
    onPanResponderMove: (_, g) => y.setValue(Math.max(0, g.dy)),
    onPanResponderRelease: (_, g) => (g.dy > 80 || g.vy > 0.8 ? onDismiss() : back()),
    onPanResponderTerminate: back,
  }), [swipeToClose, onDismiss]);

  return (
    <Modal transparent animationType="fade" visible onRequestClose={onDismiss}>
      <Pressable onPress={onDismiss} style={{ flex: 1, backgroundColor: t.scrim, justifyContent: "flex-end" }}>
        <Animated.View style={{ transform: [{ translateY: y }] }}>
          <Pressable style={{ backgroundColor: t.surface, borderTopLeftRadius: 28, borderTopRightRadius: 28, paddingHorizontal: 24, paddingBottom: insets.bottom + 20 }}>
            <View {...(swipeToClose ? pan.panHandlers : {})} style={{ paddingTop: 10, paddingBottom: 20, marginHorizontal: -24 }}>
              <View style={{ alignSelf: "center", width: 36, height: 4, borderRadius: 2, backgroundColor: t.lineStrong }} />
            </View>
            {children}
          </Pressable>
        </Animated.View>
      </Pressable>
    </Modal>
  );
}
