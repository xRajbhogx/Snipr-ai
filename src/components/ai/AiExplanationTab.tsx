import React from "react";
import { StyleSheet, Text, View } from "react-native";
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
import { MarkdownText, MarkdownBlock } from "./MarkdownRenderer";

interface AiExplanationTabProps {
  explanationData: any;
  aiExplanation: string;
}

const AiExplanationTab = ({ explanationData, aiExplanation }: AiExplanationTabProps) => {
  const theme = useTheme();
  const styles = useThemedStyles(makeStyles, theme);

  return (
    <View style={styles.container}>
      {explanationData ? (
        <View style={styles.markdownBody}>
          {/* Overview */}
          {explanationData.overview && (
            <View style={styles.sectionCard}>
              <Text style={styles.sectionSubtitle}>Overview</Text>
              <MarkdownText text={explanationData.overview} style={styles.normalText} />
            </View>
          )}

          {/* Steps */}
          {explanationData.steps && explanationData.steps.length > 0 && (
            <View style={styles.sectionCard}>
              <Text style={styles.sectionSubtitle}>Logical Steps</Text>
              {explanationData.steps.map((step: string, index: number) => (
                <View key={index} style={styles.bulletContainer}>
                  <View style={styles.stepBadge}>
                    <Text style={styles.stepBadgeText}>{index + 1}</Text>
                  </View>
                  <MarkdownText text={step} style={styles.bulletText} />
                </View>
              ))}
            </View>
          )}

          {/* Key Concepts */}
          {explanationData.key_concepts && explanationData.key_concepts.length > 0 && (
            <View style={styles.sectionCard}>
              <Text style={styles.sectionSubtitle}>Key Concepts</Text>
              {explanationData.key_concepts.map((concept: any, index: number) => (
                <View key={index} style={styles.conceptItem}>
                  <Text style={styles.conceptName}>{concept.concept}</Text>
                  <MarkdownText text={concept.description} style={styles.conceptDesc} />
                </View>
              ))}
            </View>
          )}

          {/* Detailed Explanation */}
          {explanationData.detailed_explanation && (
            <View style={styles.sectionCard}>
              <Text style={styles.sectionSubtitle}>Detailed Explanation</Text>
              <MarkdownText text={explanationData.detailed_explanation} style={styles.normalText} />
            </View>
          )}

          {/* Key Refactoring & Changes */}
          {explanationData.key_changes && (
            <View style={styles.sectionCard}>
              <Text style={styles.sectionSubtitle}>Key Refactoring & Changes</Text>
              <MarkdownText text={explanationData.key_changes} style={styles.normalText} />
            </View>
          )}

          {/* Tip */}
          {explanationData.tip && (
            <View style={styles.quoteContainer}>
              <View style={styles.quoteContent}>
                <MarkdownText text={explanationData.tip} style={styles.quoteText} />
              </View>
            </View>
          )}
        </View>
      ) : (
        <View style={styles.contentCard}>
          <View style={styles.cardHeader}>
            <MaterialCommunityIcons name="text-box-search-outline" size={ICON_SIZE.md} color={theme.activeTab} />
            <Text style={styles.cardTitle}>Logic Breakdown</Text>
          </View>
          <View style={styles.markdownBody}>
            <MarkdownBlock text={aiExplanation} />
          </View>
        </View>
      )}
    </View>
  );
};

export default React.memo(AiExplanationTab);

const makeStyles = (theme: Theme) =>
  StyleSheet.create({
    container: {
      width: "100%",
    },
    markdownBody: {
      gap: SPACING.sm,
    },
    sectionCard: {
      backgroundColor: theme.card,
      borderColor: theme.cardBorder,
      borderWidth: 1,
      borderRadius: BORDER_RADIUS.md,
      padding: SPACING.md,
      marginBottom: SPACING.md,
      ...SHADOW.sm,
    },
    sectionSubtitle: {
      fontSize: FONT_SIZE.md - 2,
      fontFamily: FONT_FAMILY.bold,
      color: theme.activeTab,
      marginBottom: SPACING.sm,
      textTransform: "uppercase",
      letterSpacing: 0.5,
    },
    normalText: {
      fontSize: FONT_SIZE.sm + 2,
      fontFamily: FONT_FAMILY.regular,
      color: theme.text,
      lineHeight: 22,
    },
    bulletContainer: {
      flexDirection: "row",
      alignItems: "flex-start",
      paddingLeft: SPACING.xs,
      marginVertical: 4,
    },
    stepBadge: {
      width: 22,
      height: 22,
      borderRadius: 11,
      backgroundColor: theme.activeTabSoft,
      justifyContent: "center",
      alignItems: "center",
      marginRight: SPACING.sm,
      marginTop: 2,
    },
    stepBadgeText: {
      fontSize: 11,
      fontFamily: FONT_FAMILY.bold,
      color: theme.activeTab,
    },
    bulletText: {
      flex: 1,
      color: theme.text,
      fontSize: FONT_SIZE.sm + 2,
      fontFamily: FONT_FAMILY.regular,
      lineHeight: 22,
    },
    conceptItem: {
      marginBottom: SPACING.sm,
      borderBottomWidth: 1,
      borderBottomColor: theme.cardBorder,
      paddingBottom: SPACING.xs,
    },
    conceptName: {
      fontSize: FONT_SIZE.sm + 2,
      fontFamily: FONT_FAMILY.bold,
      color: theme.text,
      marginBottom: 2,
    },
    conceptDesc: {
      fontSize: FONT_SIZE.sm + 1,
      fontFamily: FONT_FAMILY.regular,
      color: theme.mutedText,
      lineHeight: 18,
    },

    quoteContainer: {
      flexDirection: "row",
      backgroundColor: theme.activeTabSoft,
      borderLeftWidth: 4,
      borderLeftColor: theme.activeTab,
      borderRadius: BORDER_RADIUS.sm,
      paddingVertical: SPACING.sm,
      paddingHorizontal: SPACING.md,
      marginVertical: SPACING.sm,
      alignItems: "flex-start",
      width: "100%",
    },
    quoteContent: {
      flex: 1,
    },
    quoteText: {
      color: theme.text,
      fontStyle: "italic",
      lineHeight: 20,
    },
    contentCard: {
      backgroundColor: theme.card,
      borderColor: theme.cardBorder,
      borderWidth: 1,
      borderRadius: BORDER_RADIUS.lg,
      padding: SPACING.lg,
      ...SHADOW.sm,
      marginBottom: SPACING.md,
    },
    cardHeader: {
      flexDirection: "row",
      alignItems: "center",
      gap: SPACING.sm,
      borderBottomWidth: 1,
      borderBottomColor: theme.cardBorder,
      paddingBottom: SPACING.sm,
      marginBottom: SPACING.md,
    },
    cardTitle: {
      fontSize: FONT_SIZE.md,
      fontFamily: FONT_FAMILY.bold,
      color: theme.text,
    },
  });
