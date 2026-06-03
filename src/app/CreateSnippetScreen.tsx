import CustomAlert, { CustomAlertButton } from "@/components/CustomAlert";
import LanguagePickerModal from "@/components/shared/LanguagePickerModal";
import TagInputSection from "@/components/snippets/TagInputSection";
import SnippetAttachmentSection from "@/components/snippets/SnippetAttachmentSection";
import Toast from "@/components/Toast";
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
import { useTheme } from "@/hooks/useTheme";
import { useThemedStyles } from "@/hooks/useThemedStyles";
import { useUserPreferences } from "@/hooks/useUserPreferences";
import { performOCR } from "@/services/ai/aiServices";
import {
  createSnippet,
  getSnippetById,
  updateSnippet,
} from "@/services/db/snippets";
import { renameFile, saveSnippetImage } from "@/services/fileService";
import { MaterialCommunityIcons } from "@expo/vector-icons";
import * as Clipboard from "expo-clipboard";
import * as ImagePicker from "expo-image-picker";
import { router, useLocalSearchParams } from "expo-router";
import React, { useEffect, useState, useCallback, useMemo } from "react";
import {
  KeyboardAvoidingView,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from "react-native";
import Animated, { SlideInDown, SlideOutDown } from "react-native-reanimated";

const CreateSnippetScreen = () => {
  const theme = useTheme();
  const globalStyles = useGlobalStyles(theme);
  const styles = useThemedStyles(makeStyles, theme);

  const { editId, improvedCode } = useLocalSearchParams<{
    editId?: string;
    improvedCode?: string;
  }>();
  const isEditing = !!editId;

  const { preferences } = useUserPreferences();

  // Form state
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  // Default to persisted preference; overridden when editing an existing snippet
  const [selectedLang, setSelectedLang] = useState("TypeScript");
  const [showLangDropdown, setShowLangDropdown] = useState(false);
  const [tags, setTags] = useState<string[]>([]);
  const [code, setCode] = useState("");

  // Attachments state
  const [screenshotPath, setScreenshotPath] = useState<string | null>(null);

  // Toast states
  const [toastVisible, setToastVisible] = useState(false);
  const [toastMessage, setToastMessage] = useState("");

  const showToast = useCallback((message: string) => {
    setToastMessage(message);
    setToastVisible(true);
  }, []);

  const hideToast = useCallback(() => {
    setToastVisible(false);
  }, []);

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

  const showAlert = useCallback(
    (title: string, message: string, buttons: CustomAlertButton[] = []) => {
      setAlertConfig({
        visible: true,
        title,
        message,
        buttons,
      });
    },
    []
  );

  const hideAlert = useCallback(() => {
    setAlertConfig((prev) => ({ ...prev, visible: false }));
  }, []);

  // Load snippet data if editing
  useEffect(() => {
    if (editId) {
      try {
        const snippet = getSnippetById(Number(editId));
        if (snippet) {
          setTitle(snippet.title);
          setDescription(snippet.description || "");
          setSelectedLang(snippet.language);
          setCode(
            improvedCode
              ? decodeURIComponent(improvedCode).trim()
              : snippet.code.trim()
          );
          setTags(snippet.tags ? snippet.tags.split(",") : []);
          setScreenshotPath(snippet.screenshot_path || null);
        }
      } catch (error) {
        // Ignore
      }
    } else {
      // Apply the user's saved default language when creating a new snippet
      setSelectedLang(preferences.defaultLanguage);
    }
  }, [editId, preferences.defaultLanguage, improvedCode]);

  // Current Date display matching SnippetDetailScreen
  const currentDate = useMemo(() => {
    return new Date().toLocaleDateString(undefined, {
      month: "long",
      day: "numeric",
      year: "numeric",
    });
  }, []);

  // Tag Handlers
  const handleTagsChange = useCallback((newTags: string[]) => {
    setTags(newTags);
  }, []);

  // Paste
  const handlePaste = useCallback(async () => {
    try {
      const text = await Clipboard.getStringAsync();
      if (text.trim()) {
        setCode((prev) => (prev ? prev + "\n" + text : text));
        showAlert("Success", "Pasted from clipboard.");
      } else {
        showAlert(
          "Clipboard Empty",
          "There is no text in your clipboard to paste."
        );
      }
    } catch (error) {
      showAlert(
        "Paste Failed",
        "Unable to access clipboard. Please check app permissions."
      );
    }
  }, [showAlert]);

  // Clear Code
  const handleClearCode = useCallback(() => {
    setCode("");
    showToast("Editor cleared");
  }, [showToast]);

  // Attachment Actions
  const handleAttachScreenshot = useCallback(async () => {
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
        const storedPath = await saveSnippetImage(
          pickedUri,
          title.trim() || undefined
        );
        setScreenshotPath(storedPath);
        showToast("Screenshot attached!");
      }
    } catch (error) {
      showAlert(
        "Attachment Failed",
        "An error occurred while picking the screenshot."
      );
    } finally {
      setIsScanningOcr(false);
    }
  }, [title, showAlert, showToast]);

  const handleRemoveScreenshot = useCallback(() => {
    setScreenshotPath(null);
    showToast("Screenshot removed");
  }, [showToast]);

  // AI-powered OCR Scanner
  const handleOcrScan = useCallback(async () => {
    let imageToScan = screenshotPath;

    if (!imageToScan) {
      try {
        const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
        if (status !== "granted") {
          showAlert(
            "Permission Required",
            "We need permission to access your photo library to scan a screenshot."
          );
          return;
        }

        const result = await ImagePicker.launchImageLibraryAsync({
          mediaTypes: ["images"],
          quality: 1,
          allowsMultipleSelection: false,
        });

        if (result.canceled || !result.assets || result.assets.length === 0) {
          return;
        }

        const pickedUri = result.assets[0].uri;
        setIsScanningOcr(true);
        const storedPath = await saveSnippetImage(
          pickedUri,
          title.trim() || undefined
        );
        setScreenshotPath(storedPath);
        showToast("Screenshot attached!");
        imageToScan = storedPath;
      } catch (error) {
        showAlert(
          "Scan Failed",
          "An error occurred while picking the screenshot."
        );
        setIsScanningOcr(false);
        return;
      }
    }

    if (!imageToScan) return;

    setIsScanningOcr(true);

    try {
      const extractedCode = await performOCR(imageToScan);
      if (extractedCode && extractedCode.trim()) {
        setCode((prev) =>
          prev ? prev + "\n\n" + extractedCode : extractedCode
        );
        showAlert(
          "OCR Success",
          "Code has been successfully scanned and extracted into the editor."
        );
      } else {
        throw new Error("No code could be extracted from the image.");
      }
    } catch (error: any) {
      const errMsg =
        error.message || "An unexpected error occurred during OCR scanning.";
      showAlert("OCR Scan Failed", errMsg, [
        { text: "Cancel", style: "cancel" },
        {
          text: "Configure AI",
          onPress: () => {
            router.navigate("/(tabs)/profile");
          },
        },
      ]);
    } finally {
      setIsScanningOcr(false);
    }
  }, [screenshotPath, title, showAlert, showToast]);

  // SQLite Save Handler
  const handleSaveSnippet = useCallback(async () => {
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
          // Ignore
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
        ]
      );
    } catch (error) {
      showAlert(
        "Database Error",
        isEditing
          ? "Unable to update snippet. Please check local database storage."
          : "Unable to save snippet. Please check local database storage."
      );
    }
  }, [isEditing, editId, title, code, selectedLang, tags, description, screenshotPath, showAlert]);

  const handleSelectLang = useCallback((langLabel: string) => {
    setSelectedLang(langLabel);
    setShowLangDropdown(false);
  }, []);

  const handleToggleLangDropdown = useCallback(() => {
    setShowLangDropdown((prev) => !prev);
  }, []);

  const handleCloseLangDropdown = useCallback(() => {
    setShowLangDropdown(false);
  }, []);

  return (
    <Animated.View
      style={globalStyles.screenContainer}
      entering={SlideInDown.duration(300)}
      exiting={SlideOutDown.duration(300)}
    >
      <KeyboardAvoidingView
        behavior={Platform.OS === "ios" ? "padding" : "height"}
        style={styles.keyboardAvoiding}
        keyboardVerticalOffset={Platform.OS === "ios" ? 88 : 0}
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
                onPress={handleToggleLangDropdown}
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

            {/* Conditional mounting of language picker sheet */}
            {showLangDropdown && (
              <LanguagePickerModal
                visible={showLangDropdown}
                selectedLang={selectedLang}
                onSelectLang={handleSelectLang}
                onClose={handleCloseLangDropdown}
              />
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

          {/* Extracted Tags Input Section */}
          <TagInputSection tags={tags} onTagsChange={handleTagsChange} />

          {/* Extracted Attachments Section */}
          <SnippetAttachmentSection
            screenshotPath={screenshotPath}
            isScanningOcr={isScanningOcr}
            onAttachScreenshot={handleAttachScreenshot}
            onOcrScan={handleOcrScan}
            onRemoveScreenshot={handleRemoveScreenshot}
          />

          {/* Code Section */}
          <View style={styles.section}>
            <View style={styles.codeHeaderRow}>
              <Text style={styles.sectionHeader}>Code</Text>
              <View style={styles.codeActionsRow}>
                <Pressable onPress={handlePaste} style={styles.pasteButton}>
                  <MaterialCommunityIcons
                    name="clipboard-outline"
                    size={ICON_SIZE.md}
                    color={theme.activeTab}
                  />
                  <Text style={styles.pasteButtonText}>Paste</Text>
                </Pressable>

                {code.trim().length > 0 && (
                  <Pressable
                    onPress={handleClearCode}
                    style={styles.clearButton}
                  >
                    <MaterialCommunityIcons
                      name="trash-can-outline"
                      size={ICON_SIZE.md}
                      color={theme.activeTab}
                    />
                    <Text style={styles.clearButtonText}>Clear</Text>
                  </Pressable>
                )}
              </View>
            </View>
            <View style={styles.codeContainer}>
              <ScrollView
                style={styles.editorScroller}
                nestedScrollEnabled={true}
                showsVerticalScrollIndicator={true}
              >
                <View style={styles.codeBody}>
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
              </ScrollView>
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
        onHide={hideToast}
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
    codeActionsRow: {
      flexDirection: "row",
      gap: SPACING.sm,
      alignItems: "center",
    },
    clearButton: {
      flexDirection: "row",
      alignItems: "center",
      gap: SPACING.xs,
      paddingVertical: SPACING.xs,
      paddingHorizontal: SPACING.sm,
      borderRadius: BORDER_RADIUS.sm,
      backgroundColor: theme.tagBg,
    },
    clearButtonText: {
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
    editorScroller: {
      maxHeight: 300,
    },
    codeBody: {
      flexDirection: "row",
      paddingVertical: SPACING.md,
    },
    codeEditor: {
      flex: 1,
      color: theme.codeText,
      fontFamily: "monospace",
      fontSize: FONT_SIZE.sm,
      lineHeight: 22,
      paddingLeft: SPACING.md,
      paddingRight: SPACING.md,
      minHeight: 180,
      textAlignVertical: "top",
      padding: 0,
      includeFontPadding: false,
    },
    keyboardAvoiding: {
      flex: 1,
    },
  });
