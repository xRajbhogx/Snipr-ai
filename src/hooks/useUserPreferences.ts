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

let cachedPreferences: UserPreferences | null = null;
let preferencesLoadPromise: Promise<UserPreferences> | null = null;

/**
 * Loads preferences once per session and reuses the cached value.
 */
export function warmPreferencesCache(): Promise<UserPreferences> {
  if (cachedPreferences) {
    return Promise.resolve(cachedPreferences);
  }
  if (!preferencesLoadPromise) {
    preferencesLoadPromise = loadPreferences().then((prefs) => {
      cachedPreferences = prefs;
      return prefs;
    });
  }
  return preferencesLoadPromise;
}

/**
 * Reads all preferences from AsyncStorage in one call.
 */
export async function loadPreferences(): Promise<UserPreferences> {
  try {
    const raw = await AsyncStorage.getItem(PREFS_KEY);
    if (raw) {
      const prefs = {
        ...DEFAULT_PREFERENCES,
        ...(JSON.parse(raw) as Partial<UserPreferences>),
      };
      cachedPreferences = prefs;
      return prefs;
    }
  } catch (error) {
    console.error("Failed to load user preferences:", error);
  }
  cachedPreferences = DEFAULT_PREFERENCES;
  return DEFAULT_PREFERENCES;
}

/**
 * Merges a partial update into the persisted preferences.
 */
export async function savePreferences(update: Partial<UserPreferences>): Promise<void> {
  try {
    const current = await loadPreferences();
    const merged = { ...current, ...update };
    cachedPreferences = merged;
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
  const [preferences, setPreferences] = useState<UserPreferences>(
    () => cachedPreferences ?? DEFAULT_PREFERENCES,
  );
  const [isLoading, setIsLoading] = useState(() => cachedPreferences === null);

  useEffect(() => {
    let cancelled = false;
    warmPreferencesCache().then((prefs) => {
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
      cachedPreferences = next;
      setPreferences(next);
      await savePreferences(update);
    },
    [preferences]
  );

  return { preferences, updatePreferences, isLoading };
}
