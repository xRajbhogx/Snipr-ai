import { runMigrations } from "@/services/db/migrations";
import { Stack } from "expo-router/stack";
import { useEffect } from "react";

export default function RootLayout() {
  
  useEffect(() => {
    runMigrations()
  }, []);

  return (
    <Stack screenOptions={{ headerShown: false }}>
      <Stack.Screen name="(tabs)" />
    </Stack>
  );
}
