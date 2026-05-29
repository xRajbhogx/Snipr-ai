import { Theme } from "@/constants/theme";
import { useThemeContext } from "@/context/ThemeContext";

export function useTheme(): Theme {
  return useThemeContext().theme;
}

export function useThemePreference() {
  const { themePreference, setThemePreference, isThemeLoading } = useThemeContext();
  return { themePreference, setThemePreference, isThemeLoading };
}

