import { useThemedStyles } from "@/hooks/useThemedStyles";
import React, { memo, useState, useEffect, useCallback } from "react";
import {
  Modal,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
  ActivityIndicator,
  Dimensions,
  Share,
} from "react-native";
import { MaterialCommunityIcons } from "@expo/vector-icons";
import { Image } from "expo-image";
import * as Clipboard from "expo-clipboard";
import Animated, {
  useAnimatedStyle,
  useSharedValue,
  withTiming,
  SlideInDown,
  SlideOutDown,
} from "react-native-reanimated";

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
import { useTheme } from "@/hooks/useTheme";
import {
  DirectoryType,
  FileItem,
  listFiles,
  deleteFile,
  readFile,
  downloadFile,
  formatBytes,
  isImageFile,
  isCodeFile,
} from "@/services/fileService";
import CustomAlert, { CustomAlertButton } from "@/components/CustomAlert";
import Toast from "@/components/Toast";

interface FileManagementModalProps {
  visible: boolean;
  directory: DirectoryType | null;
  onClose: () => void;
  onRefreshStats?: () => void;
}

const { width: SCREEN_WIDTH, height: SCREEN_HEIGHT } = Dimensions.get("window");

const AnimatedPressable = Animated.createAnimatedComponent(Pressable);

const FileManagementModal = ({
  visible,
  directory,
  onClose,
  onRefreshStats,
}: FileManagementModalProps) => {
  const theme = useTheme();
  const styles = useThemedStyles(makeStyles, theme);

  // States
  const [files, setFiles] = useState<FileItem[]>([]);
  const [searchQuery, setSearchQuery] = useState("");
  const [downloadUrl, setDownloadUrl] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [isDownloading, setIsDownloading] = useState(false);
  const [viewingFile, setViewingFile] = useState<FileItem | null>(null);
  const [viewingFileContent, setViewingFileContent] = useState("");
  const [viewingFileLoading, setViewingFileLoading] = useState(false);

  // Custom Toast state
  const [toastVisible, setToastVisible] = useState(false);
  const [toastMessage, setToastMessage] = useState("");

  // Custom Alert state
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

  const showCustomAlert = (
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

  const hideCustomAlert = () => {
    setAlertConfig((prev) => ({ ...prev, visible: false }));
  };

  const showToast = (message: string) => {
    setToastMessage(message);
    setToastVisible(true);
  };

  // Load files from the physical directory
  const loadFilesList = useCallback(async () => {
    if (!directory) return;
    setIsLoading(true);
    try {
      const list = await listFiles(directory);
      setFiles(list);
    } catch (error) {
      console.error(`Error listing files for directory '${directory}':`, error);
      showToast(`Failed to load files from ${directory}.`);
    } finally {
      setIsLoading(false);
    }
  }, [directory]);

  useEffect(() => {
    if (visible && directory) {
      loadFilesList();
      setSearchQuery("");
      setDownloadUrl("");
      setViewingFile(null);
    }
  }, [visible, directory, loadFilesList]);

  // Load code/text content if viewing a text file
  useEffect(() => {
    if (viewingFile && isCodeFile(viewingFile.name)) {
      setViewingFileLoading(true);
      readFile(viewingFile.path)
        .then((content) => {
          setViewingFileContent(content);
        })
        .catch((error) => {
          console.error("Failed to read file:", error);
          showToast("Could not open file content.");
          setViewingFile(null);
        })
        .finally(() => {
          setViewingFileLoading(false);
        });
    } else {
      setViewingFileContent("");
    }
  }, [viewingFile]);

  // Filter files by search query
  const filteredFiles = files.filter((f) =>
    f.name.toLowerCase().includes(searchQuery.toLowerCase())
  );

  // Handlers
  const handleDownload = async () => {
    if (!downloadUrl.trim()) {
      showCustomAlert("Invalid URL", "Please enter a valid HTTP or HTTPS URL to download.");
      return;
    }
    if (!downloadUrl.startsWith("http://") && !downloadUrl.startsWith("https://")) {
      showCustomAlert("Invalid URL", "Only http:// and https:// URLs are supported.");
      return;
    }

    setIsDownloading(true);
    try {
      const result = await downloadFile(downloadUrl.trim(), "downloads");
      if (result.status === 200) {
        showToast("File downloaded successfully!");
        setDownloadUrl("");
        await loadFilesList();
        if (onRefreshStats) onRefreshStats();
      } else {
        showCustomAlert("Download Failed", `Server returned status code: ${result.status}`);
      }
    } catch (error) {
      console.error("Download error:", error);
      showCustomAlert("Download Error", "Unable to download file. Please check URL and internet connection.");
    } finally {
      setIsDownloading(false);
    }
  };

  const handleDelete = (item: FileItem) => {
    showCustomAlert(
      "Delete File",
      `Are you sure you want to permanently delete "${item.name}"? This action cannot be undone.`,
      [
        { text: "Cancel", style: "cancel" },
        {
          text: "Delete",
          style: "destructive",
          onPress: async () => {
            try {
              await deleteFile(item.path);
              showToast("File deleted.");
              await loadFilesList();
              if (onRefreshStats) onRefreshStats();
            } catch (error) {
              console.error("Delete error:", error);
              showToast("Failed to delete file.");
            }
          },
        },
      ]
    );
  };

  const handleCopyCode = async () => {
    if (viewingFileContent) {
      try {
        await Clipboard.setStringAsync(viewingFileContent);
        showToast("Content copied to clipboard!");
      } catch (err) {
        console.error("Failed to copy:", err);
      }
    }
  };

  const handleShareFile = async () => {
    if (!viewingFile) return;
    try {
      if (isCodeFile(viewingFile.name)) {
        const content = await readFile(viewingFile.path);
        await Share.share({
          message: content,
          title: viewingFile.name,
        });
      } else {
        await Share.share({
          url: viewingFile.path,
          message: `Check out this file: ${viewingFile.name}`,
        });
      }
    } catch (err) {
      console.error("Failed to share file:", err);
      showToast("Failed to share file.");
    }
  };

  // Get display title
  const getModalTitle = (): string => {
    switch (directory) {
      case "exports":
        return "Exported Code Files";
      case "images":
        return "Snippet Screenshots";
      case "downloads":
        return "Downloaded Files";
      case "temp":
        return "Temporary Assets";
      default:
        return "Local Vault";
    }
  };

  // Get extension icon
  const getFileIcon = (fileName: string): keyof typeof MaterialCommunityIcons.glyphMap => {
    if (isImageFile(fileName)) return "image";
    if (isCodeFile(fileName)) {
      if (fileName.endsWith(".json")) return "code-json";
      return "file-code-outline";
    }
    return "file-document-outline";
  };

  if (!visible) return null;

  return (
    <Modal
      transparent
      visible={visible}
      animationType="fade"
      onRequestClose={onClose}
    >
      <View style={styles.backdrop}>
        <Animated.View
          entering={SlideInDown.duration(300)}
          exiting={SlideOutDown.duration(250)}
          style={styles.modalContent}
        >
          {/* Main List Mode */}
          {!viewingFile ? (
            <View style={styles.mainContainer}>
              {/* Header */}
              <View style={styles.header}>
                <Text style={styles.title} numberOfLines={1}>
                  {getModalTitle()}
                </Text>
                <Pressable 
                  onPress={onClose} 
                  style={styles.closeButton}
                  hitSlop={{ top: 50, bottom: 50, left: 50, right: 30 }}>
                  <MaterialCommunityIcons
                    name="close"
                    size={ICON_SIZE.lg}
                    color={theme.text}
                  />
                </Pressable>
              </View>

              {/* URL Downloader for Downloads directory */}
              {directory === "downloads" && (
                <View style={styles.downloaderRow}>
                  <TextInput
                    style={styles.downloaderInput}
                    value={downloadUrl}
                    onChangeText={setDownloadUrl}
                    placeholder="Enter file URL to download..."
                    placeholderTextColor={theme.mutedText}
                    autoCapitalize="none"
                    autoCorrect={false}
                    editable={!isDownloading}
                  />
                  <Pressable
                    onPress={handleDownload}
                    style={({ pressed }) => [
                      styles.downloaderBtn,
                      pressed && styles.btnPressed,
                    ]}
                    disabled={isDownloading}
                  >
                    {isDownloading ? (
                      <ActivityIndicator size="small" color={theme.white} />
                    ) : (
                      <MaterialCommunityIcons
                        name="download"
                        size={ICON_SIZE.md}
                        color={theme.white}
                      />
                    )}
                  </Pressable>
                </View>
              )}

              {/* Search Bar */}
              <View style={styles.searchBarContainer}>
                <MaterialCommunityIcons
                  name="magnify"
                  size={ICON_SIZE.md}
                  color={theme.mutedText}
                  style={styles.searchIcon}
                />
                <TextInput
                  style={styles.searchInput}
                  value={searchQuery}
                  onChangeText={setSearchQuery}
                  placeholder={`Search in ${getModalTitle().toLowerCase()}...`}
                  placeholderTextColor={theme.mutedText}
                  autoCapitalize="none"
                  autoCorrect={false}
                />
                {searchQuery.length > 0 && (
                  <Pressable onPress={() => setSearchQuery("")} style={styles.clearSearchBtn}>
                    <MaterialCommunityIcons
                      name="close-circle"
                      size={ICON_SIZE.sm}
                      color={theme.mutedText}
                    />
                  </Pressable>
                )}
              </View>

              {/* File List */}
              {isLoading ? (
                <View style={styles.centerContainer}>
                  <ActivityIndicator size="large" color={theme.activeTab} />
                  <Text style={styles.loadingText}>Reading files...</Text>
                </View>
              ) : filteredFiles.length > 0 ? (
                <ScrollView
                  showsVerticalScrollIndicator={true}
                  contentContainerStyle={styles.scrollContent}
                >
                  {filteredFiles.map((item) => {
                    return (
                      <FileRowItem
                        key={item.path}
                        item={item}
                        theme={theme}
                        styles={styles}
                        onPress={() => setViewingFile(item)}
                        onDelete={() => handleDelete(item)}
                        getFileIcon={getFileIcon}
                      />
                    );
                  })}
                </ScrollView>
              ) : (
                <View style={styles.centerContainer}>
                  <MaterialCommunityIcons
                    name="folder-open-outline"
                    size={ICON_SIZE.xl + 18}
                    color={theme.inactiveTab}
                  />
                  <Text style={styles.emptyText}>
                    {searchQuery.length > 0
                      ? "No files matching search query"
                      : "Directory is empty"}
                  </Text>
                </View>
              )}
            </View>
          ) : (
            /* File Viewer Mode */
            <View style={styles.viewerContainer}>
              {/* Viewer Header */}
              <View style={styles.header}>
                <Pressable
                  onPress={() => setViewingFile(null)}
                  style={styles.backButton}
                  hitSlop={{ top: 30, bottom: 30, left: 20, right: 100 }}
                >
                  <MaterialCommunityIcons
                    name="arrow-left"
                    size={ICON_SIZE.lg}
                    color={theme.text}
                  />
                </Pressable>
                <Text style={styles.title} numberOfLines={1}>
                  {viewingFile.name}
                </Text>
                <View style={styles.headerActions}>
                  {isCodeFile(viewingFile.name) && (
                    <Pressable
                      onPress={handleCopyCode}
                      style={styles.iconActionBtn}
                    >
                      <MaterialCommunityIcons
                        name="content-copy"
                        size={ICON_SIZE.md}
                        color={theme.text}
                      />
                    </Pressable>
                  )}
                  <Pressable
                    onPress={handleShareFile}
                    style={styles.iconActionBtn}
                  >
                    <MaterialCommunityIcons
                      name="share-variant"
                      size={ICON_SIZE.md}
                      color={theme.text}
                    />
                  </Pressable>
                  <Pressable
                    onPress={() => {
                      const fileToDel = viewingFile;
                      setViewingFile(null);
                      handleDelete(fileToDel);
                    }}
                    style={styles.iconActionBtn}
                  >
                    <MaterialCommunityIcons
                      name="delete-outline"
                      size={ICON_SIZE.md}
                      color={theme.activeTab}
                    />
                  </Pressable>
                </View>
              </View>

              {/* Viewer Content */}
              {viewingFileLoading ? (
                <View style={styles.centerContainer}>
                  <ActivityIndicator size="large" color={theme.activeTab} />
                  <Text style={styles.loadingText}>Reading file content...</Text>
                </View>
              ) : isImageFile(viewingFile.name) ? (
                <View style={styles.imageViewer}>
                  <Image
                    source={{ uri: viewingFile.path }}
                    style={styles.imagePreview}
                    contentFit="contain"
                    placeholder={require("@/assets/images/react-logo.png")}
                  />
                </View>
              ) : isCodeFile(viewingFile.name) ? (
                <View style={styles.codeViewer}>
                  <ScrollView showsVerticalScrollIndicator={true}>
                    <ScrollView horizontal showsHorizontalScrollIndicator={true}>
                      <Text style={styles.codeText}>{viewingFileContent}</Text>
                    </ScrollView>
                  </ScrollView>
                </View>
              ) : (
                <View style={styles.centerContainer}>
                  <MaterialCommunityIcons
                    name="file-question-outline"
                    size={ICON_SIZE.xl + 20}
                    color={theme.inactiveTab}
                  />
                  <Text style={styles.unsupportedText}>
                    Previews are not supported for this file type.
                  </Text>
                  <Text style={styles.fileSizeText}>
                    File Size: {formatBytes(viewingFile.size)}
                  </Text>
                </View>
              )}
            </View>
          )}
        </Animated.View>
      </View>

      {/* Internal Alerts/Toasts */}
      <CustomAlert
        visible={alertConfig.visible}
        title={alertConfig.title}
        message={alertConfig.message}
        buttons={alertConfig.buttons}
        onClose={hideCustomAlert}
      />
      <Toast
        visible={toastVisible}
        message={toastMessage}
        onHide={() => setToastVisible(false)}
      />
    </Modal>
  );
};

// Subcomponent: Animated Pressable List Item
interface FileRowItemProps {
  item: FileItem;
  theme: Theme;
  styles: any;
  onPress: () => void;
  onDelete: () => void;
  getFileIcon: (name: string) => keyof typeof MaterialCommunityIcons.glyphMap;
}

const FileRowItem = ({
  item,
  theme,
  styles,
  onPress,
  onDelete,
  getFileIcon,
}: FileRowItemProps) => {
  const scale = useSharedValue(1);

  const animatedStyle = useAnimatedStyle(() => ({
    transform: [{ scale: scale.value }],
  }));

  const handlePressIn = () => {
    scale.value = withTiming(0.98, { duration: 60 });
  };

  const handlePressOut = () => {
    scale.value = withTiming(1, { duration: 100 });
  };

  const dateStr = new Date(item.modifiedAt).toLocaleDateString(undefined, {
    month: "short",
    day: "numeric",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });

  const extension = item.name.split('.').pop()?.toUpperCase() || 'FILE';
  const isImg = isImageFile(item.name);
  const isCode = isCodeFile(item.name);

  // Pill styling based on type
  const getPillColors = () => {
    if (isImg) {
      return {
        bg: theme.activeTabSoft,
        text: theme.activeTab
      };
    }
    if (isCode) {
      return {
        bg: theme.successSoft,
        text: theme.success
      };
    }
    return {
      bg: theme.tagBg,
      text: theme.mutedText
    };
  };

  const colors = getPillColors();

  return (
    <AnimatedPressable
      onPress={onPress}
      onPressIn={handlePressIn}
      onPressOut={handlePressOut}
      style={[styles.fileRow, animatedStyle]}
    >
      <View style={styles.fileIconContainer}>
        <MaterialCommunityIcons
          name={getFileIcon(item.name)}
          size={ICON_SIZE.lg}
          color={isImg ? theme.activeTab : theme.fileIcon}
        />
      </View>
      <View style={styles.fileDetails}>
        <View style={styles.fileNameRow}>
          <Text style={styles.fileName} numberOfLines={1}>
            {item.name}
          </Text>
          <View style={[styles.typePill, { backgroundColor: colors.bg }]}>
            <Text style={[styles.typePillText, { color: colors.text }]}>{extension}</Text>
          </View>
        </View>
        <Text style={styles.fileMeta}>
          {formatBytes(item.size)} • {dateStr}
        </Text>
      </View>
      <Pressable onPress={onDelete} style={styles.deleteButton}>
        <MaterialCommunityIcons
          name="delete-outline"
          size={ICON_SIZE.md}
          color={theme.activeTab}
        />
      </Pressable>
    </AnimatedPressable>
  );
};

export default memo(FileManagementModal);

const makeStyles = (theme: Theme) =>
  StyleSheet.create({
    backdrop: {
      flex: 1,
      backgroundColor: theme.overlay,
      justifyContent: "flex-end",
    },
    modalContent: {
      backgroundColor: theme.background,
      borderTopLeftRadius: BORDER_RADIUS.lg,
      borderTopRightRadius: BORDER_RADIUS.lg,
      paddingTop: SPACING.md,
      paddingHorizontal: SPACING.md,
      paddingBottom: SPACING.xl,
      height: SCREEN_HEIGHT * 0.85,
      borderWidth: 1,
      borderColor: theme.cardBorder,
    },
    mainContainer: {
      flex: 1,
    },
    viewerContainer: {
      flex: 1,
    },
    header: {
      flexDirection: "row",
      alignItems: "center",
      justifyContent: "space-between",
      paddingBottom: SPACING.md,
      borderBottomWidth: 1,
      borderBottomColor: theme.cardBorder,
      marginBottom: SPACING.md,
    },
    title: {
      fontSize: FONT_SIZE.lg,
      fontWeight: FONT_WEIGHT.bold,
      fontFamily: FONT_FAMILY.bold,
      color: theme.text,
      flex: 1,
      marginRight: SPACING.md,
    },
    closeButton: {
      padding: SPACING.xs,
      borderRadius: BORDER_RADIUS.full,
      backgroundColor: theme.tagBg,
    },
    backButton: {
      padding: SPACING.xs,
      borderRadius: BORDER_RADIUS.full,
      backgroundColor: theme.tagBg,
      marginRight: SPACING.md,
    },
    headerActions: {
      flexDirection: "row",
      alignItems: "center",
      gap: SPACING.sm,
    },
    iconActionBtn: {
      padding: SPACING.sm,
      borderRadius: BORDER_RADIUS.md,
      backgroundColor: theme.tagBg,
      borderWidth: 1,
      borderColor: theme.cardBorder,
    },
    downloaderRow: {
      flexDirection: "row",
      alignItems: "center",
      gap: SPACING.sm,
      marginBottom: SPACING.md,
    },
    downloaderInput: {
      flex: 1,
      height: 44,
      backgroundColor: theme.card,
      borderColor: theme.cardBorder,
      borderWidth: 1,
      borderRadius: BORDER_RADIUS.md,
      paddingHorizontal: SPACING.md,
      color: theme.text,
      fontSize: FONT_SIZE.sm + 2,
      fontFamily: FONT_FAMILY.regular,
    },
    downloaderBtn: {
      width: 44,
      height: 44,
      backgroundColor: theme.activeTab,
      borderRadius: BORDER_RADIUS.md,
      justifyContent: "center",
      alignItems: "center",
    },
    btnPressed: {
      opacity: 0.8,
    },
    searchBarContainer: {
      flexDirection: "row",
      alignItems: "center",
      height: 44,
      backgroundColor: theme.tagBg,
      borderRadius: BORDER_RADIUS.md,
      paddingHorizontal: SPACING.md,
      marginBottom: SPACING.md,
      borderWidth: 1,
      borderColor: theme.cardBorder,
    },
    searchIcon: {
      marginRight: SPACING.sm,
    },
    searchInput: {
      flex: 1,
      color: theme.text,
      fontSize: FONT_SIZE.sm + 2,
      fontFamily: FONT_FAMILY.regular,
    },
    clearSearchBtn: {
      padding: SPACING.xs,
    },
    scrollContent: {
      paddingBottom: SPACING.xl,
    },
    centerContainer: {
      flex: 1,
      justifyContent: "center",
      alignItems: "center",
      paddingVertical: SPACING.xxxl,
    },
    loadingText: {
      marginTop: SPACING.md,
      color: theme.mutedText,
      fontSize: FONT_SIZE.md,
      fontFamily: FONT_FAMILY.medium,
    },
    emptyText: {
      marginTop: SPACING.md,
      color: theme.mutedText,
      fontSize: FONT_SIZE.md,
      fontFamily: FONT_FAMILY.medium,
      textAlign: "center",
    },
    fileRow: {
      flexDirection: "row",
      alignItems: "center",
      padding: SPACING.md,
      backgroundColor: theme.card,
      borderRadius: BORDER_RADIUS.md,
      marginBottom: SPACING.sm,
      borderWidth: 1,
      borderColor: theme.cardBorder,
      ...SHADOW.sm,
    },
    fileIconContainer: {
      width: 40,
      height: 40,
      borderRadius: BORDER_RADIUS.sm,
      backgroundColor: theme.tagBg,
      justifyContent: "center",
      alignItems: "center",
      marginRight: SPACING.md,
    },
    fileDetails: {
      flex: 1,
      justifyContent: "center",
    },
    fileName: {
      fontSize: FONT_SIZE.md - 1,
      fontFamily: FONT_FAMILY.semibold,
      fontWeight: FONT_WEIGHT.semibold,
      color: theme.text,
      flexShrink: 1,
    },
    fileNameRow: {
      flexDirection: "row",
      alignItems: "center",
      gap: SPACING.sm,
      marginBottom: SPACING.xs - 2,
    },
    typePill: {
      paddingHorizontal: SPACING.sm,
      paddingVertical: 2,
      borderRadius: BORDER_RADIUS.sm,
      justifyContent: "center",
      alignItems: "center",
    },
    typePillText: {
      fontSize: 10,
      fontFamily: FONT_FAMILY.semibold,
      fontWeight: FONT_WEIGHT.semibold,
    },
    fileMeta: {
      fontSize: FONT_SIZE.sm,
      fontFamily: FONT_FAMILY.regular,
      color: theme.mutedText,
    },
    deleteButton: {
      padding: SPACING.sm,
      borderRadius: BORDER_RADIUS.sm,
      backgroundColor: theme.tagBg,
      marginLeft: SPACING.sm,
    },
    imageViewer: {
      flex: 1,
      backgroundColor: theme.codeBg,
      borderRadius: BORDER_RADIUS.lg,
      overflow: "hidden",
      borderWidth: 1,
      borderColor: theme.cardBorder,
      ...SHADOW.sm,
    },
    imagePreview: {
      width: "100%",
      height: "100%",
    },
    codeViewer: {
      flex: 1,
      backgroundColor: theme.codeBg,
      borderRadius: BORDER_RADIUS.lg,
      padding: SPACING.md,
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
    unsupportedText: {
      marginTop: SPACING.lg,
      color: theme.text,
      fontSize: FONT_SIZE.md,
      fontFamily: FONT_FAMILY.semibold,
      textAlign: "center",
    },
    fileSizeText: {
      marginTop: SPACING.sm,
      color: theme.mutedText,
      fontSize: FONT_SIZE.sm,
      fontFamily: FONT_FAMILY.regular,
    },
  });
