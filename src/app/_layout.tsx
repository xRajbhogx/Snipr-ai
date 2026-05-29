import { runMigrations } from "@/services/db/migrations";
import { Stack } from "expo-router/stack";
import { useEffect, useState } from "react";
import * as SplashScreen from "expo-splash-screen";
import { ThemeProvider, useThemeContext } from "@/context/ThemeContext";
import { initializeFileSystem } from "@/services/fileService";
import AsyncStorage from "@react-native-async-storage/async-storage";
import * as FileSystem from "expo-file-system/legacy";
import { deleteDatabaseSync } from "expo-sqlite";
import { closeDatabase } from "@/services/db/client";

// Prevent the splash screen from auto-hiding before resources are loaded.
SplashScreen.preventAutoHideAsync().catch(() => {
  /* ignore error if called multiple times */
});

function RootLayoutContent() {
  const { isThemeLoading } = useThemeContext();
  const [dbReady, setDbReady] = useState(false);
  const [fsReady, setFsReady] = useState(false);

  useEffect(() => {
    async function initApp() {
      try {
        const resetFileUri = `${FileSystem.documentDirectory}reset_pending`;
        const resetInfo = await FileSystem.getInfoAsync(resetFileUri);
        if (resetInfo.exists) {
          // 1. Delete SQLite database natively
          try {
            closeDatabase();
            deleteDatabaseSync('snipr.db');
          } catch (dbErr) {
            console.error("Failed to delete database:", dbErr);
          }

          // 2. Delete SQLite folder in documents directory (just in case)
          const dbDir = `${FileSystem.documentDirectory}SQLite/`;
          await FileSystem.deleteAsync(dbDir, { idempotent: true });
          
          // 3. Delete Documents directory
          const docsDir = `${FileSystem.documentDirectory}Documents/`;
          await FileSystem.deleteAsync(docsDir, { idempotent: true });
          
          // 4. Clear AsyncStorage
          await AsyncStorage.clear();
          
          // 5. Delete the reset pending file
          await FileSystem.deleteAsync(resetFileUri, { idempotent: true });
        }
      } catch (e) {
        console.error(e);
      }

      // Now run migrations and init file system
      try {
        runMigrations();
        setDbReady(true);
      } catch (error) {
        console.error(error);
        setDbReady(true); // Proceed anyway
      }

      try {
        await initializeFileSystem();
        setFsReady(true);
      } catch (error) {
        console.error(error);
        setFsReady(true); // Proceed anyway
      }
    }

    initApp();
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

