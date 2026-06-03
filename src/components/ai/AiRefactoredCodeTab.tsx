import { MaterialCommunityIcons } from "@expo/vector-icons";
import React from "react";
import { Pressable, ScrollView, StyleSheet, Text, View } from "react-native";

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
import { computeDiff } from "@/utils/diff";
import { renderHighlightedCode } from "@/utils/highlighter";
import { MarkdownBlock, MarkdownText } from "./MarkdownRenderer";

interface AiRefactoredCodeTabProps {
  code: string;
  language: string;
  aiImprovedCode: string | null;
  improvementsData: any;
  aiImprovement: string | null;
  onCopyOriginalCode: () => void;
  onCopyImprovedCode: () => void;
  onApplyImprovement: () => void;
}

const AiRefactoredCodeTab = ({
  code,
  language,
  aiImprovedCode,
  improvementsData,
  aiImprovement,
  onCopyOriginalCode,
  onCopyImprovedCode,
  onApplyImprovement,
}: AiRefactoredCodeTabProps) => {
  const theme = useTheme();
  const styles = useThemedStyles(makeStyles, theme);

  const diffLines = React.useMemo(() => {
    if (!aiImprovedCode) return [];
    return computeDiff(code, aiImprovedCode);
  }, [code, aiImprovedCode]);

  return (
    <View style={styles.container}>
      {/* Optimizations Card / Info */}
      {improvementsData ? (
        <View style={styles.markdownBody}>
          {/* Recommendations */}
          {improvementsData.suggestions && improvementsData.suggestions.length > 0 && (
            <View style={styles.sectionCard}>
              <Text style={styles.sectionSubtitle}>Optimizations</Text>
              {improvementsData.suggestions.map((suggestion: string, index: number) => (
                <View key={index} style={styles.bulletContainer}>
                  <View style={styles.bulletDot} />
                  <MarkdownText text={suggestion} style={styles.bulletText} />
                </View>
              ))}
            </View>
          )}

          {/* Warning */}
          {improvementsData.warning && (
            <View style={styles.quoteContainer}>
              <View style={styles.quoteContent}>
                <MarkdownText text={improvementsData.warning} style={styles.quoteText} />
              </View>
            </View>
          )}
        </View>
      ) : aiImprovement ? (
        <View style={styles.contentCard}>
          <View style={styles.cardHeader}>
            <MaterialCommunityIcons name="lightbulb-on-outline" size={ICON_SIZE.md} color={theme.scanGreen} />
            <Text style={styles.cardTitle}>Optimization Tips</Text>
          </View>
          <View style={styles.markdownBody}>
            <MarkdownBlock text={aiImprovement} />
          </View>
        </View>
      ) : null}

      {/* Refactored Code Card with Inline Diff Highlighting */}
      <View style={[styles.contentCard, styles.codeCardOverride]}>
        <View style={styles.codeHeaderRow}>
          <View style={styles.codeHeaderLeft}>
            <MaterialCommunityIcons
              name="lightning-bolt-outline"
              size={ICON_SIZE.md}
              color={theme.fileIcon}
            />
            <Text style={styles.cardTitle}>Refactored Code</Text>
          </View>
          <Pressable
            onPress={onCopyImprovedCode}
            style={({ pressed }) => [
              styles.copyButton,
              pressed && styles.copyButtonPressed,
            ]}
          >
            <MaterialCommunityIcons
              name="content-copy"
              size={ICON_SIZE.sm}
              color={theme.activeTab}
            />
            <Text style={styles.copyButtonText}>Copy</Text>
          </Pressable>
        </View>

        {/* Outer scroll view controls height & vertical scrolling, Inner handles width & horizontal scrolling */}
        <ScrollView
          style={styles.codeScroller}
          nestedScrollEnabled={true}
        >
          <ScrollView horizontal={true} nestedScrollEnabled={true}>
            <View style={styles.diffContainer}>
              {aiImprovedCode ? (
                diffLines.map((line, index) => {
                  const isAdded = line.type === "added";
                  const isRemoved = line.type === "removed";

                  // Higher contrast backgrounds for accessibility and distinct visual appearance
                  const lineBg = isAdded
                    ? "rgba(34, 197, 94, 0.2)"
                    : isRemoved
                      ? "rgba(255, 77, 77, 0.18)"
                      : "transparent";

                  const prefix = isAdded ? "+ " : isRemoved ? "- " : "  ";
                  const prefixColor = isAdded
                    ? theme.success
                    : isRemoved
                      ? theme.activeTab
                      : theme.mutedText;

                  const borderLeftColor = isAdded
                    ? theme.success
                    : isRemoved
                      ? theme.activeTab
                      : "transparent";

                  return (
                    <View
                      key={index}
                      style={[styles.diffLineRow, { backgroundColor: lineBg, borderLeftColor }]}
                    >
                      <Text style={[styles.prefixText, { color: prefixColor }]}>
                        {prefix}
                      </Text>
                      <Text style={styles.codeLineText}>
                        {renderHighlightedCode(line.content, language, theme)}
                      </Text>
                    </View>
                  );
                })
              ) : (
                <Text style={styles.codeBlockText}>
                  Analyzing refactored changes...
                </Text>
              )}
            </View>
          </ScrollView>
        </ScrollView>
      </View>

      {/* Apply refactoring block */}
      {aiImprovedCode ? (
        <Pressable
          onPress={onApplyImprovement}
          style={({ pressed }) => [
            styles.applyButton,
            pressed && styles.applyButtonPressed,
          ]}
        >
          <MaterialCommunityIcons
            name="check-decagram-outline"
            size={20}
            color={theme.white}
          />
          <Text style={styles.applyButtonText}>Apply Improved Code & Edit</Text>
        </Pressable>
      ) : null}
    </View>
  );
};

export default React.memo(AiRefactoredCodeTab);

const makeStyles = (theme: Theme) =>
  StyleSheet.create({
    container: {
      width: "100%",
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
    codeCardOverride: {
      paddingHorizontal: SPACING.md,
      marginTop: SPACING.sm,
    },
    codeHeaderRow: {
      flexDirection: "row",
      alignItems: "center",
      justifyContent: "space-between",
      borderBottomWidth: 1,
      borderBottomColor: theme.cardBorder,
      paddingBottom: SPACING.sm,
      marginBottom: SPACING.md,
    },
    codeHeaderLeft: {
      flexDirection: "row",
      alignItems: "center",
      gap: SPACING.sm,
    },
    cardTitle: {
      fontSize: FONT_SIZE.md,
      fontFamily: FONT_FAMILY.bold,
      color: theme.text,
    },
    copyButton: {
      flexDirection: "row",
      alignItems: "center",
      gap: SPACING.xs,
      paddingVertical: SPACING.xs - 2,
      paddingHorizontal: SPACING.sm,
      borderRadius: BORDER_RADIUS.sm,
      backgroundColor: theme.activeTabSoft,
      borderWidth: 1,
      borderColor: theme.activeTabSoft,
    },
    copyButtonPressed: {
      opacity: 0.7,
    },
    copyButtonText: {
      fontSize: FONT_SIZE.sm,
      fontFamily: FONT_FAMILY.semibold,
      color: theme.activeTab,
    },
    codeScroller: {
      backgroundColor: theme.codeBg,
      borderRadius: BORDER_RADIUS.md,
      paddingVertical: SPACING.md,
      maxHeight: 400,
      borderWidth: 1,
      borderColor: theme.cardBorder,
    },
    codeBlockText: {
      fontFamily: "monospace",
      fontSize: FONT_SIZE.sm,
      color: theme.codeText,
      lineHeight: 20,
      paddingHorizontal: SPACING.md,
    },
    diffContainer: {
      flexDirection: "column",
      alignItems: "stretch",
    },
    diffLineRow: {
      flexDirection: "row",
      alignItems: "flex-start",
      paddingVertical: 2,
      paddingHorizontal: SPACING.sm,
      minWidth: "100%",
      borderLeftWidth: 4,
    },
    prefixText: {
      fontFamily: "monospace",
      fontSize: FONT_SIZE.sm,
      width: 16,
      textAlign: "center",
      marginRight: SPACING.xs,
      includeFontPadding: false,
    },
    codeLineText: {
      flexDirection: "row",
      fontFamily: "monospace",
      fontSize: FONT_SIZE.sm,
      color: theme.codeText,
      lineHeight: 20,
      includeFontPadding: false,
    },
    applyButton: {
      flexDirection: "row",
      alignItems: "center",
      justifyContent: "center",
      backgroundColor: theme.activeTab,
      paddingVertical: SPACING.md,
      borderRadius: BORDER_RADIUS.md,
      gap: SPACING.sm,
      marginTop: SPACING.sm,
      ...SHADOW.sm,
    },
    applyButtonText: {
      color: theme.white,
      fontFamily: FONT_FAMILY.semibold,
      fontSize: FONT_SIZE.md - 1,
    },
    applyButtonPressed: {
      opacity: 0.85,
    },
    // Optimization Styles
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
    bulletContainer: {
      flexDirection: "row",
      alignItems: "flex-start",
      paddingLeft: SPACING.xs,
      marginVertical: 4,
    },
    bulletDot: {
      width: 6,
      height: 6,
      borderRadius: 3,
      backgroundColor: theme.activeTab,
      marginRight: SPACING.sm,
      marginTop: 8,
    },
    bulletText: {
      flex: 1,
      color: theme.text,
      fontSize: FONT_SIZE.sm + 2,
      fontFamily: FONT_FAMILY.regular,
      lineHeight: 22,
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
      marginBottom: SPACING.md,
    },
    quoteContent: {
      flex: 1,
    },
    quoteText: {
      color: theme.text,
      fontStyle: "italic",
      lineHeight: 20,
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
  });
