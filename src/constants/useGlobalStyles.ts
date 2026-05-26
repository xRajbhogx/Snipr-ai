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
      paddingLeft: left + 14,
      paddingRight: right + 14,
      backgroundColor: theme.background,
    },
    tabScreenContainer: {
      flex: 1,
      paddingTop: top,
      paddingLeft: left + 14,
      paddingRight: right + 14,
      backgroundColor: theme.background,
    },
    tabScreenContentContainer: {
      flexGrow: 1,
      paddingTop: top,
      paddingLeft: left + 14,
      paddingRight: right + 14,
      backgroundColor: theme.background,
    },
    headerRow: {
      flexDirection: "row",
      alignItems: "center",
    }
  });
};