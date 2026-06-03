import React from "react";
import {
  Modal,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from "react-native";
import Animated, { SlideInDown, SlideOutDown } from "react-native-reanimated";
import { MaterialCommunityIcons } from "@expo/vector-icons";

import {
  BORDER_RADIUS,
  FONT_FAMILY,
  FONT_SIZE,
  FONT_WEIGHT,
  ICON_SIZE,
  SPACING,
  Theme,
} from "@/constants/theme";
import { useTheme } from "@/hooks/useTheme";
import { useThemedStyles } from "@/hooks/useThemedStyles";
import type { ThemePreference } from "@/context/ThemeContext";
import type { SortOrder } from "@/hooks/useUserPreferences";

interface AppPreferencesModalProps {
  visible: boolean;
  onClose: () => void;
  themePreference: ThemePreference;
  onThemeChange: (pref: ThemePreference) => void;
  sortOrder: SortOrder;
  onSortOrderChange: (order: SortOrder) => void;
  defaultLanguage: string;
  onOpenLanguageSelector: () => void;
}

const AppPreferencesModal = ({
  visible,
  onClose,
  themePreference,
  onThemeChange,
  sortOrder,
  onSortOrderChange,
  defaultLanguage,
  onOpenLanguageSelector,
}: AppPreferencesModalProps) => {
  const theme = useTheme();
  const styles = useThemedStyles(makeStyles, theme);

  return (
    <Modal
      visible={visible}
      transparent={true}
      animationType="slide"
      onRequestClose={onClose}
    >
      <View style={styles.modalBackdrop}>
        <Animated.View
          entering={SlideInDown.duration(300)}
          exiting={SlideOutDown.duration(250)}
          style={styles.modalContent}
        >
          {/* Header */}
          <View style={styles.modalHeader}>
            <Text style={styles.modalTitle}>App Preferences</Text>
            <Pressable onPress={onClose} style={styles.modalCloseButton}>
              <MaterialCommunityIcons name="close" size={ICON_SIZE.lg} color={theme.text} />
            </Pressable>
          </View>

          <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.modalScrollBody}>
            {/* App Theme */}
            <Text style={styles.cardLabel}>App Theme</Text>
            <View style={styles.themeSelector}>
              {(["system", "light", "dark"] as ThemePreference[]).map((pref) => {
                const isActive = themePreference === pref;
                const iconMap = {
                  system: "laptop",
                  light: "weather-sunny",
                  dark: "weather-night",
                };
                const labelMap = {
                  system: "System",
                  light: "Light",
                  dark: "Dark",
                };

                return (
                  <Pressable
                    key={pref}
                    onPress={() => onThemeChange(pref)}
                    style={({ pressed }) => [
                      styles.themeButton,
                      isActive && styles.themeButtonActive,
                      pressed && styles.themeButtonPressed,
                    ]}
                  >
                    <MaterialCommunityIcons
                      name={iconMap[pref] as any}
                      size={ICON_SIZE.md}
                      color={isActive ? theme.white : theme.mutedText}
                      style={styles.themeIcon}
                    />
                    <Text
                      style={[
                        styles.themeText,
                        isActive && styles.themeTextActive,
                      ]}
                    >
                      {labelMap[pref]}
                    </Text>
                  </Pressable>
                );
              })}
            </View>

            <View style={styles.modalDivider} />

            {/* Default Sort Order */}
            <Text style={styles.cardLabel}>Default Sort Order</Text>
            <View style={styles.themeSelector}>
              {(["newest", "oldest", "alphabetical"] as SortOrder[]).map((order) => {
                const isActive = sortOrder === order;
                const iconMap = {
                  newest: "sort-clock-descending",
                  oldest: "sort-clock-ascending",
                  alphabetical: "sort-alphabetical-ascending",
                };
                const labelMap = {
                  newest: "Newest",
                  oldest: "Oldest",
                  alphabetical: "A-Z",
                };

                return (
                  <Pressable
                    key={order}
                    onPress={() => onSortOrderChange(order)}
                    style={({ pressed }) => [
                      styles.themeButton,
                      isActive && styles.themeButtonActive,
                      pressed && styles.themeButtonPressed,
                    ]}
                  >
                    <MaterialCommunityIcons
                      name={iconMap[order] as any}
                      size={ICON_SIZE.md}
                      color={isActive ? theme.white : theme.mutedText}
                      style={styles.themeIcon}
                    />
                    <Text
                      style={[
                        styles.themeText,
                        isActive && styles.themeTextActive,
                      ]}
                    >
                      {labelMap[order]}
                    </Text>
                  </Pressable>
                );
              })}
            </View>

            <View style={styles.modalDivider} />

            {/* Default Language Action Row */}
            <Text style={styles.cardLabel}>Default Language</Text>
            <Pressable
              onPress={onOpenLanguageSelector}
              style={({ pressed }) => [
                styles.actionButton,
                pressed && styles.actionButtonPressed,
              ]}
            >
              <View style={styles.actionLeft}>
                <MaterialCommunityIcons
                  name="code-json"
                  size={ICON_SIZE.md}
                  color={theme.text}
                />
                <Text style={styles.actionText}>{defaultLanguage}</Text>
              </View>
              <MaterialCommunityIcons
                name="chevron-right"
                size={ICON_SIZE.md}
                color={theme.mutedText}
              />
            </Pressable>
          </ScrollView>
        </Animated.View>
      </View>
    </Modal>
  );
};

export default React.memo(AppPreferencesModal);

const makeStyles = (theme: Theme) =>
  StyleSheet.create({
    modalBackdrop: {
      flex: 1,
      backgroundColor: theme.overlay,
      justifyContent: "flex-end",
    },
    modalContent: {
      backgroundColor: theme.background,
      borderTopLeftRadius: BORDER_RADIUS.lg,
      borderTopRightRadius: BORDER_RADIUS.lg,
      paddingHorizontal: SPACING.md,
      paddingTop: SPACING.md,
      paddingBottom: SPACING.xl,
      height: "75%",
      borderColor: theme.cardBorder,
      borderTopWidth: 1,
    },
    modalHeader: {
      flexDirection: "row",
      justifyContent: "space-between",
      alignItems: "center",
      paddingBottom: SPACING.md,
      borderBottomWidth: 1,
      borderBottomColor: theme.cardBorder,
      marginBottom: SPACING.sm,
    },
    modalTitle: {
      fontSize: FONT_SIZE.lg,
      fontFamily: FONT_FAMILY.bold,
      fontWeight: FONT_WEIGHT.bold,
      color: theme.text,
    },
    modalCloseButton: {
      padding: SPACING.xs,
    },
    modalScrollBody: {
      paddingBottom: SPACING.xl,
    },
    cardLabel: {
      fontSize: FONT_SIZE.md - 1,
      fontFamily: FONT_FAMILY.bold,
      fontWeight: FONT_WEIGHT.bold,
      color: theme.text,
      marginBottom: SPACING.md,
      marginTop: SPACING.sm,
    },
    themeSelector: {
      flexDirection: "row",
      backgroundColor: theme.tagBg,
      borderRadius: BORDER_RADIUS.md,
      padding: SPACING.xs - 2,
      marginBottom: SPACING.xs,
      gap: 2,
    },
    themeButton: {
      flex: 1,
      flexDirection: "row",
      alignItems: "center",
      justifyContent: "center",
      paddingVertical: SPACING.sm,
      borderRadius: BORDER_RADIUS.sm,
      gap: SPACING.xs,
    },
    themeButtonActive: {
      backgroundColor: theme.activeTab,
    },
    themeButtonPressed: {
      opacity: 0.8,
    },
    themeIcon: {
      marginRight: 2,
    },
    themeText: {
      fontSize: FONT_SIZE.sm + 1,
      fontFamily: FONT_FAMILY.medium,
      fontWeight: FONT_WEIGHT.medium,
      color: theme.mutedText,
    },
    themeTextActive: {
      color: theme.white,
      fontFamily: FONT_FAMILY.semibold,
      fontWeight: FONT_WEIGHT.semibold,
    },
    modalDivider: {
      height: 1,
      backgroundColor: theme.cardBorder,
      marginVertical: SPACING.md,
    },
    actionButton: {
      flexDirection: "row",
      alignItems: "center",
      justifyContent: "space-between",
      paddingVertical: SPACING.md,
      paddingHorizontal: SPACING.md,
      backgroundColor: theme.tagBg,
      borderRadius: BORDER_RADIUS.md,
      borderWidth: 1,
      borderColor: theme.cardBorder,
      marginBottom: SPACING.sm,
    },
    actionButtonPressed: {
      opacity: 0.7,
    },
    actionLeft: {
      flexDirection: "row",
      alignItems: "center",
      gap: SPACING.sm,
    },
    actionText: {
      fontSize: FONT_SIZE.md - 1,
      fontFamily: FONT_FAMILY.semibold,
      fontWeight: FONT_WEIGHT.semibold,
      color: theme.text,
    },
  });
