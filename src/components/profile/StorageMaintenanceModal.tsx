import React from "react";
import {
  ActivityIndicator,
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
import { formatBytes } from "@/utils/storage";
import type { StorageStats } from "@/services/fileService";

interface StorageMaintenanceModalProps {
  visible: boolean;
  onClose: () => void;
  dbSize: number;
  cacheSize: number;
  fsStats: StorageStats | null;
  isMaintenanceActionLoading: boolean;
  onClearCache: () => void;
  onSeedData: () => void;
  onResetDb: () => void;
}

const StorageMaintenanceModal = ({
  visible,
  onClose,
  dbSize,
  cacheSize,
  fsStats,
  isMaintenanceActionLoading,
  onClearCache,
  onSeedData,
  onResetDb,
}: StorageMaintenanceModalProps) => {
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
            <Text style={styles.modalTitle}>Storage & Maintenance</Text>
            <Pressable onPress={onClose} style={styles.modalCloseButton}>
              <MaterialCommunityIcons name="close" size={ICON_SIZE.lg} color={theme.text} />
            </Pressable>
          </View>

          <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.modalScrollBody}>
            <Text style={styles.cardLabel}>Vault Breakdown</Text>
            
            {/* Database size */}
            <View style={styles.infoRow}>
              <View style={styles.infoLeft}>
                <MaterialCommunityIcons name="database" size={ICON_SIZE.md} color={theme.mutedText} />
                <Text style={styles.infoText}>Vault Database</Text>
              </View>
              <Text style={styles.infoValue}>{formatBytes(dbSize)}</Text>
            </View>

            {/* Cache size */}
            <View style={styles.infoRow}>
              <View style={styles.infoLeft}>
                <MaterialCommunityIcons name="folder-open-outline" size={ICON_SIZE.md} color={theme.mutedText} />
                <Text style={styles.infoText}>Temporary Cache</Text>
              </View>
              <Text style={styles.infoValue}>{formatBytes(cacheSize)}</Text>
            </View>

            {/* Exports folder size */}
            <View style={styles.infoRow}>
              <View style={styles.infoLeft}>
                <MaterialCommunityIcons name="file-code-outline" size={ICON_SIZE.md} color={theme.mutedText} />
                <Text style={styles.infoText}>Exported Code Files</Text>
              </View>
              <Text style={styles.infoValue}>{formatBytes(fsStats?.exportsSize || 0)}</Text>
            </View>

            {/* Images folder size */}
            <View style={styles.infoRow}>
              <View style={styles.infoLeft}>
                <MaterialCommunityIcons name="image-outline" size={ICON_SIZE.md} color={theme.mutedText} />
                <Text style={styles.infoText}>Screenshot Attachments</Text>
              </View>
              <Text style={styles.infoValue}>{formatBytes(fsStats?.imagesSize || 0)}</Text>
            </View>

            {/* Downloads folder size */}
            <View style={styles.infoRow}>
              <View style={styles.infoLeft}>
                <MaterialCommunityIcons name="download" size={ICON_SIZE.md} color={theme.mutedText} />
                <Text style={styles.infoText}>Downloaded Files</Text>
              </View>
              <Text style={styles.infoValue}>{formatBytes(fsStats?.downloadsSize || 0)}</Text>
            </View>

            {/* Cumulative Files Storage size */}
            <View style={[styles.infoRow, styles.totalRow]}>
              <View style={styles.infoLeft}>
                <MaterialCommunityIcons name="chart-pie" size={ICON_SIZE.md} color={theme.text} />
                <Text style={[styles.infoText, styles.totalText]}>Total File Vault Size</Text>
              </View>
              <Text style={[styles.infoValue, styles.totalValue]}>{formatBytes(fsStats?.totalSize || 0)}</Text>
            </View>

            <View style={styles.modalDivider} />

            <Text style={styles.cardLabel}>Maintenance Actions</Text>

            {isMaintenanceActionLoading ? (
              <View style={styles.maintenanceLoadingContainer}>
                <ActivityIndicator size="small" color={theme.activeTab} />
                <Text style={styles.maintenanceLoadingText}>Performing maintenance...</Text>
              </View>
            ) : (
              <View>
                {/* Clear Cache */}
                <Pressable
                  onPress={onClearCache}
                  style={({ pressed }) => [
                    styles.actionButton,
                    pressed && styles.actionButtonPressed,
                  ]}
                >
                  <View style={styles.actionLeft}>
                    <MaterialCommunityIcons name="broom" size={ICON_SIZE.md} color={theme.text} />
                    <Text style={styles.actionText}>Clear Temporary Cache</Text>
                  </View>
                  <MaterialCommunityIcons name="chevron-right" size={ICON_SIZE.md} color={theme.mutedText} />
                </Pressable>

                {/* Seed Demo Data */}
                <Pressable
                  onPress={onSeedData}
                  style={({ pressed }) => [
                    styles.actionButton,
                    pressed && styles.actionButtonPressed,
                  ]}
                >
                  <View style={styles.actionLeft}>
                    <MaterialCommunityIcons name="database-import-outline" size={ICON_SIZE.md} color={theme.text} />
                    <Text style={styles.actionText}>Import Starter Snippets</Text>
                  </View>
                  <MaterialCommunityIcons name="chevron-right" size={ICON_SIZE.md} color={theme.mutedText} />
                </Pressable>

                {/* Reset Vault */}
                <Pressable
                  onPress={onResetDb}
                  style={({ pressed }) => [
                    styles.actionButton,
                    pressed && styles.actionButtonPressed,
                  ]}
                >
                  <View style={styles.actionLeft}>
                    <MaterialCommunityIcons name="alert-octagon-outline" size={ICON_SIZE.md} color={theme.activeTab} />
                    <Text style={[styles.actionText, styles.destructiveText]}>Reset Vault Database</Text>
                  </View>
                  <MaterialCommunityIcons name="chevron-right" size={ICON_SIZE.md} color={theme.activeTab} />
                </Pressable>
              </View>
            )}
          </ScrollView>
        </Animated.View>
      </View>
    </Modal>
  );
};

export default React.memo(StorageMaintenanceModal);

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
    infoRow: {
      flexDirection: "row",
      alignItems: "center",
      justifyContent: "space-between",
      paddingVertical: SPACING.sm + 2,
    },
    infoLeft: {
      flexDirection: "row",
      alignItems: "center",
      gap: SPACING.sm,
    },
    infoText: {
      fontSize: FONT_SIZE.sm + 2,
      fontFamily: FONT_FAMILY.medium,
      color: theme.text,
    },
    infoValue: {
      fontSize: FONT_SIZE.sm + 2,
      fontFamily: FONT_FAMILY.semibold,
      fontWeight: FONT_WEIGHT.semibold,
      color: theme.mutedText,
    },
    totalRow: {
      borderTopWidth: 1,
      borderTopColor: theme.cardBorder,
      paddingTop: SPACING.md,
      marginTop: SPACING.sm,
    },
    totalText: {
      fontFamily: FONT_FAMILY.bold,
      fontWeight: FONT_WEIGHT.bold,
      color: theme.text,
    },
    totalValue: {
      fontFamily: FONT_FAMILY.bold,
      fontWeight: FONT_WEIGHT.bold,
      color: theme.text,
    },
    modalDivider: {
      height: 1,
      backgroundColor: theme.cardBorder,
      marginVertical: SPACING.md,
    },
    maintenanceLoadingContainer: {
      flexDirection: "row",
      justifyContent: "center",
      alignItems: "center",
      paddingVertical: SPACING.xl,
      gap: SPACING.sm,
    },
    maintenanceLoadingText: {
      color: theme.mutedText,
      fontSize: FONT_SIZE.md - 1,
      fontFamily: FONT_FAMILY.medium,
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
    destructiveText: {
      color: theme.activeTab,
    },
  });
