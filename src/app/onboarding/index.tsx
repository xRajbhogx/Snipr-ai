import React from "react";
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

const FEATURES = [
  {
    icon: "database",
    title: "Offline-First Vault",
    description: "Keep your code snippets stored locally using a high-performance SQLite database. Safe, fast, and accessible offline.",
    color: "#ff4d4d",
    bgColor: "rgba(255, 77, 77, 0.1)",
  },
  {
    icon: "brain",
    title: "AI Code Companion",
    description: "Understand complex logic, generate documentation, or suggest optimization using Gemini, Claude, or OpenAI.",
    color: "#a855f7",
    bgColor: "rgba(168, 85, 247, 0.1)",
  },
  {
    icon: "crop-free",
    title: "OCR-Based Extraction",
    description: "Scan programming code directly from tutorials, screenshots, or videos and import them instantly as editable files.",
    color: "#22C55E",
    bgColor: "rgba(34, 197, 94, 0.1)",
  },
];

function WelcomeScreen() {
  const theme = useTheme();
  const globalStyles = useGlobalStyles(theme);
  const styles = useThemedStyles(makeStyles, theme);

  const handleGetStarted = () => {
    router.push("/onboarding/language" as any);
  };

  return (
    <View style={globalStyles.screenContainer}>
      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.scrollContent}
      >
        {/* Brand / Logo Section */}
        <Animated.View 
          entering={FadeInUp.duration(600).delay(100)} 
          style={styles.logoSection}
        >
          <View style={styles.logoBadge}>
            <MaterialCommunityIcons name="xml" size={ICON_SIZE.xl} color={theme.white} />
          </View>
          <Text style={styles.appName}>Snipr AI</Text>
          <Text style={styles.appTagline}>
            Your Local-First Developer Companion
          </Text>
        </Animated.View>

        {/* Feature Highlights Grid */}
        <View style={styles.featuresSection}>
          <Text style={styles.sectionHeader}>WHAT'S INSIDE</Text>
          {FEATURES.map((feature, index) => (
            <Animated.View
              key={feature.title}
              entering={FadeInDown.duration(500).delay(200 + index * 100)}
              style={styles.featureCard}
            >
              <View style={[styles.iconContainer, { backgroundColor: feature.bgColor }]}>
                <MaterialCommunityIcons
                  name={feature.icon as any}
                  size={ICON_SIZE.lg}
                  color={feature.color}
                />
              </View>
              <View style={styles.featureInfo}>
                <Text style={styles.featureTitle}>{feature.title}</Text>
                <Text style={styles.featureDesc}>{feature.description}</Text>
              </View>
            </Animated.View>
          ))}
        </View>

        {/* Call to Action Button */}
        <Animated.View
          entering={FadeInDown.duration(600).delay(700)}
          style={styles.actionContainer}
        >
          <Pressable
            onPress={handleGetStarted}
            style={({ pressed }) => [
              styles.button,
              pressed && styles.buttonPressed,
            ]}
          >
            <Text style={styles.buttonText}>Get Started</Text>
            <MaterialCommunityIcons
              name="arrow-right"
              size={ICON_SIZE.md}
              color={theme.white}
              style={styles.buttonIcon}
            />
          </Pressable>
        </Animated.View>
      </ScrollView>
    </View>
  );
}

export default WelcomeScreen;

const makeStyles = (theme: Theme) =>
  StyleSheet.create({
    scrollContent: {
      flexGrow: 1,
      justifyContent: "space-between",
      paddingBottom: SPACING.xl,
    },
    logoSection: {
      alignItems: "center",
      marginTop: SPACING.xxl,
      marginBottom: SPACING.xl,
    },
    logoBadge: {
      width: 68,
      height: 68,
      borderRadius: BORDER_RADIUS.lg,
      backgroundColor: theme.activeTab,
      justifyContent: "center",
      alignItems: "center",
      marginBottom: SPACING.md,
      ...SHADOW.md,
    },
    appName: {
      fontSize: FONT_SIZE.xxxl,
      fontFamily: FONT_FAMILY.bold,
      fontWeight: FONT_WEIGHT.bold,
      color: theme.text,
    },
    appTagline: {
      fontSize: FONT_SIZE.md,
      fontFamily: FONT_FAMILY.regular,
      color: theme.mutedText,
      marginTop: SPACING.xs,
      textAlign: "center",
    },
    featuresSection: {
      marginVertical: SPACING.md,
      gap: SPACING.md,
    },
    sectionHeader: {
      fontSize: FONT_SIZE.sm,
      fontFamily: FONT_FAMILY.semibold,
      fontWeight: FONT_WEIGHT.semibold,
      color: theme.mutedText,
      letterSpacing: 1.5,
      marginBottom: SPACING.xs,
      paddingLeft: SPACING.xs,
    },
    featureCard: {
      flexDirection: "row",
      backgroundColor: theme.card,
      borderColor: theme.cardBorder,
      borderWidth: 1,
      borderRadius: BORDER_RADIUS.md,
      padding: SPACING.md,
      ...SHADOW.sm,
    },
    iconContainer: {
      width: 44,
      height: 44,
      borderRadius: BORDER_RADIUS.md,
      justifyContent: "center",
      alignItems: "center",
      marginRight: SPACING.md,
    },
    featureInfo: {
      flex: 1,
      justifyContent: "center",
    },
    featureTitle: {
      fontSize: FONT_SIZE.md,
      fontFamily: FONT_FAMILY.semibold,
      fontWeight: FONT_WEIGHT.semibold,
      color: theme.text,
      marginBottom: SPACING.xs,
    },
    featureDesc: {
      fontSize: FONT_SIZE.sm + 1,
      fontFamily: FONT_FAMILY.regular,
      color: theme.mutedText,
      lineHeight: 18,
    },
    actionContainer: {
      marginTop: SPACING.xl,
    },
    button: {
      flexDirection: "row",
      backgroundColor: theme.activeTab,
      paddingVertical: SPACING.md,
      borderRadius: BORDER_RADIUS.md,
      justifyContent: "center",
      alignItems: "center",
      ...SHADOW.md,
    },
    buttonPressed: {
      opacity: 0.9,
      transform: [{ scale: 0.98 }],
    },
    buttonText: {
      fontSize: FONT_SIZE.md,
      fontFamily: FONT_FAMILY.semibold,
      fontWeight: FONT_WEIGHT.semibold,
      color: theme.white,
    },
    buttonIcon: {
      marginLeft: SPACING.sm,
    },
  });
