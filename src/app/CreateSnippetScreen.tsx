import {
  BORDER_RADIUS,
  FONT_FAMILY,
  FONT_SIZE,
  FONT_WEIGHT,
  ICON_SIZE,
  SPACING,
  Theme,
} from "@/constants/theme";
import { useGlobalStyles } from "@/constants/useGlobalStyles";
import { useTheme } from "@/hooks/useTheme";
import { MaterialCommunityIcons, Ionicons } from "@expo/vector-icons";
import { router } from "expo-router";
import React, { useState } from "react";
import {
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
  Alert,
  ActivityIndicator,
} from "react-native";
import Animated, { FadeInDown } from "react-native-reanimated";
import { createSnippet } from "@/services/db/snippets";

const LANGUAGES = [
  { id: "ts", label: "TypeScript", icon: "language-typescript" },
  { id: "js", label: "JavaScript", icon: "language-javascript" },
  { id: "py", label: "Python", icon: "language-python" },
  { id: "java", label: "Java", icon: "language-java" },
  { id: "go", label: "Go", icon: "language-go" },
];

// const TEMPLATES: Record<string, string> = {
//   TypeScript: `export interface User {\n  id: string;\n  name: string;\n  email: string;\n}\n\nexport const getUser = async (id: string): Promise<User> => {\n  const res = await fetch(\`/api/users/\${id}\`);\n  return res.json();\n};`,
//   JavaScript: `const calculateDiscount = (price, discount) => {\n  if (price < 0 || discount < 0) return 0;\n  return price - (price * (discount / 100));\n};\n\nconsole.log(calculateDiscount(100, 15)); // 85`,
//   Python: `def memoize(func):\n    cache = {}\n    def wrapper(*args):\n        if args not in cache:\n            cache[args] = func(*args)\n        return cache[args]\n    return wrapper\n\n@memoize\ndef fibonacci(n):\n    if n < 2: return n\n    return fibonacci(n-1) + fibonacci(n-2)`,
//   Java: `import java.util.List;\nimport java.util.stream.Collectors;\n\npublic class StreamExample {\n    public List<String> filterNames(List<String> names) {\n        return names.stream()\n            .filter(name -> name.startsWith("A"))\n            .collect(Collectors.toList());\n    }\n}`,
//   Go: `package main\n\nimport (\n\t"fmt"\n\t"net/http"\n)\n\nfunc handler(w http.ResponseWriter, r *http.Request) {\n\tfmt.Fprintf(w, "Hello, %s!", r.URL.Path[1:])\n}\n\nfunc main() {\n\thttp.HandleFunc("/", handler)\n\thttp.ListenAndServe(":8080", nil)\n}`
// };

const CreateSnippetScreen = () => {
  const theme = useTheme();
  const globalStyles = useGlobalStyles(theme);
  const styles = makeStyles(theme);

  // Form state
  const [title, setTitle] = useState("");
  const [selectedLang, setSelectedLang] = useState("TypeScript");
  const [showLangDropdown, setShowLangDropdown] = useState(false);
  const [tags, setTags] = useState<string[]>([]);
  const [tagInput, setTagInput] = useState("");
  const [code, setCode] = useState("");

  // Attachments state (using string file paths as simulated placeholders)
  const [screenshotPath, setScreenshotPath] = useState<string | null>(null);
  const [filePath, setFilePath] = useState<string | null>(null);

  // Action feedback states
  const [isScanningOcr, setIsScanningOcr] = useState(false);

  // Character and line count calculations
  const characterCount = title.length;
  const lines = code.split("\n");
  const lineNumbers = Array.from({ length: Math.max(lines.length, 1) }, (_, i) => i + 1);

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
  const handlePaste = () => {
    Alert.alert(
      "Paste pressed!"
    );
  };

  // Attachment Actions
  const handleAttachScreenshot = () => {
    Alert.alert(
      "Screenshot"
    )
  };

  const handleImportFile = () => {
    Alert.alert(
      "Import File"
    );
  };

  // Simulated OCR Scanner
  const handleOcrScan = () => {
    setIsScanningOcr(true);
    setTimeout(() => {
      setIsScanningOcr(false);
      setCode((prev) => 
        (prev ? prev + "\n\n" : "") + 
        `// Extracted via OCR Scan\nfunction greetUser(name: string) {\n  return \`Hello, \${name}!\`;\n}`
      );
      Alert.alert("OCR Success", "Code has been successfully scanned and extracted into the editor.");
    }, 1500);
  };



  // SQLite Save Handler
  const handleSaveSnippet = () => {
    if (!title.trim()) {
      Alert.alert("Required Input", "Please enter a title for this snippet.");
      return;
    }
    if (!code.trim()) {
      Alert.alert("Required Input", "Please write or paste code before saving.");
      return;
    }

    try {
      const tagsString = tags.length > 0 ? tags.join(",") : null;
      createSnippet({
        title: title.trim(),
        code: code.trim(),
        language: selectedLang,
        tags: tagsString || undefined,
        file_path: filePath || undefined,
        screenshot_path: screenshotPath || undefined,
      });

      Alert.alert("Snippet Saved", "Your snippet has been written to the database successfully!", [
        {
          text: "OK",
          onPress: () => {
            router.back();
          },
        },
      ]);
    } catch (error) {
      console.error("Save error:", error);
      Alert.alert("Database Error", "Unable to save snippet. Please check local database storage.");
    }
  };

  return (
    <View style={globalStyles.screenContainer}>
      {/* Header */}
      <View style={styles.header}>
        <Pressable onPress={() => router.back()} style={styles.headerIcon}>
          <Ionicons name="arrow-back" size={ICON_SIZE.lg} color={theme.text} />
        </Pressable>
        <View style={styles.headerTitleContainer}>
          <Text style={styles.headerTitle}>New Snippet</Text>
          <View style={styles.headerSubtitleRow}>
            <Text style={styles.headerSubtitle}>Draft saved locally</Text>
            <MaterialCommunityIcons 
              name="cloud-outline" 
              size={ICON_SIZE.sm} 
              color={theme.activeTab} 
              style={styles.headerCloudIcon} 
            />
          </View>
        </View>
        <View style={styles.headerRight}>
          <Pressable style={styles.headerIcon}>
            <MaterialCommunityIcons name="history" size={ICON_SIZE.lg} color={theme.text} />
          </Pressable>
          <Pressable style={styles.headerIcon}>
            <MaterialCommunityIcons name="dots-vertical" size={ICON_SIZE.lg} color={theme.text} />
          </Pressable>
        </View>
      </View>

      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.scrollContent}>
        
        {/* Title Section */}
        <Animated.View entering={FadeInDown.delay(100).duration(400)}>
          <Text style={styles.sectionLabel}>Title</Text>
          <View style={styles.inputContainer}>
            <TextInput
              style={styles.input}
              value={title}
              onChangeText={setTitle}
              placeholder="Enter title..."
              placeholderTextColor={theme.mutedText}
              maxLength={80}
            />
            <Text style={styles.charCount}>{characterCount}/80</Text>
          </View>
        </Animated.View>

        {/* Language Section */}
        <Animated.View style={styles.languageSection} entering={FadeInDown.delay(150).duration(400)}>
          <Text style={styles.sectionLabel}>Language</Text>
          <Pressable 
            style={styles.dropdownContainer} 
            onPress={() => setShowLangDropdown(!showLangDropdown)}
          >
            <Text style={styles.dropdownText}>{selectedLang}</Text>
            <MaterialCommunityIcons 
              name={showLangDropdown ? "chevron-up" : "chevron-down"} 
              size={ICON_SIZE.md} 
              color={theme.text} 
            />
          </Pressable>
          {showLangDropdown && (
            <View style={styles.dropdownMenu}>
              {LANGUAGES.map((lang) => (
                <Pressable
                  key={lang.id}
                  style={styles.dropdownItem}
                  onPress={() => {
                    setSelectedLang(lang.label);
                    setShowLangDropdown(false);
                  }}
                >
                  <MaterialCommunityIcons 
                    name={lang.icon as any} 
                    size={ICON_SIZE.md} 
                    color={selectedLang === lang.label ? theme.activeTab : theme.text} 
                  />
                  <Text style={[
                    styles.dropdownItemText,
                    selectedLang === lang.label && styles.dropdownItemTextActive
                  ]}>
                    {lang.label}
                  </Text>
                </Pressable>
              ))}
            </View>
          )}
        </Animated.View>

        {/* Tags Section */}
        <Animated.View entering={FadeInDown.delay(200).duration(400)}>
          <Text style={styles.sectionLabel}>Tags</Text>
          <View style={styles.tagsContainer}>
            {tags.map((tag, index) => (
              <View key={index} style={styles.tagChip}>
                <Text style={styles.tagText}>{tag}</Text>
                <Pressable onPress={() => handleRemoveTag(index)} style={styles.tagCloseBtn}>
                  <MaterialCommunityIcons name="close" size={14} color={theme.text} />
                </Pressable>
              </View>
            ))}
            <TextInput
              style={styles.tagInput}
              value={tagInput}
              onChangeText={handleTagInputChange}
              onSubmitEditing={handleAddTag}
              placeholder="Add tags..."
              placeholderTextColor={theme.mutedText}
              returnKeyType="done"
            />
          </View>
        </Animated.View>

        {/* Code Section */}
        <Animated.View entering={FadeInDown.delay(250).duration(400)}>
          <Text style={styles.sectionLabel}>Code</Text>
          <View style={styles.codeContainer}>
            <View style={styles.codeHeader}>
              <View style={styles.codeHeaderLeft}>
                <Text style={styles.codeHeaderText}>{selectedLang}</Text>
              </View>
              <Pressable onPress={handlePaste} style={styles.codeHeaderRight}>
                <Text style={styles.pasteText}>Paste</Text>
              </Pressable>
            </View>
            <View style={styles.codeBody}>
              <View style={styles.lineNumbers}>
                {lineNumbers.map(n => (
                  <Text key={n} style={styles.lineNumberText}>{n}</Text>
                ))}
              </View>
              <TextInput
                style={styles.codeEditor}
                multiline
                value={code}
                onChangeText={setCode}
                placeholder="Paste or type code here..."
                placeholderTextColor={theme.mutedText}
                textAlignVertical="top"
                editable={true}
                autoCapitalize="none"
                autoCorrect={false}
              />
            </View>
          </View>
        </Animated.View>

        {/* Attachments Section */}
        <Animated.View entering={FadeInDown.delay(300).duration(400)}>
          <Text style={styles.sectionLabel}>Attachments</Text>
          
          {/* Active Previews of attachments */}
          {(screenshotPath || filePath) && (
            <View style={styles.previewsContainer}>
              {screenshotPath && (
                <View style={styles.previewChip}>
                  <MaterialCommunityIcons name="image" size={ICON_SIZE.sm} color={theme.activeTab} />
                  <Text style={styles.previewText} numberOfLines={1}>
                    {screenshotPath}
                  </Text>
                  <Pressable onPress={() => setScreenshotPath(null)} style={styles.previewDeleteBtn}>
                    <MaterialCommunityIcons name="close-circle" size={16} color={theme.text} />
                  </Pressable>
                </View>
              )}
              {filePath && (
                <View style={styles.previewChip}>
                  <MaterialCommunityIcons name="file-code-outline" size={ICON_SIZE.sm} color="#F5A623" />
                  <Text style={styles.previewText} numberOfLines={1}>
                    {filePath}
                  </Text>
                  <Pressable onPress={() => setFilePath(null)} style={styles.previewDeleteBtn}>
                    <MaterialCommunityIcons name="close-circle" size={16} color={theme.text} />
                  </Pressable>
                </View>
              )}
            </View>
          )}

          {isScanningOcr ? (
            <View style={styles.ocrLoadingContainer}>
              <ActivityIndicator color={theme.activeTab} size="small" />
              <Text style={styles.ocrLoadingText}>Processing image & extracting code...</Text>
            </View>
          ) : (
            <View style={styles.attachmentsRow}>
              <Pressable onPress={handleAttachScreenshot} style={styles.attachmentBtn}>
                <MaterialCommunityIcons name="image-outline" size={ICON_SIZE.md} color={theme.activeTab} />
                <Text style={styles.attachmentText}>Attach Screenshot</Text>
              </Pressable>
              <Pressable onPress={handleImportFile} style={styles.attachmentBtn}>
                <MaterialCommunityIcons name="folder-outline" size={ICON_SIZE.md} color="#F5A623" />
                <Text style={styles.attachmentText}>Import File</Text>
              </Pressable>
              <Pressable onPress={handleOcrScan} style={styles.attachmentBtn}>
                <MaterialCommunityIcons name="line-scan" size={ICON_SIZE.md} color="#7ED321" />
                <Text style={styles.attachmentText}>OCR Scan</Text>
              </Pressable>
            </View>
          )}
        </Animated.View>
      </ScrollView>

      {/* Footer / Save Button */}
      <View style={styles.footer}>
        <Pressable onPress={handleSaveSnippet} style={styles.saveBtn}>
          <MaterialCommunityIcons name="content-save-outline" size={ICON_SIZE.md} color="#FFF" />
          <Text style={styles.saveBtnText}>Save Snippet</Text>
        </Pressable>
      </View>
    </View>
  );
};

export default CreateSnippetScreen;

const makeStyles = (theme: Theme) =>
  StyleSheet.create({
    header: {
      flexDirection: "row",
      alignItems: "center",
      paddingTop: SPACING.md,
      paddingBottom: SPACING.sm,
    },
    headerIcon: {
      padding: SPACING.sm,
    },
    headerTitleContainer: {
      flex: 1,
      marginLeft: SPACING.sm,
    },
    headerTitle: {
      fontSize: FONT_SIZE.lg,
      fontWeight: FONT_WEIGHT.bold,
      fontFamily: FONT_FAMILY.bold,
      color: theme.text,
    },
    headerSubtitleRow: {
      flexDirection: "row",
      alignItems: "center",
      marginTop: 2,
    },
    headerSubtitle: {
      fontSize: FONT_SIZE.sm,
      color: theme.mutedText,
      fontFamily: FONT_FAMILY.regular,
    },
    headerCloudIcon: {
      marginLeft: SPACING.xs,
    },
    headerRight: {
      flexDirection: "row",
    },
    scrollContent: {
      paddingBottom: 120, // Expanded space for floating footer
    },
    sectionLabel: {
      fontSize: FONT_SIZE.md,
      color: theme.mutedText,
      fontFamily: FONT_FAMILY.medium,
      marginTop: SPACING.lg,
      marginBottom: SPACING.sm,
    },
    inputContainer: {
      backgroundColor: theme.card,
      borderRadius: BORDER_RADIUS.md,
      borderWidth: 1,
      borderColor: theme.inputBorder,
      flexDirection: "row",
      alignItems: "center",
      paddingHorizontal: SPACING.md,
      height: 50,
    },
    input: {
      flex: 1,
      color: theme.text,
      fontFamily: FONT_FAMILY.regular,
      fontSize: FONT_SIZE.md,
    },
    charCount: {
      color: theme.mutedText,
      fontSize: FONT_SIZE.sm,
      fontFamily: FONT_FAMILY.regular,
    },
    languageSection: {
      zIndex: 20,
      position: "relative",
    },
    dropdownContainer: {
      flexDirection: "row",
      justifyContent: "space-between",
      alignItems: "center",
      backgroundColor: theme.card,
      borderWidth: 1,
      borderColor: theme.inputBorder,
      borderRadius: BORDER_RADIUS.md,
      paddingHorizontal: SPACING.md,
      height: 50,
    },
    dropdownText: {
      color: theme.text,
      fontFamily: FONT_FAMILY.medium,
      fontSize: FONT_SIZE.md,
    },
    dropdownMenu: {
      backgroundColor: theme.card,
      borderWidth: 1,
      borderColor: theme.inputBorder,
      borderRadius: BORDER_RADIUS.md,
      marginTop: SPACING.xs,
      paddingVertical: SPACING.xs,
      position: "absolute",
      top: 85,
      left: 0,
      right: 0,
      zIndex: 100,
      shadowColor: "#000",
      shadowOffset: { width: 0, height: 4 },
      shadowOpacity: 0.2,
      shadowRadius: 5,
      elevation: 5,
    },
    dropdownItem: {
      flexDirection: "row",
      alignItems: "center",
      paddingVertical: SPACING.sm,
      paddingHorizontal: SPACING.md,
    },
    dropdownItemText: {
      color: theme.text,
      fontFamily: FONT_FAMILY.regular,
      fontSize: FONT_SIZE.md,
      marginLeft: SPACING.sm,
    },
    dropdownItemTextActive: {
      color: theme.activeTab,
      fontFamily: FONT_FAMILY.medium,
    },
    tagsContainer: {
      flexDirection: "row",
      flexWrap: "wrap",
      alignItems: "center",
      backgroundColor: theme.card,
      borderWidth: 1,
      borderColor: theme.inputBorder,
      borderRadius: BORDER_RADIUS.md,
      paddingHorizontal: SPACING.md,
      paddingVertical: 4,
      minHeight: 50,
    },
    tagChip: {
      flexDirection: "row",
      alignItems: "center",
      backgroundColor: theme.tagBg,
      borderRadius: 12,
      paddingHorizontal: 10,
      paddingVertical: 4,
      marginRight: SPACING.sm,
      marginBottom: SPACING.xs,
      marginTop: SPACING.xs,
    },
    tagText: {
      color: theme.text,
      fontFamily: FONT_FAMILY.regular,
      fontSize: FONT_SIZE.sm,
    },
    tagCloseBtn: {
      marginLeft: 6,
      justifyContent: "center",
      alignItems: "center",
    },
    tagInput: {
      flex: 1,
      minWidth: 100,
      color: theme.text,
      fontFamily: FONT_FAMILY.regular,
      fontSize: FONT_SIZE.md,
      paddingVertical: 0,
    },
    codeContainer: {
      backgroundColor: theme.card,
      borderRadius: BORDER_RADIUS.md,
      borderWidth: 1,
      borderColor: theme.cardBorder,
      overflow: "hidden",
    },
    codeHeader: {
      flexDirection: "row",
      justifyContent: "space-between",
      alignItems: "center",
      paddingHorizontal: SPACING.md,
      paddingVertical: SPACING.sm,
      borderBottomWidth: 1,
      borderBottomColor: theme.cardBorder,
    },
    codeHeaderLeft: {
      flexDirection: "row",
      alignItems: "center",
      justifyContent: "center",
      borderRadius: BORDER_RADIUS.sm,
      paddingVertical: 3,
      paddingHorizontal: 10,
      backgroundColor: theme.activeTabSoft,
    },
    codeHeaderText: {
      color: theme.text,
      fontFamily: FONT_FAMILY.medium,
    },
    codeHeaderRight: {
      alignItems: "center",
      justifyContent: "center",
      borderRadius: BORDER_RADIUS.md,
      paddingVertical: 3,
      paddingHorizontal: 10,
      backgroundColor: theme.tagBg,
      borderWidth: 1,
      borderColor: theme.cardBorder,
    },
    pasteText: {
      color: theme.text,
      fontFamily: FONT_FAMILY.semibold,
      fontSize: 12,
    },
    codeBody: {
      flexDirection: "row",
      paddingVertical: SPACING.sm,
    },
    lineNumbers: {
      paddingHorizontal: SPACING.sm,
      alignItems: "flex-end",
      minWidth: 32,
    },
    lineNumberText: {
      color: theme.mutedText,
      fontFamily: FONT_FAMILY.regular,
      fontSize: 13,
      lineHeight: 20,
    },
    codeEditor: {
      flex: 1,
      color: theme.text,
      fontFamily: FONT_FAMILY.regular,
      fontSize: 13,
      lineHeight: 20,
      paddingRight: SPACING.sm,
      minHeight: 180,
    },
    previewsContainer: {
      flexDirection: "row",
      flexWrap: "wrap",
      marginBottom: SPACING.sm,
    },
    previewChip: {
      flexDirection: "row",
      alignItems: "center",
      backgroundColor: theme.tagBg,
      borderRadius: BORDER_RADIUS.sm,
      paddingHorizontal: SPACING.sm,
      paddingVertical: 6,
      marginRight: SPACING.sm,
      marginBottom: SPACING.sm,
      borderWidth: 1,
      borderColor: theme.cardBorder,
    },
    previewText: {
      color: theme.text,
      fontFamily: FONT_FAMILY.medium,
      fontSize: 12,
      marginLeft: 6,
      marginRight: 8,
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
    attachmentsRow: {
      flexDirection: "row",
      justifyContent: "space-between",
    },
    attachmentBtn: {
      flex: 1,
      backgroundColor: theme.card,
      borderRadius: BORDER_RADIUS.md,
      borderWidth: 1,
      borderColor: theme.cardBorder,
      paddingVertical: SPACING.md,
      alignItems: "center",
      marginHorizontal: 4,
    },
    attachmentText: {
      color: theme.text,
      fontFamily: FONT_FAMILY.medium,
      fontSize: 11,
      marginTop: SPACING.xs,
    },

    footer: {
      position: "absolute",
      bottom: 0,
      left: 0,
      right: 0,
      padding: SPACING.md,
      backgroundColor: theme.background,
      borderTopWidth: 1,
      borderTopColor: theme.cardBorder,
    },
    saveBtn: {
      backgroundColor: theme.activeTab,
      flexDirection: "row",
      alignItems: "center",
      justifyContent: "center",
      paddingVertical: SPACING.md,
      borderRadius: BORDER_RADIUS.md,
    },
    saveBtnText: {
      color: "#FFF",
      fontFamily: FONT_FAMILY.semibold,
      fontSize: FONT_SIZE.md,
      marginLeft: SPACING.sm,
    },
  });