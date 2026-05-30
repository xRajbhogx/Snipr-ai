import { Theme } from "@/constants/theme";
import { StyleProp, ViewStyle } from "react-native";

export const getTabBarStyle = (theme: Theme): StyleProp<ViewStyle> => ({
  backgroundColor: theme.background,
  borderTopWidth: 1,
  borderTopColor: theme.cardBorder,
  elevation: 2,
  paddingTop: 3,
});
