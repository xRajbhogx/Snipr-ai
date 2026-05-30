import { useTheme } from "@/hooks/useTheme";
import { Stack } from "expo-router/stack";

export default function ProfileLayout() {
  const theme = useTheme();

  return (
    <Stack
      screenOptions={{
        headerShown: false,
        contentStyle: { backgroundColor: theme.background },
      }}
    >
      <Stack.Screen name="index" />
    </Stack>
  );
}
