import React, { useState } from "react";
import { View, ActivityIndicator } from "react-native";
import { StatusBar } from "expo-status-bar";
import { GestureHandlerRootView } from "react-native-gesture-handler";
import { NavigationContainer, DefaultTheme } from "@react-navigation/native";
import { createBottomTabNavigator } from "@react-navigation/bottom-tabs";
import { Battery, Users, TrendingUp } from "lucide-react-native";
import { useFonts, SpaceGrotesk_600SemiBold } from "@expo-google-fonts/space-grotesk";
import { Inter_400Regular, Inter_600SemiBold } from "@expo-google-fonts/inter";
import { JetBrainsMono_600SemiBold } from "@expo-google-fonts/jetbrains-mono";

import MyBatteryScreen from "./screens/MyBatteryScreen";
import CircleScreen from "./screens/CircleScreen";
import InsightsScreen from "./screens/InsightsScreen";
import OnboardingScreen from "./screens/OnboardingScreen";
import { COLORS } from "./theme";

const Tab = createBottomTabNavigator();

const navTheme = {
  ...DefaultTheme,
  colors: { ...DefaultTheme.colors, background: COLORS.ink, card: COLORS.trackBg, border: COLORS.line },
};

export default function App() {
  const [profile, setProfile] = useState(null);

  const [fontsLoaded] = useFonts({
    SpaceGrotesk_600SemiBold,
    Inter_400Regular,
    Inter_600SemiBold,
    JetBrainsMono_600SemiBold,
  });

  if (!fontsLoaded) {
    return (
      <View style={{ flex: 1, backgroundColor: COLORS.ink, alignItems: "center", justifyContent: "center" }}>
        <ActivityIndicator color={COLORS.mint} />
      </View>
    );
  }

  return (
    <GestureHandlerRootView style={{ flex: 1 }}>
      <StatusBar style="light" />
      {!profile ? (
        <OnboardingScreen onFinish={setProfile} />
      ) : (
        <NavigationContainer theme={navTheme}>
          <Tab.Navigator
            screenOptions={{
              headerShown: false,
              tabBarStyle: { backgroundColor: COLORS.trackBg, borderTopColor: COLORS.line },
              tabBarActiveTintColor: COLORS.mint,
              tabBarInactiveTintColor: COLORS.muted,
              tabBarLabelStyle: { fontSize: 10 },
            }}
          >
            <Tab.Screen
              name="My Battery"
              options={{ tabBarIcon: ({ color }) => <Battery size={18} color={color} /> }}
            >
              {() => <MyBatteryScreen mbti={profile.mbti} />}
            </Tab.Screen>
            <Tab.Screen
              name="Circle"
              component={CircleScreen}
              options={{ tabBarIcon: ({ color }) => <Users size={18} color={color} /> }}
            />
            <Tab.Screen
              name="Insights"
              options={{ tabBarIcon: ({ color }) => <TrendingUp size={18} color={color} /> }}
            >
              {() => <InsightsScreen level={profile.level} mbti={profile.mbti} />}
            </Tab.Screen>
          </Tab.Navigator>
        </NavigationContainer>
      )}
    </GestureHandlerRootView>
  );
}
