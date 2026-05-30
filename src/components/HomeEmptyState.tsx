import {
  BORDER_RADIUS,
  FONT_FAMILY,
  FONT_SIZE,
  FONT_WEIGHT,
  SHADOW,
  SPACING,
  Theme,
} from "@/constants/theme";
import { useTheme } from "@/hooks/useTheme";
import { useThemedStyles } from "@/hooks/useThemedStyles";
import { MaterialCommunityIcons } from "@expo/vector-icons";
import { router } from "expo-router";
import React, { memo, useEffect } from "react";
import { Pressable, StyleSheet, Text, View } from "react-native";
import Animated, {
  useAnimatedStyle,
  useSharedValue,
  withDelay,
  withRepeat,
  withSequence,
  withTiming,
} from "react-native-reanimated";

interface HomeEmptyStateProps {
  onImportStarterSnippets: () => void;
}

const HomeEmptyState = ({ onImportStarterSnippets }: HomeEmptyStateProps) => {
  const theme = useTheme();
  const styles = useThemedStyles(makeStyles, theme);

  // Shared values for halo pulsations
  const haloScale1 = useSharedValue(1);
  const haloOpacity1 = useSharedValue(0.6);
  const haloScale2 = useSharedValue(1);
  const haloOpacity2 = useSharedValue(0.4);

  // Shared values for floating badges
  const floatY1 = useSharedValue(0);
  const floatY2 = useSharedValue(0);
  const floatY3 = useSharedValue(0);

  useEffect(() => {
    // Start pulsing loops
    haloScale1.value = withRepeat(
      withTiming(1.4, { duration: 2500 }),
      -1,
      false
    );
    haloOpacity1.value = withRepeat(
      withTiming(0, { duration: 2500 }),
      -1,
      false
    );

    haloScale2.value = withRepeat(
      withDelay(1250, withTiming(1.5, { duration: 2500 })),
      -1,
      false
    );
    haloOpacity2.value = withRepeat(
      withDelay(1250, withTiming(0, { duration: 2500 })),
      -1,
      false
    );

    // Floating badges animations
    floatY1.value = withRepeat(
      withSequence(
        withTiming(-8, { duration: 1500 }),
        withTiming(8, { duration: 1500 })
      ),
      -1,
      true
    );
    floatY2.value = withRepeat(
      withDelay(
        400,
        withSequence(
          withTiming(6, { duration: 1800 }),
          withTiming(-6, { duration: 1800 })
        )
      ),
      -1,
      true
    );
    floatY3.value = withRepeat(
      withDelay(
        800,
        withSequence(
          withTiming(-5, { duration: 1600 }),
          withTiming(5, { duration: 1600 })
        )
      ),
      -1,
      true
    );
  }, []);

  const animatedHalo1 = useAnimatedStyle(() => ({
    transform: [{ scale: haloScale1.value }],
    opacity: haloOpacity1.value,
  }));

  const animatedHalo2 = useAnimatedStyle(() => ({
    transform: [{ scale: haloScale2.value }],
    opacity: haloOpacity2.value,
  }));

  const animatedFloat1 = useAnimatedStyle(() => ({
    transform: [{ translateY: floatY1.value }],
  }));

  const animatedFloat2 = useAnimatedStyle(() => ({
    transform: [{ translateY: floatY2.value }],
  }));

  const animatedFloat3 = useAnimatedStyle(() => ({
    transform: [{ translateY: floatY3.value }],
  }));

  const handleSeed = () => {
    onImportStarterSnippets();
  };

  return (
    <View style={styles.container}>
      {/* Decorative Animated Graphic */}
      <View style={styles.graphicContainer}>
        {/* Pulsing halo rings in the background */}
        <Animated.View style={[styles.haloRing, styles.haloRing1, animatedHalo1]} />
        <Animated.View style={[styles.haloRing, styles.haloRing2, animatedHalo2]} />

        {/* Central main emblem */}
        <View style={styles.centerEmblem}>
          <MaterialCommunityIcons
            name="code-braces"
            size={42}
            color={theme.activeTab}
          />
        </View>

        {/* Floating tech badges */}
        <Animated.View style={[styles.floatingBadge, styles.badgeTS, animatedFloat1]}>
          <Text style={styles.badgeText}>TS</Text>
        </Animated.View>

        <Animated.View style={[styles.floatingBadge, styles.badgePY, animatedFloat2]}>
          <Text style={styles.badgeText}>PY</Text>
        </Animated.View>

        <Animated.View style={[styles.floatingBadge, styles.badgeJS, animatedFloat3]}>
          <Text style={styles.badgeText}>JS</Text>
        </Animated.View>
      </View>

      {/* Copy and Details */}
      <Text style={styles.title}>Your Offline Code Vault</Text>
      <Text style={styles.description}>
        Snipr AI runs fully locally. Save, search, and manage your reusable boilerplate, scripts, and code snippets securely.
      </Text>

      {/* Highlight Features */}
      <View style={styles.featuresList}>
        <View style={styles.featureRow}>
          <View style={styles.featureIconContainer}>
            <MaterialCommunityIcons
              name="database-outline"
              size={18}
              color={theme.activeTab}
            />
          </View>
          <View style={styles.featureTextContainer}>
            <Text style={styles.featureTitle}>Local SQLite Database</Text>
            <Text style={styles.featureDesc}>
              Blazing fast database running on-device. Zero internet latency.
            </Text>
          </View>
        </View>

        <View style={styles.featureRow}>
          <View style={styles.featureIconContainer}>
            <MaterialCommunityIcons
              name="text-search"
              size={18}
              color={theme.activeTab}
            />
          </View>
          <View style={styles.featureTextContainer}>
            <Text style={styles.featureTitle}>Semantic & Tag Search</Text>
            <Text style={styles.featureDesc}>
              Instantly find code by typing commands, syntax, tags, or description.
            </Text>
          </View>
        </View>

        <View style={styles.featureRow}>
          <View style={styles.featureIconContainer}>
            <MaterialCommunityIcons
              name="brain"
              size={18}
              color={theme.activeTab}
            />
          </View>
          <View style={styles.featureTextContainer}>
            <Text style={styles.featureTitle}>AI Explanations & Summaries</Text>
            <Text style={styles.featureDesc}>
              Generate documentation or explain complex snippets directly from detail view.
            </Text>
          </View>
        </View>
      </View>

      {/* CTA Buttons */}
      <View style={styles.actionContainer}>
        <Pressable
          onPress={() => router.push("/CreateSnippetScreen")}
          style={({ pressed }) => [
            styles.primaryButton,
            pressed && styles.buttonPressed,
          ]}
        >
          <MaterialCommunityIcons
            name="plus"
            size={18}
            color={theme.white}
            style={styles.buttonIcon}
          />
          <Text style={styles.primaryButtonText}>Create First Snippet</Text>
        </Pressable>

        <Pressable
          onPress={handleSeed}
          style={({ pressed }) => [
            styles.secondaryButton,
            pressed && styles.buttonPressed,
          ]}
        >
          <MaterialCommunityIcons
            name="database-import-outline"
            size={18}
            color={theme.text}
            style={styles.buttonIcon}
          />
          <Text style={styles.secondaryButtonText}>Import Starter Snippets</Text>
        </Pressable>
      </View>
    </View>
  );
};

export default memo(HomeEmptyState);

const makeStyles = (theme: Theme) =>
  StyleSheet.create({
    container: {
      backgroundColor: theme.card,
      borderColor: theme.cardBorder,
      borderWidth: 1,
      borderRadius: BORDER_RADIUS.lg,
      paddingVertical: SPACING.xl,
      paddingHorizontal: SPACING.lg,
      alignItems: "center",
      width: "100%",
      marginTop: SPACING.md,
      ...SHADOW.md,
      marginBottom: SPACING.md
    },
    graphicContainer: {
      height: 120,
      width: 200,
      justifyContent: "center",
      alignItems: "center",
      marginBottom: SPACING.lg,
      position: "relative",
    },
    centerEmblem: {
      width: 72,
      height: 72,
      borderRadius: BORDER_RADIUS.full,
      backgroundColor: theme.activeTabSoft,
      justifyContent: "center",
      alignItems: "center",
      zIndex: 2,
    },
    haloRing: {
      position: "absolute",
      borderRadius: BORDER_RADIUS.full,
      borderWidth: 1.5,
      borderColor: theme.activeTab,
      zIndex: 1,
    },
    haloRing1: {
      width: 80,
      height: 80,
    },
    haloRing2: {
      width: 90,
      height: 90,
    },
    floatingBadge: {
      position: "absolute",
      paddingVertical: 4,
      paddingHorizontal: 8,
      borderRadius: BORDER_RADIUS.sm,
      backgroundColor: theme.tagBg,
      borderWidth: 1,
      borderColor: theme.cardBorder,
      ...SHADOW.sm,
      zIndex: 3,
    },
    badgeText: {
      fontSize: FONT_SIZE.sm - 2,
      fontFamily: FONT_FAMILY.bold,
      color: theme.mutedText,
    },
    badgeTS: {
      top: 15,
      left: 15,
    },
    badgePY: {
      bottom: 10,
      left: 20,
    },
    badgeJS: {
      top: 30,
      right: 15,
    },
    title: {
      fontSize: FONT_SIZE.lg,
      fontFamily: FONT_FAMILY.bold,
      fontWeight: FONT_WEIGHT.bold,
      color: theme.text,
      textAlign: "center",
      marginBottom: SPACING.xs,
    },
    description: {
      fontSize: FONT_SIZE.sm + 1,
      fontFamily: FONT_FAMILY.regular,
      color: theme.mutedText,
      textAlign: "center",
      lineHeight: 20,
      marginBottom: SPACING.xl,
      paddingHorizontal: SPACING.sm,
    },
    featuresList: {
      width: "100%",
      gap: SPACING.md,
      marginBottom: SPACING.xl,
      borderTopWidth: 1,
      borderTopColor: theme.cardBorder,
      paddingTop: SPACING.lg,
    },
    featureRow: {
      flexDirection: "row",
      alignItems: "flex-start",
      gap: SPACING.sm,
    },
    featureIconContainer: {
      width: 28,
      height: 28,
      borderRadius: BORDER_RADIUS.sm,
      backgroundColor: theme.activeTabSoft,
      justifyContent: "center",
      alignItems: "center",
      marginTop: 2,
    },
    featureTextContainer: {
      flex: 1,
    },
    featureTitle: {
      fontSize: FONT_SIZE.sm + 2,
      fontFamily: FONT_FAMILY.semibold,
      fontWeight: FONT_WEIGHT.semibold,
      color: theme.text,
      marginBottom: 2,
    },
    featureDesc: {
      fontSize: FONT_SIZE.sm,
      fontFamily: FONT_FAMILY.regular,
      color: theme.mutedText,
      lineHeight: 16,
    },
    actionContainer: {
      width: "100%",
      gap: SPACING.sm,
    },
    primaryButton: {
      flexDirection: "row",
      alignItems: "center",
      justifyContent: "center",
      backgroundColor: theme.activeTab,
      paddingVertical: SPACING.md,
      borderRadius: BORDER_RADIUS.md,
      ...SHADOW.sm,
    },
    primaryButtonText: {
      fontSize: FONT_SIZE.sm + 2,
      fontFamily: FONT_FAMILY.semibold,
      fontWeight: FONT_WEIGHT.semibold,
      color: theme.white,
    },
    secondaryButton: {
      flexDirection: "row",
      alignItems: "center",
      justifyContent: "center",
      backgroundColor: theme.tagBg,
      borderColor: theme.cardBorder,
      borderWidth: 1,
      paddingVertical: SPACING.md,
      borderRadius: BORDER_RADIUS.md,
    },
    secondaryButtonText: {
      fontSize: FONT_SIZE.sm + 2,
      fontFamily: FONT_FAMILY.semibold,
      fontWeight: FONT_WEIGHT.semibold,
      color: theme.text,
    },
    buttonPressed: {
      opacity: 0.85,
    },
    buttonIcon: {
      marginRight: SPACING.xs,
    },
  });
