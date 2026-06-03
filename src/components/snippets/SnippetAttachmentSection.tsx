import { MaterialCommunityIcons } from "@expo/vector-icons";
import React from "react";
import { ActivityIndicator, Pressable, StyleSheet, Text, View } from "react-native";

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

interface SnippetAttachmentSectionProps {
  screenshotPath: string | null;
  isScanningOcr: boolean;
  onAttachScreenshot: () => void;
  onOcrScan: () => void;
  onRemoveScreenshot: () => void;
}

const SnippetAttachmentSection = ({
  screenshotPath,
  isScanningOcr,
  onAttachScreenshot,
  onOcrScan,
  onRemoveScreenshot,
}: SnippetAttachmentSectionProps) => {
  const theme = useTheme();
  const styles = useThemedStyles(makeStyles, theme);

  return (
    <View style={styles.section}>
      <Text style={styles.sectionHeader}>Attachments</Text>

      {screenshotPath && (
        <View style={styles.previewsContainer}>
          <View style={styles.previewChip}>
            <MaterialCommunityIcons
              name="image"
              size={ICON_SIZE.sm}
              color={theme.activeTab}
            />
            <Text style={styles.previewText} numberOfLines={1}>
              {screenshotPath.split("/").pop()}
            </Text>
            <Pressable
              onPress={onRemoveScreenshot}
              style={styles.previewDeleteBtn}
            >
              <MaterialCommunityIcons
                name="close-circle"
                size={ICON_SIZE.sm}
                color={theme.text}
              />
            </Pressable>
          </View>
        </View>
      )}

      {isScanningOcr ? (
        <View style={styles.ocrLoadingContainer}>
          <ActivityIndicator color={theme.activeTab} size="small" />
          <Text style={styles.ocrLoadingText}>
            Scanning image & extracting code...
          </Text>
        </View>
      ) : (
        <View style={styles.attachmentsRow}>
          <Pressable
            onPress={onAttachScreenshot}
            style={styles.attachmentBtn}
          >
            <MaterialCommunityIcons
              name="image-outline"
              size={ICON_SIZE.md}
              color={theme.activeTab}
            />
            <Text style={styles.attachmentText}>Screenshot</Text>
          </Pressable>
          <Pressable onPress={onOcrScan} style={styles.attachmentBtn}>
            <MaterialCommunityIcons
              name="line-scan"
              size={ICON_SIZE.md}
              color={theme.scanGreen}
            />
            <Text style={styles.attachmentText}>OCR Scan</Text>
          </Pressable>
        </View>
      )}
    </View>
  );
};

export default React.memo(SnippetAttachmentSection);

const makeStyles = (theme: Theme) =>
  StyleSheet.create({
    section: {
      marginBottom: SPACING.xl,
    },
    sectionHeader: {
      fontSize: FONT_SIZE.lg,
      fontFamily: FONT_FAMILY.extrabold,
      color: theme.text,
      marginBottom: SPACING.sm,
      backgroundColor: theme.cardBorder,
      paddingHorizontal: SPACING.md,
      paddingVertical: SPACING.xs,
      borderRadius: BORDER_RADIUS.sm,
      alignSelf: "flex-start",
    },
    attachmentsRow: {
      flexDirection: "row",
      justifyContent: "space-between",
      gap: SPACING.sm,
    },
    attachmentBtn: {
      flex: 1,
      backgroundColor: theme.card,
      borderRadius: BORDER_RADIUS.md,
      borderWidth: 1,
      borderColor: theme.cardBorder,
      paddingVertical: SPACING.md,
      alignItems: "center",
      justifyContent: "center",
    },
    attachmentText: {
      color: theme.text,
      fontFamily: FONT_FAMILY.medium,
      fontSize: FONT_SIZE.sm,
      marginTop: SPACING.xs,
    },
    previewsContainer: {
      flexDirection: "row",
      flexWrap: "wrap",
      gap: SPACING.sm,
      marginBottom: SPACING.sm,
    },
    previewChip: {
      flexDirection: "row",
      alignItems: "center",
      backgroundColor: theme.tagBg,
      paddingHorizontal: SPACING.sm,
      paddingVertical: SPACING.xs,
      borderRadius: BORDER_RADIUS.sm,
      borderWidth: 1,
      borderColor: theme.cardBorder,
      gap: SPACING.sm,
    },
    previewText: {
      color: theme.text,
      fontFamily: FONT_FAMILY.medium,
      fontSize: FONT_SIZE.sm,
      maxWidth: 140,
    },
    previewDeleteBtn: {
      justifyContent: "center",
      alignItems: "center",
    },
    ocrLoadingContainer: {
      backgroundColor: theme.card,
      borderRadius: BORDER_RADIUS.md,
      borderWidth: 1,
      borderColor: theme.cardBorder,
      paddingVertical: SPACING.lg,
      alignItems: "center",
      justifyContent: "center",
    },
    ocrLoadingText: {
      color: theme.activeTab,
      fontFamily: FONT_FAMILY.semibold,
      fontSize: FONT_SIZE.sm,
      marginTop: SPACING.sm,
    },
  });
