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
import { getSnippetById, toggleFavorite, deleteSnippet } from "@/services/db/snippets";
import { Snippet } from "@/types";
import { MaterialCommunityIcons } from "@expo/vector-icons";
import { router, useLocalSearchParams, useFocusEffect } from "expo-router";
import React, { useCallback, useState } from "react";
import CustomAlert, { CustomAlertButton } from "@/components/CustomAlert";
import Toast from "@/components/Toast";
import * as Clipboard from "expo-clipboard";
import { Image } from "expo-image";
import { exportSnippetAsFile } from "@/services/fileService";
import {
  Modal,
  Pressable,
  ScrollView,
  Share,
  StyleSheet,
  Text,
  View,
} from "react-native";

const SnippetDetailScreen = () => {
  const { id } = useLocalSearchParams();
  const theme = useTheme();
  const globalStyles = useGlobalStyles(theme);
  const styles = makeStyles(theme);
  const [snippet, setSnippet] = useState<Snippet | null>(null);
  const [toastVisible, setToastVisible] = useState(false);
  const [toastMessage, setToastMessage] = useState("");

  // Attachment Viewer states
  const [isImgPreviewVisible, setIsImgPreviewVisible] = useState(false);



  const handleExportFile = async () => {
    if (!snippet) return;
    try {
      const exportedPath = await exportSnippetAsFile(snippet.title, snippet.code, snippet.language);
      const fileName = exportedPath.split("/").pop();
      setToastMessage(`Exported: ${fileName}`);
      setToastVisible(true);
      
      // Navigate to Home screen and request opening the exports directory modal
      router.navigate("/(tabs)/home?openModal=exports");
    } catch (error) {
      console.error("Failed to export snippet:", error);
      showAlert("Export Failed", "An error occurred while exporting the snippet.");
    }
  };

  // Custom Alert configuration state
  const [alertConfig, setAlertConfig] = useState<{
    visible: boolean;
    title: string;
    message: string;
    buttons: CustomAlertButton[];
  }>({
    visible: false,
    title: "",
    message: "",
    buttons: [],
  });

  const showAlert = (
    title: string,
    message: string,
    buttons: CustomAlertButton[] = []
  ) => {
    setAlertConfig({
      visible: true,
      title,
      message,
      buttons,
    });
  };

  const hideAlert = () => {
    setAlertConfig((prev) => ({ ...prev, visible: false }));
  };

  // Fetch the snippet based on the ID parameter on screen focus
  useFocusEffect(
    useCallback(() => {
      if (id) {
        try {
          const data = getSnippetById(Number(id));
          setSnippet(data);
        } catch (error) {
          console.error("Failed to load snippet:", error);
        }
      }
    }, [id])
  );

  const handleBack = () => {
    router.back();
  };

  const handleEdit = () => {
    if (snippet) {
      router.push(`/CreateSnippetScreen?editId=${snippet.id}`);
    }
  };

  const handleToggleFavorite = () => {
    if (snippet) {
      try {
        toggleFavorite(snippet.id, snippet.favorite);
        // Optimistic UI update
        setSnippet({
          ...snippet,
          favorite: snippet.favorite ? 0 : 1,
        });
      } catch (error) {
        console.error("Failed to toggle favorite", error);
      }
    }
  };

  const handleDelete = () => {
    if (!snippet) return;
    showAlert("Delete Snippet", "Are you sure you want to delete this snippet?", [
      { text: "Cancel", style: "cancel" },
      { 
        text: "Delete", 
        style: "destructive", 
        onPress: () => {
          try {
            deleteSnippet(snippet.id);
            router.back();
          } catch (error) {
            console.error("Failed to delete snippet:", error);
            showAlert(
              "Database Error",
              "Unable to delete snippet. Please check local database storage."
            );
          }
        }
      }
    ]);
  };

  const handleCopyCode = async () => {
    if (snippet) {
      try {
        await Clipboard.setStringAsync(snippet.code);
        setToastMessage("Code copied to clipboard!");
        setToastVisible(true);
      } catch (error) {
        console.error("Failed to copy code to clipboard:", error);
      }
    }
  };

  const handleShare = async () => {
    if (!snippet) return;
    try {
      await Share.share({
        message: `${snippet.title}\n\n${snippet.code}`,
      });
    } catch (error) {
      console.error("Failed to share", error);
    }
  };

  if (!snippet) {
    return (
      <View style={[globalStyles.screenContainer, styles.centerContent]}>
        <Text style={styles.loadingText}>Loading Snippet...</Text>
      </View>
    );
  }

  const createdDate = new Date(snippet.created_at * 1000).toLocaleDateString(
    undefined,
    {
      month: "long",
      day: "numeric",
      year: "numeric",
    }
  );

  return (
    <View style={globalStyles.screenContainer}>
      {/* Header */}
      <View style={[globalStyles.headerRow, styles.header]}>
        <Pressable onPress={handleBack} style={styles.iconButton}>
          <MaterialCommunityIcons
            name="arrow-left"
            size={ICON_SIZE.xl}
            color={theme.text}
          />
        </Pressable>
        <Text style={styles.headerTitle} numberOfLines={1}>
          {snippet.title}
        </Text>
        <Pressable onPress={handleEdit} style={styles.iconButton}>
          <MaterialCommunityIcons
            name="pencil"
            size={ICON_SIZE.xl}
            color={theme.text}
          />
        </Pressable>
      </View>

      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.scrollContent}>
        
        {/* Metadata Section */}
        <View style={styles.metaContainer}>
          <View style={styles.languageBadge}>
            <Text style={styles.languageText}>{snippet.language}</Text>
          </View>
          <Text style={styles.dateText}>{createdDate}</Text>
        </View>

        {/* Title */}
        <Text style={styles.mainTitle}>{snippet.title}</Text>

        {/* Description or AI Summary */}
        {(snippet.description || snippet.ai_summary) && (
          <View style={styles.section}>
            <Text style={styles.bodyText}>
              {snippet.description || snippet.ai_summary}
            </Text>
          </View>
        )}

        {/* Tags */}
        {snippet.tags && (
          <View style={styles.tagsContainer}>
            {snippet.tags.split(",").map((tag, index) => (
              <View key={index} style={styles.tag}>
                <Text style={styles.tagText}>#{tag.trim()}</Text>
              </View>
            ))}
          </View>
        )}

        {/* Code Block */}
        <View style={styles.section}>
          <View style={styles.codeHeaderRow}>
            <Text style={styles.sectionHeader}>Code</Text>
            <View style={styles.codeActionRow}>
              {/* Copy */}
              <Pressable
                onPress={handleCopyCode}
                style={({ pressed }) => [
                  styles.copyButton,
                  pressed && styles.copyButtonPressed,
                ]}
              >
                <MaterialCommunityIcons name="content-copy" size={ICON_SIZE.md} color={theme.mutedText} />
              </Pressable>

              {/* Share */}
              <Pressable
                onPress={handleShare}
                style={({ pressed }) => [
                  styles.copyButton,
                  pressed && styles.copyButtonPressed,
                ]}
              >
                <MaterialCommunityIcons name="share-variant" size={ICON_SIZE.md} color={theme.mutedText} />
              </Pressable>

              {/* Favorite */}
              <Pressable
                onPress={handleToggleFavorite}
                style={({ pressed }) => [
                  styles.copyButton,
                  pressed && styles.copyButtonPressed,
                ]}
              >
                <MaterialCommunityIcons
                  name={snippet.favorite ? "star" : "star-outline"}
                  size={ICON_SIZE.md}
                  color={snippet.favorite ? theme.favorite : theme.mutedText}
                />
              </Pressable>

              {/* Export */}
              <Pressable
                onPress={handleExportFile}
                style={({ pressed }) => [
                  styles.copyButton,
                  pressed && styles.copyButtonPressed,
                ]}
              >
                <MaterialCommunityIcons name="file-export-outline" size={ICON_SIZE.md} color={theme.fileIcon} />
              </Pressable>

              {/* Delete */}
              <Pressable
                onPress={handleDelete}
                style={({ pressed }) => [
                  styles.copyButton,
                  pressed && styles.copyButtonPressed,
                ]}
              >
                <MaterialCommunityIcons name="delete-outline" size={ICON_SIZE.md} color={theme.activeTab} />
              </Pressable>
            </View>
          </View>
          <View style={styles.codeContainer}>
            <ScrollView showsVerticalScrollIndicator={true} nestedScrollEnabled={true}>
              <ScrollView horizontal showsHorizontalScrollIndicator={false}>
                <Text style={styles.codeText}>{snippet.code}</Text>
              </ScrollView>
            </ScrollView>
          </View>
        </View>

        {/* Attachments Section */}
        {snippet.screenshot_path && (
          <View style={styles.section}>
            <Text style={styles.sectionHeader}>Attachments</Text>
            <View style={styles.detailAttachmentsContainer}>
              <Pressable
                onPress={() => setIsImgPreviewVisible(true)}
                style={styles.screenshotAttachmentCard}
              >
                <Image
                  source={snippet.screenshot_path}
                  style={styles.screenshotThumbnail}
                  contentFit="cover"
                />
                <View style={styles.attachmentOverlay}>
                  <MaterialCommunityIcons name="fullscreen" size={24} color={theme.white} />
                  <Text style={styles.overlayText}>View Screen</Text>
                </View>
              </Pressable>
            </View>
          </View>
        )}

      </ScrollView>
      <CustomAlert
        visible={alertConfig.visible}
        title={alertConfig.title}
        message={alertConfig.message}
        buttons={alertConfig.buttons}
        onClose={hideAlert}
      />
      <Toast
        visible={toastVisible}
        message={toastMessage}
        onHide={() => setToastVisible(false)}
      />

      {/* Fullscreen Screenshot Modal */}
      {snippet.screenshot_path && (
        <Modal
          visible={isImgPreviewVisible}
          transparent={true}
          animationType="fade"
          onRequestClose={() => setIsImgPreviewVisible(false)}
        >
          <View style={styles.imgBackdrop}>
            <View style={styles.viewerHeader}>
              <Text style={styles.viewerHeaderTitle} numberOfLines={1}>
                Screenshot Attachment
              </Text>
              <View style={styles.viewerHeaderActions}>
                <Pressable
                  onPress={async () => {
                    try {
                      await Share.share({
                        url: snippet.screenshot_path || "",
                        message: "Snippet Screenshot",
                      });
                    } catch (err) {
                      console.error("Failed to share screenshot:", err);
                    }
                  }}
                  style={styles.closeViewBtn}
                >
                  <MaterialCommunityIcons name="share-variant" size={ICON_SIZE.md} color={theme.white} />
                </Pressable>
                <Pressable
                  onPress={() => setIsImgPreviewVisible(false)}
                  style={styles.closeViewBtn}
                >
                  <MaterialCommunityIcons name="close" size={ICON_SIZE.lg} color={theme.white} />
                </Pressable>
              </View>
            </View>
            <Image
              source={snippet.screenshot_path}
              style={styles.fullscreenImage}
              contentFit="contain"
            />
          </View>
        </Modal>
      )}


    </View>
  );
};

export default SnippetDetailScreen;

const makeStyles = (theme: Theme) =>
  StyleSheet.create({
    copyButton: {
      padding: SPACING.xs,
      borderRadius: BORDER_RADIUS.sm,
      backgroundColor: theme.tagBg,
      borderWidth: 1,
      borderColor: theme.cardBorder,
    },
    copyButtonPressed: {
      opacity: 0.7,
    },
    centerContent: {
      justifyContent: "center",
      alignItems: "center",
    },
    loadingText: {
      color: theme.mutedText,
      fontSize: FONT_SIZE.md,
      fontFamily: FONT_FAMILY.medium,
    },
    header: {
      marginTop: SPACING.md,
      flexDirection: "row",
      alignItems: "center",
      justifyContent: "space-between",
    },
    codeActionRow: {
      flexDirection: "row",
      alignItems: "center",
      gap: SPACING.sm,
    },
    iconButton: {
      padding: SPACING.sm,
      borderRadius: BORDER_RADIUS.full,
      backgroundColor: theme.card,
    },
    headerTitle: {
      flex: 1,
      textAlign: "center",
      fontSize: FONT_SIZE.lg,
      fontFamily: FONT_FAMILY.bold,
      color: theme.text,
      marginHorizontal: SPACING.md,
    },
    scrollContent: {
      paddingVertical: SPACING.lg,
      paddingBottom: SPACING.xxxl,
    },
    metaContainer: {
      flexDirection: "row",
      alignItems: "center",
      justifyContent: "space-between",
      marginBottom: SPACING.sm,
    },
    languageBadge: {
      backgroundColor: theme.activeTabSoft,
      paddingHorizontal: SPACING.md,
      paddingVertical: SPACING.xs,
      borderRadius: BORDER_RADIUS.sm,
    },
    languageText: {
      color: theme.activeTab,
      fontSize: FONT_SIZE.sm,
      fontFamily: FONT_FAMILY.semibold,
      textTransform: "uppercase",
    },
    dateText: {
      color: theme.mutedText,
      fontSize: FONT_SIZE.sm,
      fontFamily: FONT_FAMILY.medium,
    },
    mainTitle: {
      fontSize: FONT_SIZE.xxl,
      fontFamily: FONT_FAMILY.bold,
      color: theme.text,
      marginBottom: SPACING.xl,
    },
    section: {
      marginBottom: SPACING.xl,
    },
    sectionHeader: {
      fontSize: FONT_SIZE.lg,
      fontFamily: FONT_FAMILY.semibold,
      color: theme.text,
      marginBottom: SPACING.sm,
    },
    bodyText: {
      fontSize: FONT_SIZE.md,
      fontFamily: FONT_FAMILY.regular,
      color: theme.mutedText,
      lineHeight: 24,
    },
    tagsContainer: {
      flexDirection: "row",
      flexWrap: "wrap",
      gap: SPACING.sm,
      marginBottom: SPACING.xl,
    },
    tag: {
      backgroundColor: theme.tagBg,
      paddingHorizontal: SPACING.md,
      paddingVertical: SPACING.xs,
      borderRadius: BORDER_RADIUS.full,
    },
    tagText: {
      color: theme.text,
      fontSize: FONT_SIZE.sm,
      fontFamily: FONT_FAMILY.medium,
    },
    codeHeaderRow: {
      flexDirection: "row",
      justifyContent: "space-between",
      alignItems: "center",
      marginBottom: SPACING.xs,
    },
    codeContainer: {
      backgroundColor: theme.codeBg,
      padding: SPACING.md,
      borderRadius: BORDER_RADIUS.lg,
      maxHeight: 350,
      borderWidth: 1,
      borderColor: theme.cardBorder,
      ...SHADOW.sm,
    },
    codeText: {
      fontFamily: "monospace",
      fontSize: FONT_SIZE.sm,
      color: theme.codeText,
      lineHeight: 22,
    },
    detailAttachmentsContainer: {
      flexDirection: "column",
      gap: SPACING.md,
      marginTop: SPACING.xs,
    },
    screenshotAttachmentCard: {
      width: "100%",
      height: 180,
      borderRadius: BORDER_RADIUS.md,
      overflow: "hidden",
      borderWidth: 1,
      borderColor: theme.cardBorder,
      position: "relative",
    },
    screenshotThumbnail: {
      width: "100%",
      height: "100%",
    },
    attachmentOverlay: {
      position: "absolute",
      bottom: 0,
      left: 0,
      right: 0,
      backgroundColor: "rgba(0,0,0,0.5)",
      paddingVertical: SPACING.sm,
      flexDirection: "row",
      alignItems: "center",
      justifyContent: "center",
      gap: SPACING.sm,
    },
    overlayText: {
      color: theme.white,
      fontSize: FONT_SIZE.sm,
      fontFamily: FONT_FAMILY.medium,
      fontWeight: FONT_WEIGHT.medium,
    },
    imgBackdrop: {
      flex: 1,
      backgroundColor: "#000000e0",
      justifyContent: "center",
      alignItems: "center",
    },
    fullscreenImage: {
      width: "100%",
      height: "80%",
    },
    viewerHeader: {
      width: "100%",
      flexDirection: "row",
      alignItems: "center",
      justifyContent: "space-between",
      paddingHorizontal: SPACING.md,
      paddingTop: 50,
      paddingBottom: SPACING.md,
    },
    viewerHeaderTitle: {
      color: "#FFFFFF",
      fontSize: FONT_SIZE.lg,
      fontFamily: FONT_FAMILY.bold,
      fontWeight: FONT_WEIGHT.bold,
      flex: 1,
    },
    viewerHeaderActions: {
      flexDirection: "row",
      alignItems: "center",
      gap: SPACING.sm,
    },
    closeViewBtn: {
      padding: SPACING.sm,
      borderRadius: BORDER_RADIUS.full,
      backgroundColor: "rgba(255,255,255,0.2)",
    },
  });