import { COLORS, Theme } from "@/constants/theme";
import {
  DarkTheme,
  DefaultTheme,
  Theme as NavigationTheme,
} from "@react-navigation/native";

export const getNavigationTheme = (theme: Theme): NavigationTheme => {
  const isDark = theme.background === COLORS.dark.background;
  const base = isDark ? DarkTheme : DefaultTheme;

  return {
    ...base,
    colors: {
      ...base.colors,
      primary: theme.activeTab,
      background: theme.background,
      card: theme.background,
      text: theme.text,
      border: theme.cardBorder,
    },
  };
};
