import { StyleSheet } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { Theme } from "./theme";

export const useGlobalStyles = (theme: Theme) => {
  const { top, bottom, left, right } = useSafeAreaInsets();

  return StyleSheet.create({
    screenContainer: {
      flex: 1,
      paddingTop: top,
      paddingBottom: bottom,
      paddingLeft: left + 10,
      paddingRight: right + 10,
      backgroundColor: theme.background,
    },
  });
};