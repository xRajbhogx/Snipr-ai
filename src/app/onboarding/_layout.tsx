import { Stack } from "expo-router/stack";
import { useTheme } from "@/hooks/useTheme";
import React from "react";

function OnboardingLayout() {
  const theme = useTheme();

  return (
    <Stack
      screenOptions={{
        headerShown: false,
        contentStyle: { backgroundColor: theme.background },
        animation: "slide_from_right",
      }}
    >
      <Stack.Screen name="index" />
      <Stack.Screen name="language" />
      <Stack.Screen name="apikey" />
    </Stack>
  );
}

export default OnboardingLayout;
