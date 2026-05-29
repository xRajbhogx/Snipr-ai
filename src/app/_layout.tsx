import { runMigrations } from "@/services/db/migrations";
import { Stack } from "expo-router/stack";
import { useEffect, useState } from "react";
import * as SplashScreen from "expo-splash-screen";
import { ThemeProvider, useThemeContext } from "@/context/ThemeContext";

// Prevent the splash screen from auto-hiding before resources are loaded.
SplashScreen.preventAutoHideAsync().catch(() => {
  /* ignore error if called multiple times */
});

function RootLayoutContent() {
  const { isThemeLoading } = useThemeContext();
  const [dbReady, setDbReady] = useState(false);

  useEffect(() => {
    try {
      runMigrations();
      setDbReady(true);
    } catch (error) {
      console.error("Failed to run database migrations:", error);
      setDbReady(true); // Proceed anyway
    }
  }, []);

  useEffect(() => {
    if (!isThemeLoading && dbReady) {
      SplashScreen.hideAsync().catch(() => {});
    }
  }, [isThemeLoading, dbReady]);

  if (isThemeLoading || !dbReady) {
    return null;
  }

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

export default function RootLayout() {
  return (
    <ThemeProvider>
      <RootLayoutContent />
    </ThemeProvider>
  );
}

