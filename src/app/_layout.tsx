import { runMigrations } from "@/services/db/migrations";
import { Stack } from "expo-router/stack";
import { useEffect } from "react";

export default function RootLayout() {
  
  useEffect(() => {
    try {
      runMigrations();
    } catch (error) {
      console.error("Failed to run database migrations:", error);
    }
  }, []);

  return (
    <Stack screenOptions={{ headerShown: false }}>
      <Stack.Screen name="(tabs)" />
      <Stack.Screen name="CreateSnippetScreen"
        options={{
          presentation: 'modal',
          headerShown: false
        }}
      />
    </Stack>
  );
}
