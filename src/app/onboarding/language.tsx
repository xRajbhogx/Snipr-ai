import React, { useState } from "react";
import { StyleSheet, Text, View, Pressable, ScrollView } from "react-native";
import { router } from "expo-router";
import Animated, { FadeInDown, FadeInUp } from "react-native-reanimated";
import { MaterialCommunityIcons } from "@expo/vector-icons";
import {
  BORDER_RADIUS,
  FONT_FAMILY,
  FONT_SIZE,
  FONT_WEIGHT,
  ICON_SIZE,
  SHADOW,
  SPACING,
  Theme,
} from "@/constants/theme";
import { useGlobalStyles } from "@/constants/useGlobalStyles";
import { useTheme } from "@/hooks/useTheme";
import { useThemedStyles } from "@/hooks/useThemedStyles";
import { useUserPreferences } from "@/hooks/useUserPreferences";

const LANGUAGES = [
  { label: "TypeScript", icon: "language-typescript" },
  { label: "JavaScript", icon: "language-javascript" },
  { label: "Python", icon: "language-python" },
  { label: "Go", icon: "language-go" },
  { label: "Rust", icon: "language-rust" },
  { label: "Swift", icon: "language-swift" },
  { label: "Kotlin", icon: "language-kotlin" },
  { label: "Java", icon: "language-java" },
  { label: "C++", icon: "language-cpp" },
  { label: "C#", icon: "language-csharp" },
];

function LanguageSelectionScreen() {
  const theme = useTheme();
  const globalStyles = useGlobalStyles(theme);
  const styles = useThemedStyles(makeStyles, theme);
  const { preferences, updatePreferences } = useUserPreferences();
  const [selectedLang, setSelectedLang] = useState(preferences.defaultLanguage || "TypeScript");

  const handleContinue = async () => {
    try {
      await updatePreferences({ defaultLanguage: selectedLang });
      router.push("/onboarding/apikey" as any);
    } catch (e) {
      // Proceed anyway
      router.push("/onboarding/apikey" as any);
    }
  };

  return (
    <View style={globalStyles.screenContainer}>
      {/* Header Info */}
      <Animated.View entering={FadeInUp.duration(500)} style={styles.header}>
        <Pressable 
          onPress={() => router.back()} 
          style={styles.backButton}
          hitSlop={{ top: 15, bottom: 15, left: 15, right: 15 }}
        >
          <MaterialCommunityIcons name="arrow-left" size={ICON_SIZE.lg} color={theme.text} />
        </Pressable>
        <Text style={styles.title}>Preferred Language</Text>
        <Text style={styles.subtitle}>
          Select your primary programming language. Snipr will pre-fill this when you create new snippets.
        </Text>
      </Animated.View>

      {/* Grid of Languages */}
      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.scrollBody}
      >
        <View style={styles.gridContainer}>
          {LANGUAGES.map((lang, index) => {
            const isSelected = selectedLang === lang.label;
            return (
              <Animated.View
                key={lang.label}
                entering={FadeInDown.duration(400).delay(index * 50)}
                style={styles.gridItemWrapper}
              >
                <Pressable
                  onPress={() => setSelectedLang(lang.label)}
                  style={({ pressed }) => [
                    styles.langCard,
                    isSelected && styles.langCardSelected,
                    pressed && styles.langCardPressed,
                  ]}
                >
                  <MaterialCommunityIcons
                    name={lang.icon as any}
                    size={ICON_SIZE.xl}
                    color={isSelected ? theme.activeTab : theme.mutedText}
                  />
                  <Text
                    style={[
                      styles.langLabel,
                      isSelected && styles.langLabelSelected,
                    ]}
                  >
                    {lang.label}
                  </Text>
                  {isSelected && (
                    <View style={styles.checkIndicator}>
                      <MaterialCommunityIcons
                        name="check-circle"
                        size={ICON_SIZE.sm + 2}
                        color={theme.activeTab}
                      />
                    </View>
                  )}
                </Pressable>
              </Animated.View>
            );
          })}
        </View>
      </ScrollView>

      {/* Footer Continue Action */}
      <View style={styles.footer}>
        <Pressable
          onPress={handleContinue}
          style={({ pressed }) => [
            styles.continueButton,
            pressed && styles.continueButtonPressed,
          ]}
        >
          <Text style={styles.continueButtonText}>Continue</Text>
          <MaterialCommunityIcons
            name="chevron-right"
            size={ICON_SIZE.lg}
            color={theme.white}
          />
        </Pressable>
      </View>
    </View>
  );
}

export default LanguageSelectionScreen;

const makeStyles = (theme: Theme) =>
  StyleSheet.create({
    header: {
      marginTop: SPACING.md,
      marginBottom: SPACING.lg,
    },
    backButton: {
      marginBottom: SPACING.md,
      alignSelf: "flex-start",
    },
    title: {
      fontSize: FONT_SIZE.xl + 2,
      fontFamily: FONT_FAMILY.bold,
      fontWeight: FONT_WEIGHT.bold,
      color: theme.text,
      marginBottom: SPACING.xs,
    },
    subtitle: {
      fontSize: FONT_SIZE.md - 1,
      fontFamily: FONT_FAMILY.regular,
      color: theme.mutedText,
      lineHeight: 20,
    },
    scrollBody: {
      flexGrow: 1,
      paddingBottom: SPACING.xl,
    },
    gridContainer: {
      flexDirection: "row",
      flexWrap: "wrap",
      marginHorizontal: -SPACING.xs,
    },
    gridItemWrapper: {
      width: "50%",
      padding: SPACING.xs,
    },
    langCard: {
      backgroundColor: theme.card,
      borderColor: theme.cardBorder,
      borderWidth: 1,
      borderRadius: BORDER_RADIUS.md,
      paddingVertical: SPACING.lg,
      alignItems: "center",
      justifyContent: "center",
      position: "relative",
      height: 110,
      ...SHADOW.sm,
    },
    langCardSelected: {
      borderColor: theme.activeTab,
      backgroundColor: theme.activeTabSoft,
    },
    langCardPressed: {
      opacity: 0.95,
      transform: [{ scale: 0.98 }],
    },
    langLabel: {
      fontSize: FONT_SIZE.sm + 1,
      fontFamily: FONT_FAMILY.medium,
      fontWeight: FONT_WEIGHT.medium,
      color: theme.mutedText,
      marginTop: SPACING.sm,
    },
    langLabelSelected: {
      color: theme.text,
      fontFamily: FONT_FAMILY.semibold,
      fontWeight: FONT_WEIGHT.semibold,
    },
    checkIndicator: {
      position: "absolute",
      top: SPACING.sm,
      right: SPACING.sm,
    },
    footer: {
      paddingVertical: SPACING.md,
      backgroundColor: theme.background,
    },
    continueButton: {
      flexDirection: "row",
      backgroundColor: theme.activeTab,
      paddingVertical: SPACING.md,
      borderRadius: BORDER_RADIUS.md,
      justifyContent: "center",
      alignItems: "center",
      ...SHADOW.md,
    },
    continueButtonPressed: {
      opacity: 0.9,
      transform: [{ scale: 0.98 }],
    },
    continueButtonText: {
      fontSize: FONT_SIZE.md,
      fontFamily: FONT_FAMILY.semibold,
      fontWeight: FONT_WEIGHT.semibold,
      color: theme.white,
      marginRight: SPACING.xs,
    },
  });
