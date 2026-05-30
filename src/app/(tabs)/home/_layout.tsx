import { useTheme } from "@/hooks/useTheme";
import { Stack } from "expo-router/stack";

export default function HomeLayout() {
  const theme = useTheme();

  return (
    <Stack
      screenOptions={{
        headerShown: false,
        contentStyle: { backgroundColor: theme.background },
        animation: "simple_push",
      }}
    >
      <Stack.Screen name="index" />
      <Stack.Screen name="SearchScreen" />
      <Stack.Screen name="AllSnippetsScreen" />
      <Stack.Screen name="FavouritesScreen" />
    </Stack>
  );
}
