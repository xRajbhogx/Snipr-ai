import AsyncStorage from "@react-native-async-storage/async-storage";
import { useState, useEffect, useCallback } from "react";

export type SortOrder = "newest" | "oldest" | "alphabetical";

export interface UserPreferences {
  defaultLanguage: string;
  sortOrder: SortOrder;
}

const PREFS_KEY = "@snipr_user_preferences";

const DEFAULT_PREFERENCES: UserPreferences = {
  defaultLanguage: "TypeScript",
  sortOrder: "newest",
};

/**
 * Reads all preferences from AsyncStorage in one call.
 */
export async function loadPreferences(): Promise<UserPreferences> {
  try {
    const raw = await AsyncStorage.getItem(PREFS_KEY);
    if (raw) {
      return { ...DEFAULT_PREFERENCES, ...(JSON.parse(raw) as Partial<UserPreferences>) };
    }
  } catch (error) {
    console.error("Failed to load user preferences:", error);
  }
  return DEFAULT_PREFERENCES;
}

/**
 * Merges a partial update into the persisted preferences.
 */
export async function savePreferences(update: Partial<UserPreferences>): Promise<void> {
  try {
    const current = await loadPreferences();
    const merged = { ...current, ...update };
    await AsyncStorage.setItem(PREFS_KEY, JSON.stringify(merged));
  } catch (error) {
    console.error("Failed to save user preferences:", error);
  }
}

/**
 * Hook: gives components live access to user preferences and a setter.
 * All preference fields are read from AsyncStorage once on mount.
 */
export function useUserPreferences() {
  const [preferences, setPreferences] = useState<UserPreferences>(DEFAULT_PREFERENCES);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;
    loadPreferences().then((prefs) => {
      if (!cancelled) {
        setPreferences(prefs);
        setIsLoading(false);
      }
    });
    return () => {
      cancelled = true;
    };
  }, []);

  const updatePreferences = useCallback(
    async (update: Partial<UserPreferences>) => {
      const next = { ...preferences, ...update };
      setPreferences(next);
      await savePreferences(update);
    },
    [preferences]
  );

  return { preferences, updatePreferences, isLoading };
}
