import CustomAlert, { CustomAlertButton } from "@/components/CustomAlert";
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
import { explainCode, suggestImprovements } from "@/services/ai/aiServices";
import { getSnippetById, updateSnippetAiDetails, clearSnippetAiDetails } from "@/services/db/snippets";
import { Snippet } from "@/types";
import { MaterialCommunityIcons } from "@expo/vector-icons";
import * as Clipboard from "expo-clipboard";
import { router, useLocalSearchParams } from "expo-router";
import React, { useEffect, useState, useCallback, useMemo, useRef } from "react";
import {
  ActivityIndicator,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from "react-native";
import Animated, {
  FadeIn,
  FadeOut,
} from "react-native-reanimated";

// Import extracted sub-components
import AiLandingState from "@/components/ai/AiLandingState";
import AiExplanationTab from "@/components/ai/AiExplanationTab";
import AiRefactoredCodeTab from "@/components/ai/AiRefactoredCodeTab";

type TabType = "explanation" | "code";

const safeParseJSON = (text: string) => {
  if (!text) return null;
  try {
    let cleanText = text.trim();
    if (cleanText.startsWith("```")) {
      cleanText = cleanText.replace(/^```(?:json)?\n?/, "").replace(/\n?```$/, "");
    }
    return JSON.parse(cleanText.trim());
  } catch (e) {
    return null;
  }
};

const extractCodeBlock = (markdown: string): string | null => {
  const regex = /```(?:[a-zA-Z]*)\n([\s\S]*?)\n```/;
  const match = markdown.match(regex);
  return match ? match[1].trim() : null;
};

const AiScreen = () => {
  const { id, autoGenerate } = useLocalSearchParams<{ id: string; autoGenerate?: string }>();
  const theme = useTheme();
  const globalStyles = useGlobalStyles(theme);
  const styles = useThemedStyles(makeStyles, theme);

  const [snippet, setSnippet] = useState<Snippet | null>(null);
  const [activeTab, setActiveTab] = useState<TabType>("explanation");
  const [loading, setLoading] = useState(false);
  const [loadingStep, setLoadingStep] = useState("");
  
  // Toast & Alert States
  const [toastVisible, setToastVisible] = useState(false);
  const [toastMessage, setToastMessage] = useState("");
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

  const loadSnippet = useCallback(() => {
    if (id) {
      try {
        const data = getSnippetById(Number(id));
        setSnippet(data);
      } catch (error) {
        // Ignore
      }
    }
  }, [id]);

  useEffect(() => {
    loadSnippet();
  }, [loadSnippet]);

  const showAlert = useCallback((
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
  }, []);

  const hideAlert = useCallback(() => {
    setAlertConfig((prev) => ({ ...prev, visible: false }));
  }, []);

  const handleBack = useCallback(() => {
    router.back();
  }, []);

  const handleClearAi = useCallback(() => {
    if (!snippet) return;
    showAlert(
      "Clear AI Insights",
      "This will delete the AI explanation, optimizations, and refactored code for this snippet.",
      [
        { text: "Cancel", style: "cancel" },
        {
          text: "Delete",
          style: "destructive",
          onPress: () => {
            try {
              clearSnippetAiDetails(snippet.id);
              loadSnippet();
              setToastMessage("AI insights cleared.");
              setToastVisible(true);
            } catch (error) {
              // Ignore
            }
          },
        },
      ]
    );
  }, [snippet, loadSnippet, showAlert]);

  const handleGenerate = useCallback(async () => {
    if (!snippet) return;

    setLoading(true);
    setLoadingStep("Connecting to AI Provider...");

    try {
      // 1. Generate explanation
      setLoadingStep("Analyzing code & generating explanation...");
      const explanation = await explainCode(snippet.code, snippet.language, { responseType: "json" });

      // 2. Generate improvements
      setLoadingStep("Analyzing improvements & optimizations...");
      const improvements = await suggestImprovements(snippet.code, snippet.language, { responseType: "json" });

      // 3. Extract improved code block
      setLoadingStep("Finalizing recommendations...");
      let refactoredCode = snippet.code;
      const parsedImp = safeParseJSON(improvements);
      if (parsedImp && parsedImp.refactored_code) {
        refactoredCode = parsedImp.refactored_code;
      } else {
        refactoredCode = extractCodeBlock(improvements) || snippet.code;
      }

      // 4. Save to SQLite database
      updateSnippetAiDetails(
        snippet.id,
        explanation,
        improvements,
        refactoredCode
      );

      // 5. Reload snippet and update state
      loadSnippet();
      setActiveTab("explanation");
      setToastMessage("AI analysis saved successfully!");
      setToastVisible(true);
    } catch (error: any) {
      const errMsg = error.message || "An unexpected error occurred during AI analysis.";
      showAlert(
        "AI Generation Failed",
        errMsg,
        [
          { text: "Cancel", style: "cancel" },
          {
            text: "Configure AI",
            onPress: () => {
              // Navigate to profile tab to configure key
              router.navigate("/(tabs)/profile");
            },
          },
        ]
      );
    } finally {
      setLoading(false);
      setLoadingStep("");
    }
  }, [snippet, loadSnippet, showAlert]);

  const hasTriggeredAuto = useRef(false);

  useEffect(() => {
    if (
      autoGenerate === "true" &&
      snippet &&
      !(snippet.ai_explanation && snippet.ai_explanation.trim().length > 0) &&
      !loading &&
      !hasTriggeredAuto.current
    ) {
      hasTriggeredAuto.current = true;
      handleGenerate();
    }
  }, [autoGenerate, snippet, loading, handleGenerate]);

  const handleCopyOriginalCode = useCallback(async () => {
    if (snippet?.code) {
      try {
        await Clipboard.setStringAsync(snippet.code);
        setToastMessage("Original code copied to clipboard!");
        setToastVisible(true);
      } catch (error) {
        // Ignore
      }
    }
  }, [snippet?.code]);

  const handleCopyCode = useCallback(async () => {
    if (snippet?.ai_improved_code) {
      try {
        await Clipboard.setStringAsync(snippet.ai_improved_code);
        setToastMessage("Improved code copied to clipboard!");
        setToastVisible(true);
      } catch (error) {
        // Ignore
      }
    }
  }, [snippet?.ai_improved_code]);

  const handleApplyImprovement = useCallback(() => {
    if (snippet && snippet.ai_improved_code) {
      router.push(
        `/CreateSnippetScreen?editId=${snippet.id}&improvedCode=${encodeURIComponent(
          snippet.ai_improved_code
        )}`
      );
    }
  }, [snippet]);

  const explanationData = useMemo(() => {
    return safeParseJSON(snippet?.ai_explanation || "");
  }, [snippet?.ai_explanation]);

  const improvementsData = useMemo(() => {
    return safeParseJSON(snippet?.ai_improvement || "");
  }, [snippet?.ai_improvement]);

  if (!snippet) {
    return (
      <View style={[globalStyles.screenContainer, styles.center]}>
        <ActivityIndicator size="large" color={theme.activeTab} />
        <Text style={styles.loadingText}>Loading snippet details...</Text>
      </View>
    );
  }

  const hasAiInsights = !!(
    snippet.ai_explanation &&
    snippet.ai_explanation.trim().length > 0
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
          Snipr AI Assistant
        </Text>
        {hasAiInsights && !loading ? (
          <View style={styles.headerActions}>
            <Pressable onPress={handleGenerate} style={styles.iconButton}>
              <MaterialCommunityIcons
                name="refresh"
                size={ICON_SIZE.xl}
                color={theme.text}
              />
            </Pressable>
            <Pressable onPress={handleClearAi} style={styles.iconButton}>
              <MaterialCommunityIcons
                name="delete-outline"
                size={ICON_SIZE.xl}
                color={theme.activeTab}
              />
            </Pressable>
          </View>
        ) : (
          <View style={styles.headerPlaceholder} />
        )}
      </View>

      {loading ? (
        <Animated.View
          entering={FadeIn}
          exiting={FadeOut}
          style={styles.loadingContainer}
        >
          <View style={styles.loadingCard}>
            <ActivityIndicator size="large" color={theme.activeTab} />
            <Text style={styles.loadingStepText}>{loadingStep}</Text>
            <Text style={styles.loadingSubtext}>
              This may take a few seconds as the code is parsed offline.
            </Text>
          </View>
        </Animated.View>
      ) : !hasAiInsights ? (
        <AiLandingState onGenerate={handleGenerate} />
      ) : (
        <Animated.View entering={FadeIn} style={styles.insightsContainer}>
          {/* Tabs */}
          <View style={styles.tabsRow}>
            {(["explanation", "code"] as TabType[]).map((tab) => {
              const isActive = activeTab === tab;
              const labels = {
                explanation: "Explanation",
                code: "Refactored Code",
              };
              return (
                <Pressable
                  key={tab}
                  onPress={() => setActiveTab(tab)}
                  style={[styles.tabButton, isActive && styles.tabButtonActive]}
                >
                  <Text style={[styles.tabText, isActive && styles.tabTextActive]}>
                    {labels[tab]}
                  </Text>
                </Pressable>
              );
            })}
          </View>

          {/* Tab Content - Conditionally mount child views to release memory */}
          <ScrollView
            showsVerticalScrollIndicator={false}
            contentContainerStyle={styles.scrollContent}
          >
            <View style={[activeTab !== "explanation" && styles.tabHidden]}>
              <AiExplanationTab
                explanationData={explanationData}
                aiExplanation={snippet.ai_explanation || ""}
              />
            </View>

            <View style={[activeTab !== "code" && styles.tabHidden]}>
              <AiRefactoredCodeTab
                code={snippet.code}
                language={snippet.language}
                aiImprovedCode={snippet.ai_improved_code || null}
                improvementsData={improvementsData}
                aiImprovement={snippet.ai_improvement || null}
                onCopyOriginalCode={handleCopyOriginalCode}
                onCopyImprovedCode={handleCopyCode}
                onApplyImprovement={handleApplyImprovement}
              />
            </View>
          </ScrollView>
        </Animated.View>
      )}

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
    </View>
  );
};

export default AiScreen;

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
    headerActions: {
      flexDirection: "row",
      alignItems: "center",
      gap: SPACING.sm,
    },
    headerPlaceholder: {
      width: 42,
      height: 42,
    },
    headerTitle: {
      flex: 1,
      textAlign: "center",
      fontSize: FONT_SIZE.lg,
      fontFamily: FONT_FAMILY.bold,
      color: theme.text,
      marginHorizontal: SPACING.md,
    },
    center: {
      flex: 1,
      justifyContent: "center",
      alignItems: "center",
    },
    loadingText: {
      color: theme.mutedText,
      fontFamily: FONT_FAMILY.medium,
      fontSize: FONT_SIZE.md,
      marginTop: SPACING.md,
    },
    loadingContainer: {
      flex: 1,
      justifyContent: "center",
      alignItems: "center",
      paddingHorizontal: SPACING.lg,
    },
    loadingCard: {
      backgroundColor: theme.card,
      borderColor: theme.cardBorder,
      borderWidth: 1,
      borderRadius: BORDER_RADIUS.lg,
      padding: SPACING.xl,
      alignItems: "center",
      width: "100%",
      ...SHADOW.md,
    },
    loadingStepText: {
      fontSize: FONT_SIZE.md,
      fontFamily: FONT_FAMILY.bold,
      color: theme.text,
      marginTop: SPACING.lg,
      textAlign: "center",
    },
    loadingSubtext: {
      fontSize: FONT_SIZE.sm,
      fontFamily: FONT_FAMILY.regular,
      color: theme.mutedText,
      marginTop: SPACING.sm,
      textAlign: "center",
      lineHeight: 20,
    },
    insightsContainer: {
      flex: 1,
    },
    tabsRow: {
      flexDirection: "row",
      backgroundColor: theme.tagBg,
      borderRadius: BORDER_RADIUS.md,
      padding: SPACING.xs,
      marginVertical: SPACING.md,
    },
    tabButton: {
      flex: 1,
      paddingVertical: SPACING.sm,
      alignItems: "center",
      borderRadius: BORDER_RADIUS.sm,
    },
    tabButtonActive: {
      backgroundColor: theme.card,
      ...SHADOW.sm,
    },
    tabText: {
      fontSize: FONT_SIZE.sm + 1,
      fontFamily: FONT_FAMILY.semibold,
      color: theme.mutedText,
    },
    tabTextActive: {
      color: theme.text,
    },
    scrollContent: {
      paddingBottom: SPACING.xxl,
    },
    tabHidden: {
      display: "none",
    },
  });
