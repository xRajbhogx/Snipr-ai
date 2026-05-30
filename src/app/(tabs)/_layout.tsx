import { BORDER_RADIUS, Theme } from "@/constants/theme";
import { getTabBarStyle } from "@/constants/tabBarStyle";
import { useTheme } from "@/hooks/useTheme";
import Ionicons from "@expo/vector-icons/Ionicons";
import { Tabs, router, useSegments } from "expo-router";
import React from "react";
import { Pressable, StyleSheet, View } from "react-native";
import Animated, {
  useAnimatedStyle,
  useSharedValue,
  withTiming,
} from "react-native-reanimated";
import { useSafeAreaInsets } from "react-native-safe-area-context";

const AnimatedPressable = Animated.createAnimatedComponent(Pressable);

const FloatingAddButton = () => {
  const theme = useTheme();
  const { bottom } = useSafeAreaInsets();
  const styles = makeStyles(theme, bottom);
  const scale = useSharedValue(1);

  const animatedStyle = useAnimatedStyle(() => ({
    transform: [{ scale: scale.value }],
  }));

  const handlePressIn = () => {
    scale.value = withTiming(0.88, { duration: 80 });
  };

  const handlePressOut = () => {
    scale.value = withTiming(1, { duration: 120 });
  };

  const handlePress = () => {
    router.push("/CreateSnippetScreen");
  };

  return (
    <View style={styles.floatingButtonContainer} pointerEvents="box-none">
      <AnimatedPressable
        onPress={handlePress}
        onPressIn={handlePressIn}
        onPressOut={handlePressOut}
        style={[styles.floatingButton, animatedStyle]}
      >
        <Ionicons name="add" size={32} color={theme.white} />
      </AnimatedPressable>
    </View>
  );
};

const HOME_STACK_OVERLAY_SCREENS = new Set([
  "AllSnippetsScreen",
  "FavouritesScreen",
  "SearchScreen",
]);

export default function RootLayout() {
  const theme = useTheme();
  const { bottom } = useSafeAreaInsets();
  const styles = makeStyles(theme, bottom);
  const segments = useSegments();
  const isHomeOverlayScreen =
    segments[0] === "(tabs)" &&
    segments[1] === "home" &&
    typeof segments[2] === "string" &&
    HOME_STACK_OVERLAY_SCREENS.has(segments[2]);

  return (
    <View style={styles.container}>
      <Tabs
        screenOptions={{
          headerShown: false,
          tabBarActiveTintColor: theme.activeTab,
          tabBarInactiveTintColor: theme.inactiveTab,
          tabBarStyle: getTabBarStyle(theme),
          sceneStyle: { backgroundColor: theme.background },
        }}
      >
        <Tabs.Screen
          name="home"
          options={{
            tabBarIcon: ({ color, size }) => (
              <Ionicons name="home" size={size} color={color} />
            ),
          }}
        />
        <Tabs.Screen
          name="profile"
          options={{
            tabBarIcon: ({ color, size }) => (
              <Ionicons name="person" size={size} color={color} />
            ),
          }}
        />
      </Tabs>
      {!isHomeOverlayScreen && <FloatingAddButton />}
    </View>
  );
}

const makeStyles = (theme: Theme, bottom: number) =>
  StyleSheet.create({
    container: {
      flex: 1,
      backgroundColor: theme.background,
    },
    floatingButtonContainer: {
      position: "absolute",
      bottom: bottom + 12,
      alignSelf: "center",
      zIndex: 999,
    },
    floatingButton: {
      width: 56,
      height: 56,
      borderRadius: BORDER_RADIUS.full,
      backgroundColor: theme.activeTab,
      justifyContent: "center",
      alignItems: "center",
    },
  });
