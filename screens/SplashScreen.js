import React, { useEffect } from "react";
import { View } from "react-native";
import Animated, { useSharedValue, useAnimatedStyle, withDelay, withSequence, withTiming, Easing } from "react-native-reanimated";
import { useTheme } from "../theme";
import { colorFor } from "../lib/data";
import { Display } from "../components/primitives";

// Wordmark fades up, then a single soft beat on the dot beside it.
export default function SplashScreen() {
  const t = useTheme();
  const fade = useSharedValue(0);
  const beat = useSharedValue(1);

  useEffect(() => {
    fade.value = withTiming(1, { duration: 500, easing: Easing.out(Easing.cubic) });
    beat.value = withDelay(450, withSequence(
      withTiming(1.6, { duration: 180, easing: Easing.out(Easing.quad) }),
      withTiming(1, { duration: 320, easing: Easing.inOut(Easing.quad) })
    ));
  }, []);

  const wordStyle = useAnimatedStyle(() => ({ opacity: fade.value, transform: [{ translateY: (1 - fade.value) * 6 }] }));
  const dotStyle = useAnimatedStyle(() => ({ opacity: fade.value, transform: [{ scale: beat.value }] }));

  return (
    <View style={{ flex: 1, backgroundColor: t.bg, alignItems: "center", justifyContent: "center" }}>
      <View style={{ flexDirection: "row", alignItems: "center", gap: 10 }}>
        <Animated.View style={[{ width: 10, height: 10, borderRadius: 5, backgroundColor: colorFor(64) }, dotStyle]} />
        <Animated.View style={wordStyle}>
          <Display size={48}>Pulse</Display>
        </Animated.View>
      </View>
    </View>
  );
}
