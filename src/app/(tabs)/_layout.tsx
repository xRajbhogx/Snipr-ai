import { BORDER_RADIUS, SHADOW, Theme } from "@/constants/theme";
import { useTheme } from "@/hooks/useTheme";
import Ionicons from "@expo/vector-icons/Ionicons";
import { Tabs, router } from "expo-router";
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

export default function RootLayout() {
  const theme = useTheme();
  const { bottom } = useSafeAreaInsets();
  const styles = makeStyles(theme, bottom);

  return (
    <View style={styles.container}>
      <Tabs
        screenOptions={{
          headerShown: false,
          tabBarActiveTintColor: theme.activeTab,
          tabBarInactiveTintColor: theme.inactiveTab,
          tabBarStyle: {
            backgroundColor: theme.background,
            borderTopWidth: 1,
            borderTopColor: theme.cardBorder,
            elevation: 2,
            paddingTop: 3,
          },
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
      <FloatingAddButton />
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
