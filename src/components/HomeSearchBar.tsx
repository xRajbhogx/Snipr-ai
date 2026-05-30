import {
    BORDER_RADIUS,
    FONT_FAMILY,
    FONT_SIZE,
    ICON_SIZE,
    SPACING,
    Theme,
} from "@/constants/theme";
import { useTheme } from "@/hooks/useTheme";
import { useThemedStyles } from "@/hooks/useThemedStyles";
import { MaterialCommunityIcons } from "@expo/vector-icons";
import React, { memo, useCallback } from "react";
import { StyleSheet, TextInput, View, Pressable } from "react-native";

interface HomeSearchBarProps {
  value?: string;
  onChangeText?: (text: string) => void;
  autoFocus?: boolean;
  editable?: boolean;
  placeholder?: string;
  pointerEvents?: "box-none" | "none" | "box-only" | "auto";
}

const HomeSearchBar = memo(
  React.forwardRef<TextInput, HomeSearchBarProps>(function HomeSearchBar(
    {
      value,
      onChangeText,
      autoFocus,
      editable = true,
      placeholder = "Search snippets, files, or tags",
      pointerEvents,
    },
    ref,
  ) {
    const theme = useTheme();
    const styles = useThemedStyles(makeStyles, theme);

    const handleClear = useCallback(() => {
      onChangeText?.("");
    }, [onChangeText]);

    return (
      <View style={styles.container} pointerEvents={pointerEvents}>
        <MaterialCommunityIcons
          name="magnify"
          size={ICON_SIZE.lg}
          color={theme.mutedText}
          style={styles.icon}
        />
        <TextInput
          ref={ref}
          style={styles.input}
          placeholder={placeholder}
          placeholderTextColor={theme.mutedText}
          selectionColor={theme.activeTab}
          value={value}
          onChangeText={onChangeText}
          autoFocus={autoFocus}
          editable={editable}
          returnKeyType="search"
        />
        {editable && value && value.length > 0 && (
          <Pressable onPress={handleClear} style={styles.clearButton}>
            <MaterialCommunityIcons
              name="close-circle"
              size={ICON_SIZE.md}
              color={theme.mutedText}
            />
          </Pressable>
        )}
      </View>
    );
  }),
);

HomeSearchBar.displayName = "HomeSearchBar";

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
      padding: 0,
    },
    clearButton: {
      marginLeft: SPACING.xs,
      padding: SPACING.xs,
    },
  });
