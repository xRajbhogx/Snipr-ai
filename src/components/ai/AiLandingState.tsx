import React from "react";
import { Pressable, ScrollView, StyleSheet, Text, View } from "react-native";
import Animated, { FadeIn } from "react-native-reanimated";
import { MaterialCommunityIcons } from "@expo/vector-icons";

import {
  BORDER_RADIUS,
  FONT_FAMILY,
  FONT_SIZE,
  ICON_SIZE,
  SHADOW,
  SPACING,
  Theme,
} from "@/constants/theme";
import { useTheme } from "@/hooks/useTheme";
import { useThemedStyles } from "@/hooks/useThemedStyles";

interface AiLandingStateProps {
  onGenerate: () => void;
}

const AiLandingState = ({ onGenerate }: AiLandingStateProps) => {
  const theme = useTheme();
  const styles = useThemedStyles(makeStyles, theme);

  return (
    <Animated.View entering={FadeIn} style={styles.landingContainer}>
      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.landingScroll}>
        <View style={styles.landingCard}>
          <View style={styles.aiLogoBox}>
            <MaterialCommunityIcons
              name="brain"
              size={ICON_SIZE.xl * 2.2}
              color={theme.activeTab}
            />
          </View>
          <Text style={styles.landingTitle}>Unlock Code Insights</Text>
          <Text style={styles.landingSubtitle}>
            Generate a structured code explanation, optimization tips, complexity details, and modern refactored recommendations.
          </Text>

          <View style={styles.featureList}>
            <View style={styles.featureItem}>
              <MaterialCommunityIcons
                name="text-box-search-outline"
                size={22}
                color={theme.activeTab}
              />
              <View style={styles.featureTexts}>
                <Text style={styles.featureTitle}>Deep Code Explanation</Text>
                <Text style={styles.featureDesc}>
                  Step-by-step logical breakdown of the code and algorithm flow.
                </Text>
              </View>
            </View>

            <View style={styles.featureItem}>
              <MaterialCommunityIcons
                name="lightbulb-on-outline"
                size={22}
                color={theme.scanGreen}
              />
              <View style={styles.featureTexts}>
                <Text style={styles.featureTitle}>Boilerplate & Optimizations</Text>
                <Text style={styles.featureDesc}>
                  Detailed recommendations for speed, security, and edge-cases.
                </Text>
              </View>
            </View>

            <View style={styles.featureItem}>
              <MaterialCommunityIcons
                name="lightning-bolt-outline"
                size={22}
                color={theme.fileIcon}
              />
              <View style={styles.featureTexts}>
                <Text style={styles.featureTitle}>Apply Code Refactoring</Text>
                <Text style={styles.featureDesc}>
                  Get clean code alternatives and autofill them directly back.
                </Text>
              </View>
            </View>
          </View>

          <Pressable
            onPress={onGenerate}
            style={({ pressed }) => [
              styles.generateButton,
              pressed && styles.generateButtonPressed,
            ]}
          >
            <MaterialCommunityIcons name="creation" size={ICON_SIZE.md} color={theme.white} />
            <Text style={styles.generateButtonText}>Generate Insights</Text>
          </Pressable>
        </View>
      </ScrollView>
    </Animated.View>
  );
};

export default React.memo(AiLandingState);

const makeStyles = (theme: Theme) =>
  StyleSheet.create({
    landingContainer: {
      flex: 1,
    },
    landingScroll: {
      paddingVertical: SPACING.lg,
    },
    landingCard: {
      backgroundColor: theme.card,
      borderColor: theme.cardBorder,
      borderWidth: 1,
      borderRadius: BORDER_RADIUS.lg,
      padding: SPACING.xl,
      alignItems: "center",
      ...SHADOW.md,
    },
    aiLogoBox: {
      width: 84,
      height: 84,
      borderRadius: BORDER_RADIUS.full,
      backgroundColor: theme.activeTabSoft,
      justifyContent: "center",
      alignItems: "center",
      marginBottom: SPACING.lg,
      ...SHADOW.sm,
    },
    landingTitle: {
      fontSize: FONT_SIZE.xl,
      fontFamily: FONT_FAMILY.bold,
      color: theme.text,
      marginBottom: SPACING.sm,
    },
    landingSubtitle: {
      fontSize: FONT_SIZE.md - 1,
      fontFamily: FONT_FAMILY.regular,
      color: theme.mutedText,
      textAlign: "center",
      lineHeight: 22,
      marginBottom: SPACING.xl,
    },
    featureList: {
      width: "100%",
      gap: SPACING.lg,
      marginBottom: SPACING.xxl,
    },
    featureItem: {
      flexDirection: "row",
      gap: SPACING.md,
      alignItems: "flex-start",
    },
    featureTexts: {
      flex: 1,
    },
    featureTitle: {
      fontSize: FONT_SIZE.md - 1,
      fontFamily: FONT_FAMILY.semibold,
      color: theme.text,
      marginBottom: 2,
    },
    featureDesc: {
      fontSize: FONT_SIZE.sm,
      fontFamily: FONT_FAMILY.regular,
      color: theme.mutedText,
      lineHeight: 18,
    },
    generateButton: {
      flexDirection: "row",
      alignItems: "center",
      justifyContent: "center",
      backgroundColor: theme.activeTab,
      paddingVertical: SPACING.md,
      width: "100%",
      borderRadius: BORDER_RADIUS.md,
      gap: SPACING.sm,
      ...SHADOW.sm,
    },
    generateButtonText: {
      color: theme.white,
      fontFamily: FONT_FAMILY.semibold,
      fontSize: FONT_SIZE.md - 1,
    },
    generateButtonPressed: {
      opacity: 0.85,
    },
  });
