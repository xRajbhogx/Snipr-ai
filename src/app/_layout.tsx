import { runMigrations } from "@/services/db/migrations";
import { Stack } from "expo-router/stack";
import { useEffect, useState } from "react";
import * as SplashScreen from "expo-splash-screen";
import { ThemeProvider, useThemeContext } from "@/context/ThemeContext";
import { initializeFileSystem } from "@/services/fileService";

// Prevent the splash screen from auto-hiding before resources are loaded.
SplashScreen.preventAutoHideAsync().catch(() => {
  /* ignore error if called multiple times */
});

function RootLayoutContent() {
  const { isThemeLoading } = useThemeContext();
  const [dbReady, setDbReady] = useState(false);
  const [fsReady, setFsReady] = useState(false);

  useEffect(() => {
    try {
      runMigrations();
      setDbReady(true);
    } catch (error) {
      console.error("Failed to run database migrations:", error);
      setDbReady(true); // Proceed anyway
    }

    initializeFileSystem()
      .then(() => {
        setFsReady(true);
      })
      .catch((error) => {
        console.error("Failed to initialize file system:", error);
        setFsReady(true); // Proceed anyway
      });
  }, []);

  useEffect(() => {
    if (!isThemeLoading && dbReady && fsReady) {
      SplashScreen.hideAsync().catch(() => {});
    }
  }, [isThemeLoading, dbReady, fsReady]);

  if (isThemeLoading || !dbReady || !fsReady) {
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

