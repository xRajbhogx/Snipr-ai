import React, {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
} from "react";
import { useColorScheme } from "react-native";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { COLORS, Theme } from "@/constants/theme";

export type ThemePreference = "system" | "light" | "dark";

interface ThemeContextType {
  theme: Theme;
  themePreference: ThemePreference;
  setThemePreference: (pref: ThemePreference) => Promise<void>;
  isThemeLoading: boolean;
}

const ThemeContext = createContext<ThemeContextType | undefined>(undefined);

export const THEME_PREF_KEY = "@snipr_theme_preference";

export const ThemeProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const deviceScheme = useColorScheme();
  const [themePreference, setThemePreferenceState] = useState<ThemePreference>("system");
  const [isThemeLoading, setIsThemeLoading] = useState(true);
  // Load saved preference on mount
  useEffect(() => {
    const loadPreference = async () => {
      try {
        const savedPref = await AsyncStorage.getItem(THEME_PREF_KEY);
        if (savedPref) {
          setThemePreferenceState(savedPref as ThemePreference);
        }
      } catch (error) {
        // Fail silently
      } finally {
        setIsThemeLoading(false);
      }
    };
    loadPreference();
  }, []);

  // Derive active theme synchronously — avoids double render from state+effect
  const activeTheme = useMemo<Theme>(() => {
    if (themePreference === "system") {
      return deviceScheme === "dark" ? COLORS.dark : COLORS.light;
    }
    return themePreference === "dark" ? COLORS.dark : COLORS.light;
  }, [themePreference, deviceScheme]);

  const setThemePreference = useCallback(async (pref: ThemePreference) => {
    try {
      await AsyncStorage.setItem(THEME_PREF_KEY, pref);
      setThemePreferenceState(pref);
    } catch (error) {
      // Fail silently
    }
  }, []);

  const contextValue = useMemo(
    () => ({
      theme: activeTheme,
      themePreference,
      setThemePreference,
      isThemeLoading,
    }),
    [activeTheme, themePreference, setThemePreference, isThemeLoading],
  );

  return (
    <ThemeContext.Provider value={contextValue}>
      {children}
    </ThemeContext.Provider>
  );
};

export const useThemeContext = () => {
  const context = useContext(ThemeContext);
  if (!context) {
    throw new Error("useThemeContext must be used within a ThemeProvider");
  }
  return context;
};
