import { COLORS, Theme } from "@/constants/theme";
import { useColorScheme } from "react-native";

export function useTheme(): Theme {
  // 'light' | 'dark' | null
  const scheme = useColorScheme();
  return COLORS[scheme === "light" ? "light" : "dark"];
}
