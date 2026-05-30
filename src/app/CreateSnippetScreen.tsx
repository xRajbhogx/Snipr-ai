import CustomAlert, { CustomAlertButton } from "@/components/CustomAlert";
import {
  BORDER_RADIUS,
  FONT_FAMILY,
  FONT_SIZE,
  ICON_SIZE,
  SHADOW,
  SPACING,
  Theme,
} from "@/constants/theme";
import { useGlobalStyles } from "@/constants/useGlobalStyles";
import { useUserPreferences } from "@/hooks/useUserPreferences";
import { useTheme } from "@/hooks/useTheme";
import { useThemedStyles } from "@/hooks/useThemedStyles";
import {
  createSnippet,
  getSnippetById,
  updateSnippet,
} from "@/services/db/snippets";
import { MaterialCommunityIcons } from "@expo/vector-icons";
import * as Clipboard from "expo-clipboard";
import { router, useLocalSearchParams } from "expo-router";
import React, { useEffect, useState } from "react";
import * as ImagePicker from "expo-image-picker";
import Toast from "@/components/Toast";
import {
  saveSnippetImage,
  renameFile,
} from "@/services/fileService";
import {
  ActivityIndicator,
  KeyboardAvoidingView,
  Modal,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from "react-native";
import Animated, { SlideInDown, SlideOutDown } from "react-native-reanimated";

const LANGUAGES = [
  { id: "ts", label: "TypeScript", icon: "language-typescript" },
  { id: "js", label: "JavaScript", icon: "language-javascript" },
  { id: "py", label: "Python", icon: "language-python" },
  { id: "java", label: "Java", icon: "language-java" },
  { id: "go", label: "Go", icon: "language-go" },
  { id: "kt", label: "Kotlin", icon: "language-kotlin" },
  { id: "swift", label: "Swift", icon: "language-swift" },
  { id: "cs", label: "C#", icon: "language-csharp" },
  { id: "cpp", label: "C++", icon: "language-cpp" },
  { id: "rs", label: "Rust", icon: "language-rust" },
  { id: "rb", label: "Ruby", icon: "language-ruby" },
  { id: "php", label: "PHP", icon: "language-php" },
];

const CreateSnippetScreen = () => {
  const theme = useTheme();
  const globalStyles = useGlobalStyles(theme);
  const styles = useThemedStyles(makeStyles, theme);

  const { editId } = useLocalSearchParams<{ editId?: string }>();
  const isEditing = !!editId;

  const { preferences } = useUserPreferences();

  // Form state
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  // Default to persisted preference; overridden when editing an existing snippet
  const [selectedLang, setSelectedLang] = useState("TypeScript");
  const [showLangDropdown, setShowLangDropdown] = useState(false);
  const [tags, setTags] = useState<string[]>([]);
  const [tagInput, setTagInput] = useState("");
  const [code, setCode] = useState("");

  // Attachments state
  const [screenshotPath, setScreenshotPath] = useState<string | null>(null);

  // Toast states
  const [toastVisible, setToastVisible] = useState(false);
  const [toastMessage, setToastMessage] = useState("");

  const showToast = (message: string) => {
    setToastMessage(message);
    setToastVisible(true);
  };

  // Action feedback states
  const [isScanningOcr, setIsScanningOcr] = useState(false);

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
    buttons: CustomAlertButton[] = [],
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

  // Load snippet data if editing
  useEffect(() => {
    if (editId) {
      try {
        const snippet = getSnippetById(Number(editId));
        if (snippet) {
          setTitle(snippet.title);
          setDescription(snippet.description || "");
          setSelectedLang(snippet.language);
          setCode(snippet.code);
          setTags(snippet.tags ? snippet.tags.split(",") : []);
          setScreenshotPath(snippet.screenshot_path || null);
        }
      } catch (error) {
        console.error("Failed to load snippet for editing:", error);
      }
    } else {
      // Apply the user's saved default language when creating a new snippet
      setSelectedLang(preferences.defaultLanguage);
    }
  }, [editId, preferences.defaultLanguage]);

  // Line count calculations for the code editor
  const lineCount = Math.max(code.split("\n").length, 1);
  const lineNumbersText = Array.from(
    { length: lineCount },
    (_, i) => i + 1,
  ).join("\n");

  // Current Date display matching SnippetDetailScreen
  const currentDate = new Date().toLocaleDateString(undefined, {
    month: "long",
    day: "numeric",
    year: "numeric",
  });

  // Tag Handlers
  const handleAddTag = () => {
    if (tagInput.trim()) {
      const newTag = tagInput.trim().toLowerCase();
      if (!tags.includes(newTag)) {
        setTags([...tags, newTag]);
      }
      setTagInput("");
    }
  };

  const handleRemoveTag = (indexToRemove: number) => {
    setTags(tags.filter((_, idx) => idx !== indexToRemove));
  };

  const handleTagInputChange = (text: string) => {
    if (text.endsWith(",") || text.endsWith(" ")) {
      const tagValue = text.slice(0, -1).trim().toLowerCase();
      if (tagValue) {
        if (!tags.includes(tagValue)) {
          setTags([...tags, tagValue]);
        }
        setTagInput("");
      }
    } else {
      setTagInput(text);
    }
  };

  // Paste
  const handlePaste = async () => {
    try {
      const text = await Clipboard.getStringAsync();
      if (text.trim()) {
        setCode((prev) => (prev ? prev + "\n" + text : text));
        showAlert("Success", "Pasted from clipboard.");
      } else {
        showAlert(
          "Clipboard Empty",
          "There is no text in your clipboard to paste.",
        );
      }
    } catch (error) {
      console.error("Failed to read from clipboard:", error);
      showAlert(
        "Paste Failed",
        "Unable to access clipboard. Please check app permissions.",
      );
    }
  };

  // Attachment Actions
  const handleAttachScreenshot = async () => {
    try {
      const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
      if (status !== "granted") {
        showAlert(
          "Permission Required",
          "We need permission to access your photo library to attach a screenshot."
        );
        return;
      }

      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ["images"],
        quality: 1,
        allowsMultipleSelection: false,
      });

      if (!result.canceled && result.assets && result.assets.length > 0) {
        const pickedUri = result.assets[0].uri;
        setIsScanningOcr(true);
        const storedPath = await saveSnippetImage(pickedUri, title.trim() || undefined);
        setScreenshotPath(storedPath);
        showToast("Screenshot attached!");
      }
    } catch (error) {
      console.error("Error picking screenshot:", error);
      showAlert("Attachment Failed", "An error occurred while picking the screenshot.");
    } finally {
      setIsScanningOcr(false);
    }
  };



  // Simulated OCR Scanner
  const handleOcrScan = () => {
    setIsScanningOcr(true);
    setTimeout(() => {
      setIsScanningOcr(false);
      setCode(
        (prev) =>
          (prev ? prev + "\n\n" : "") +
          `// Extracted via OCR Scan\nfunction greetUser(name: string) {\n  return \`Hello, \${name}!\`;\n}`,
      );
      showAlert(
        "OCR Success",
        "Code has been successfully scanned and extracted into the editor.",
      );
    }, 1500);
  };

  // SQLite Save Handler
  const handleSaveSnippet = async () => {
    if (!title.trim()) {
      showAlert("Required Input", "Please enter a title for this snippet.");
      return;
    }
    if (!code.trim()) {
      showAlert("Required Input", "Please write or paste code before saving.");
      return;
    }

    try {
      const tagsString = tags.length > 0 ? tags.join(",") : null;
      let finalScreenshotPath = screenshotPath;

      if (screenshotPath) {
        try {
          finalScreenshotPath = await renameFile(screenshotPath, title.trim());
          setScreenshotPath(finalScreenshotPath);
        } catch (renameErr) {
          console.error("Failed to rename screenshot to title:", renameErr);
        }
      }

      if (isEditing && editId) {
        updateSnippet({
          id: Number(editId),
          title: title.trim(),
          code: code.trim(),
          language: selectedLang,
          tags: tagsString || undefined,
          description: description.trim() || undefined,
          screenshot_path: finalScreenshotPath || undefined,
        });
      } else {
        createSnippet({
          title: title.trim(),
          code: code.trim(),
          language: selectedLang,
          tags: tagsString || undefined,
          description: description.trim() || undefined,
          screenshot_path: finalScreenshotPath || undefined,
        });
      }

      showAlert(
        isEditing ? "Snippet Updated" : "Snippet Saved",
        isEditing
          ? "Your changes have been updated successfully!"
          : "Your snippet has been written to the database successfully!",
        [
          {
            text: "OK",
            onPress: () => {
              router.back();
            },
          },
        ],
      );
    } catch (error) {
      console.error("Save error:", error);
      showAlert(
        "Database Error",
        isEditing
          ? "Unable to update snippet. Please check local database storage."
          : "Unable to save snippet. Please check local database storage.",
      );
    }
  };

  return (
    <Animated.View
      style={globalStyles.screenContainer}
      entering={SlideInDown.duration(300)}
      exiting={SlideOutDown.duration(300)}
    >
      <KeyboardAvoidingView
        behavior={Platform.OS === "ios" ? "padding" : undefined}
        style={styles.keyboardAvoiding}
      >
        {/* Header matching SnippetDetailScreen */}
        <View style={[globalStyles.headerRow, styles.header]}>
        <Pressable onPress={() => router.back()} style={styles.iconButton}>
          <MaterialCommunityIcons
            name="arrow-left"
            size={ICON_SIZE.xl}
            color={theme.text}
          />
        </Pressable>
        <Text style={styles.headerTitle} numberOfLines={1}>
          {isEditing ? "Edit Snippet" : "New Snippet"}
        </Text>
        <Pressable onPress={handleSaveSnippet} style={styles.saveButton}>
          <Text style={styles.saveButtonText}>Save</Text>
        </Pressable>
      </View>

      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.scrollContent}
      >
        {/* Language Selection & Date Metadata Section */}
        <View style={styles.languageSection}>
          <View style={styles.metaContainer}>
            <Pressable
              onPress={() => setShowLangDropdown(!showLangDropdown)}
              style={styles.languageBadge}
            >
              <View style={styles.badgeRow}>
                <Text style={styles.languageText}>{selectedLang}</Text>
                <MaterialCommunityIcons
                  name="chevron-down"
                  size={ICON_SIZE.xs}
                  color={theme.activeTab}
                  style={styles.chevronIcon}
                />
              </View>
            </Pressable>
            <Text style={styles.dateText}>{currentDate}</Text>
          </View>

          {showLangDropdown && (
            <Modal
              visible={showLangDropdown}
              transparent={true}
              animationType="fade"
              onRequestClose={() => setShowLangDropdown(false)}
            >
              <Pressable 
                style={styles.modalBackdrop} 
                onPress={() => setShowLangDropdown(false)}
              >
                <Animated.View 
                  entering={SlideInDown.duration(250)}
                  exiting={SlideOutDown.duration(200)}
                  style={styles.modalContent}
                >
                  <View style={styles.modalHeader}>
                    <Text style={styles.modalTitle}>Select Language</Text>
                    <Pressable onPress={() => setShowLangDropdown(false)} style={styles.modalCloseButton}>
                      <MaterialCommunityIcons name="close" size={ICON_SIZE.md} color={theme.text} />
                    </Pressable>
                  </View>

                  <ScrollView 
                    showsVerticalScrollIndicator={true}
                    contentContainerStyle={styles.modalScrollContent}
                  >
                    <View style={styles.modalLangGrid}>
                      {LANGUAGES.map((lang) => {
                        const isActive = selectedLang === lang.label;
                        return (
                          <Pressable
                            key={lang.id}
                            style={[styles.modalLangRow, isActive && styles.modalLangRowActive]}
                            onPress={() => {
                              setSelectedLang(lang.label);
                              setShowLangDropdown(false);
                            }}
                          >
                            <MaterialCommunityIcons
                              name={lang.icon as any}
                              size={ICON_SIZE.md + 4}
                              color={isActive ? theme.white : theme.text}
                            />
                            <Text style={[styles.modalLangText, isActive && styles.modalLangTextActive]}>
                              {lang.label}
                            </Text>
                            {isActive && (
                              <MaterialCommunityIcons 
                                name="check" 
                                size={ICON_SIZE.md} 
                                color={theme.white} 
                                style={styles.checkIcon} 
                              />
                            )}
                          </Pressable>
                        );
                      })}
                    </View>
                  </ScrollView>
                </Animated.View>
              </Pressable>
            </Modal>
          )}
        </View>

        {/* Title Input matching mainTitle style */}
        <View>
          <TextInput
            style={styles.mainTitleInput}
            value={title}
            onChangeText={setTitle}
            placeholder="Snippet Title"
            placeholderTextColor={theme.mutedText}
            maxLength={80}
          />
        </View>

        {/* Description Section */}
        <View style={styles.section}>
          <Text style={styles.sectionHeader}>Description</Text>
          <TextInput
            style={styles.bodyInput}
            multiline
            value={description}
            onChangeText={setDescription}
            placeholder="Add a description or notes..."
            placeholderTextColor={theme.mutedText}
            textAlignVertical="top"
          />
        </View>

        {/* Tags Section */}
        <View style={styles.section}>
          <Text style={styles.sectionHeader}>Tags</Text>
          <View style={styles.tagsContainer}>
            {tags.map((tag, index) => (
              <View key={index} style={styles.tagChip}>
                <Text style={styles.tagText}>#{tag}</Text>
                <Pressable
                  onPress={() => handleRemoveTag(index)}
                  style={styles.tagCloseBtn}
                >
                  <MaterialCommunityIcons
                    name="close"
                    size={ICON_SIZE.xs}
                    color={theme.text}
                  />
                </Pressable>
              </View>
            ))}
            <TextInput
              style={styles.tagInput}
              value={tagInput}
              onChangeText={handleTagInputChange}
              onSubmitEditing={handleAddTag}
              placeholder={
                tags.length === 0
                  ? "Add tags (space/comma separated)..."
                  : "Add tag..."
              }
              placeholderTextColor={theme.mutedText}
              returnKeyType="done"
            />
          </View>
        </View>

        {/* Attachments Section */}
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
                  onPress={() => setScreenshotPath(null)}
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
                onPress={handleAttachScreenshot}
                style={styles.attachmentBtn}
              >
                <MaterialCommunityIcons
                  name="image-outline"
                  size={ICON_SIZE.md}
                  color={theme.activeTab}
                />
                <Text style={styles.attachmentText}>Screenshot</Text>
              </Pressable>
              <Pressable onPress={handleOcrScan} style={styles.attachmentBtn}>
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

        {/* Code Section */}
        <View style={styles.section}>
          <View style={styles.codeHeaderRow}>
            <Text style={styles.sectionHeader}>Code</Text>
            <Pressable onPress={handlePaste} style={styles.pasteButton}>
              <MaterialCommunityIcons
                name="clipboard-outline"
                size={ICON_SIZE.md}
                color={theme.activeTab}
              />
              <Text style={styles.pasteButtonText}>Paste</Text>
            </Pressable>
          </View>
          <View style={styles.codeContainer}>
            <View style={styles.codeBody}>
              <View style={styles.lineNumbers}>
                <Text style={styles.lineNumberText}>{lineNumbersText}</Text>
              </View>
              <TextInput
                style={styles.codeEditor}
                multiline
                value={code}
                onChangeText={setCode}
                placeholder="Write or paste your code here..."
                placeholderTextColor={theme.mutedText}
                textAlignVertical="top"
                editable={true}
                autoCapitalize="none"
                autoCorrect={false}
                scrollEnabled={false}
              />
            </View>
          </View>
        </View>
      </ScrollView>
      </KeyboardAvoidingView>
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
    </Animated.View>
  );
};

export default CreateSnippetScreen;

const makeStyles = (theme: Theme) =>
  StyleSheet.create({
    header: {
      marginTop: SPACING.md,
      flexDirection: "row",
      alignItems: "center",
      justifyContent: "space-between",
    },
    iconButton: {
      padding: SPACING.sm,
      borderRadius: BORDER_RADIUS.full,
      backgroundColor: theme.card,
    },
    saveButton: {
      padding: SPACING.xs,
      borderRadius: BORDER_RADIUS.full,
      backgroundColor: theme.activeTab,
    },
    saveButtonText: {
      paddingVertical: SPACING.sm,
      paddingHorizontal: SPACING.md,
      color: theme.white,
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
    languageSection: {
      zIndex: 20,
      position: "relative",
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
    badgeRow: {
      flexDirection: "row",
      alignItems: "center",
    },
    languageText: {
      color: theme.activeTab,
      fontSize: FONT_SIZE.sm,
      fontFamily: FONT_FAMILY.semibold,
      textTransform: "uppercase",
    },
    chevronIcon: {
      marginLeft: SPACING.xs,
    },
    dateText: {
      color: theme.mutedText,
      fontSize: FONT_SIZE.sm,
      fontFamily: FONT_FAMILY.medium,
    },
    modalBackdrop: {
      flex: 1,
      backgroundColor: theme.overlay,
      justifyContent: "flex-end",
    },
    modalContent: {
      backgroundColor: theme.card,
      borderTopLeftRadius: BORDER_RADIUS.lg,
      borderTopRightRadius: BORDER_RADIUS.lg,
      paddingHorizontal: SPACING.md,
      paddingTop: SPACING.md,
      paddingBottom: SPACING.xl,
      maxHeight: "65%",
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
      color: theme.text,
    },
    modalCloseButton: {
      padding: SPACING.xs,
    },
    modalScrollContent: {
      paddingVertical: SPACING.xs,
    },
    modalLangGrid: {
      gap: SPACING.sm,
    },
    modalLangRow: {
      flexDirection: "row",
      alignItems: "center",
      paddingVertical: SPACING.md,
      paddingHorizontal: SPACING.md,
      borderRadius: BORDER_RADIUS.md,
      backgroundColor: theme.tagBg,
      borderWidth: 1,
      borderColor: theme.cardBorder,
    },
    modalLangRowActive: {
      backgroundColor: theme.activeTab,
      borderColor: theme.activeTab,
    },
    modalLangText: {
      fontSize: FONT_SIZE.md,
      fontFamily: FONT_FAMILY.medium,
      color: theme.text,
      marginLeft: SPACING.md,
      flex: 1,
    },
    modalLangTextActive: {
      color: theme.white,
      fontFamily: FONT_FAMILY.semibold,
    },
    checkIcon: {
      marginLeft: "auto",
    },
    mainTitleInput: {
      fontSize: FONT_SIZE.xxl,
      fontFamily: FONT_FAMILY.extrabold,
      color: theme.text,
      marginBottom: SPACING.xl,
      padding: 0,
      marginTop: SPACING.sm,
    },
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
    bodyInput: {
      fontSize: FONT_SIZE.md,
      fontFamily: FONT_FAMILY.regular,
      color: theme.text,
      lineHeight: 24,
      minHeight: 100,
      textAlignVertical: "top",
      padding: SPACING.md,
      backgroundColor: theme.card,
      borderWidth: 1,
      borderColor: theme.cardBorder,
      borderRadius: BORDER_RADIUS.md,
      ...SHADOW.sm,
    },
    tagsContainer: {
      flexDirection: "row",
      flexWrap: "wrap",
      gap: SPACING.sm,
      marginBottom: SPACING.xl,
      alignItems: "center",
      backgroundColor: theme.card,
      borderWidth: 1,
      borderColor: theme.cardBorder,
      borderRadius: BORDER_RADIUS.md,
      padding: SPACING.md,
      ...SHADOW.sm,
    },
    tagChip: {
      backgroundColor: theme.tagBg,
      paddingLeft: SPACING.md,
      paddingRight: SPACING.sm,
      paddingVertical: SPACING.xs,
      borderRadius: BORDER_RADIUS.full,
      flexDirection: "row",
      alignItems: "center",
      gap: SPACING.sm,
    },
    tagText: {
      color: theme.text,
      fontSize: FONT_SIZE.sm,
      fontFamily: FONT_FAMILY.medium,
    },
    tagCloseBtn: {
      justifyContent: "center",
      alignItems: "center",
    },
    tagInput: {
      color: theme.text,
      fontSize: FONT_SIZE.sm,
      fontFamily: FONT_FAMILY.medium,
      minWidth: 120,
      padding: 0,
    },
    codeHeaderRow: {
      flexDirection: "row",
      justifyContent: "space-between",
      alignItems: "center",
      marginBottom: SPACING.sm,
    },
    pasteButton: {
      flexDirection: "row",
      alignItems: "center",
      gap: SPACING.xs,
      paddingVertical: SPACING.xs,
      paddingHorizontal: SPACING.sm,
      borderRadius: BORDER_RADIUS.sm,
      backgroundColor: theme.tagBg,
    },
    pasteButtonText: {
      color: theme.activeTab,
      fontSize: FONT_SIZE.sm,
      fontFamily: FONT_FAMILY.semibold,
    },
    codeContainer: {
      backgroundColor: theme.codeBg,
      borderRadius: BORDER_RADIUS.lg,
      borderWidth: 1,
      borderColor: theme.cardBorder,
      ...SHADOW.sm,
    },
    codeBody: {
      flexDirection: "row",
      paddingVertical: SPACING.md,
    },
    lineNumbers: {
      paddingHorizontal: SPACING.sm,
      alignItems: "flex-end",
      minWidth: 36,
    },
    lineNumberText: {
      color: theme.mutedText,
      fontFamily: "monospace",
      fontSize: FONT_SIZE.sm,
      lineHeight: 22,
      textAlign: "right",
    },
    codeEditor: {
      flex: 1,
      color: theme.codeText,
      fontFamily: "monospace",
      fontSize: FONT_SIZE.sm,
      lineHeight: 22,
      paddingRight: SPACING.md,
      minHeight: 180,
      textAlignVertical: "top",
      padding: 0,
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
      borderRadius: BORDER_RADIUS.sm,
      paddingHorizontal: SPACING.sm,
      paddingVertical: SPACING.xs,
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
    keyboardAvoiding: {
      flex: 1,
    },
  });
