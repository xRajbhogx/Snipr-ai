import React from "react";
import { StyleSheet, Text, View } from "react-native";

import {
  BORDER_RADIUS,
  FONT_FAMILY,
  FONT_SIZE,
  SPACING,
  Theme,
} from "@/constants/theme";
import { useTheme } from "@/hooks/useTheme";
import { useThemedStyles } from "@/hooks/useThemedStyles";

interface MarkdownTextProps {
  text: string;
  style?: any;
}

export const MarkdownText = React.memo(({ text, style }: MarkdownTextProps) => {
  const theme = useTheme();
  const styles = useThemedStyles(makeStyles, theme);

  if (!text) return null;
  const parts = text.split(/\*\*([\s\S]*?)\*\*/g);

  return (
    <Text style={style || styles.normalText}>
      {parts.map((part, partIndex) => {
        const isBold = partIndex % 2 === 1;
        const subParts = part.split(/`([\s\S]*?)`/g);
        return subParts.map((subPart, subPartIndex) => {
          const isInlineCode = subPartIndex % 2 === 1;
          return (
            <Text
              key={`${partIndex}-${subPartIndex}`}
              style={[
                isBold && styles.boldText,
                isInlineCode && styles.inlineCode,
              ]}
            >
              {subPart}
            </Text>
          );
        });
      })}
    </Text>
  );
});

interface MarkdownBlockProps {
  text: string;
}

export const MarkdownBlock = React.memo(({ text }: MarkdownBlockProps) => {
  const theme = useTheme();
  const styles = useThemedStyles(makeStyles, theme);

  if (!text) return null;

  const lines = text.split("\n");
  return (
    <View style={styles.container}>
      {lines.map((line, lineIndex) => {
        // Check if it's a code block line (e.g. starting with ```)
        if (line.trim().startsWith("```")) {
          return null; // Skip markdown block code fences in regular text view
        }

        // Check for blockquotes/tips starting with '>'
        const isQuote = line.trim().startsWith(">");
        let lineText = isQuote ? line.trim().substring(1).trim() : line;

        // Check if it's a header line
        const isHeader = lineText.startsWith("#");
        let headerLevel = 0;
        if (isHeader) {
          headerLevel = lineText.match(/^#+/)?.[0].length || 0;
        }
        let cleanLine = isHeader ? lineText.replace(/^#+\s*/, "") : lineText;

        // Check if it's a bullet point
        const isBullet = cleanLine.trim().startsWith("-") || cleanLine.trim().startsWith("*");
        if (isBullet) {
          cleanLine = cleanLine.trim().replace(/^[\-\*]\s*/, "");
        }

        // Parse bold tags **bold**
        const parts = cleanLine.split(/\*\*([\s\S]*?)\*\*/g);

        const textElement = (
          <Text
            style={[
              styles.markdownLine,
              isHeader && styles.markdownHeader,
              headerLevel === 1 && styles.h1,
              headerLevel === 2 && styles.h2,
              headerLevel >= 3 && styles.h3,
              isBullet && styles.bulletText,
              isQuote && styles.quoteText,
            ]}
          >
            {parts.map((part, partIndex) => {
              const isBold = partIndex % 2 === 1;
              
              // Further parse inline backticks `code`
              const subParts = part.split(/`([\s\S]*?)`/g);
              return subParts.map((subPart, subPartIndex) => {
                const isInlineCode = subPartIndex % 2 === 1;
                return (
                  <Text
                    key={`${partIndex}-${subPartIndex}`}
                    style={[
                      isBold && styles.boldText,
                      isInlineCode && styles.inlineCode,
                    ]}
                  >
                    {subPart}
                  </Text>
                );
              });
            })}
          </Text>
        );

        if (isQuote) {
          return (
            <View key={lineIndex} style={styles.quoteContainer}>
              <View style={styles.quoteContent}>
                {textElement}
              </View>
            </View>
          );
        }

        if (isBullet) {
          return (
            <View key={lineIndex} style={styles.bulletContainer}>
              <View style={styles.bulletDot} />
              {textElement}
            </View>
          );
        }

        if (isHeader) {
          return (
            <View key={lineIndex} style={styles.headerContainer}>
              <View style={styles.headerIndicator} />
              {textElement}
            </View>
          );
        }

        return (
          <View key={lineIndex} style={styles.lineWrapper}>
            {textElement}
          </View>
        );
      })}
    </View>
  );
});

const makeStyles = (theme: Theme) =>
  StyleSheet.create({
    container: {
      width: "100%",
    },
    normalText: {
      fontSize: FONT_SIZE.sm + 2,
      fontFamily: FONT_FAMILY.regular,
      color: theme.text,
      lineHeight: 22,
    },
    boldText: {
      fontFamily: FONT_FAMILY.bold,
    },
    inlineCode: {
      fontFamily: "monospace",
      backgroundColor: theme.tagBg,
      color: theme.activeTab,
      paddingHorizontal: 4,
      borderRadius: 4,
    },
    markdownLine: {
      fontSize: FONT_SIZE.sm + 2,
      fontFamily: FONT_FAMILY.regular,
      color: theme.text,
      lineHeight: 22,
    },
    markdownHeader: {
      fontFamily: FONT_FAMILY.bold,
      marginTop: SPACING.sm,
      marginBottom: SPACING.xs,
      color: theme.text,
    },
    h1: { fontSize: FONT_SIZE.lg },
    h2: { fontSize: FONT_SIZE.md + 1 },
    h3: { fontSize: FONT_SIZE.md },
    lineWrapper: {
      flexDirection: "row",
      alignItems: "flex-start",
      marginVertical: 2,
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
    },
    headerContainer: {
      flexDirection: "row",
      alignItems: "center",
      marginTop: SPACING.md,
      marginBottom: SPACING.xs,
      paddingLeft: SPACING.xs,
    },
    headerIndicator: {
      width: 4,
      height: 18,
      borderRadius: 2,
      backgroundColor: theme.activeTab,
      marginRight: SPACING.sm,
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
  });
