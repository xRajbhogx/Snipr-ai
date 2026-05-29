import {
    BORDER_RADIUS,
    FONT_FAMILY,
    FONT_SIZE,
    ICON_SIZE,
    SPACING,
    Theme,
} from "@/constants/theme";
import { useTheme } from "@/hooks/useTheme";
import { MaterialCommunityIcons } from "@expo/vector-icons";
import React from "react";
import { StyleSheet, TextInput, View } from "react-native";

interface HomeSearchBarProps {
  value?: string;
  onChangeText?: (text: string) => void;
}

const HomeSearchBar = ({ value, onChangeText }: HomeSearchBarProps) => {
  const theme = useTheme();
  const styles = makeStyles(theme);

  return (
    <View style={styles.container}>
      <MaterialCommunityIcons
        name="magnify"
        size={ICON_SIZE.lg}
        color={theme.mutedText}
        style={styles.icon}
      />
      <TextInput
        style={styles.input}
        placeholder="Search snippets, files, or tags"
        placeholderTextColor={theme.mutedText}
        selectionColor={theme.activeTab}
        value={value}
        onChangeText={onChangeText}
      />
    </View>
  );
};

export default HomeSearchBar;

const makeStyles = (theme: Theme) =>
  StyleSheet.create({
    container: {
      flexDirection: "row",
      alignItems: "center",
      backgroundColor: theme.card,
      borderRadius: BORDER_RADIUS.lg,
      borderWidth: 1,
      borderColor: theme.cardBorder,
      paddingHorizontal: SPACING.md,
      paddingVertical: SPACING.sm,
      elevation: 4,
      shadowOffset: { width: 0, height: 2 },
      shadowOpacity: 0.25,
      shadowRadius: 6,
    },
    icon: {
      marginRight: SPACING.sm,
    },
    input: {
      flex: 1,
      fontSize: FONT_SIZE.md,
      fontFamily: FONT_FAMILY.medium,
      color: theme.text,
    },
  });
