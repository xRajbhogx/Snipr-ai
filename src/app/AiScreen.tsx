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
import { renderHighlightedCode } from "@/utils/highlighter";
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

type TabType = "explanation" | "improvements" | "code";

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

  const extractCodeBlock = (markdown: string): string | null => {
    const regex = /```(?:[a-zA-Z]*)\n([\s\S]*?)\n```/;
    const match = markdown.match(regex);
    return match ? match[1].trim() : null;
  };

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

  // Helper to parse simple markdown bold and backticks
  const renderParsedMarkdown = useCallback((text: string) => {
    if (!text) return null;

    const lines = text.split("\n");
    return lines.map((line, lineIndex) => {
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
    });
  }, [styles]);

  const renderFormattedText = useCallback((text: string, style?: any) => {
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
  }, [styles]);

  const explanationData = useMemo(() => {
    return safeParseJSON(snippet?.ai_explanation || "");
  }, [snippet?.ai_explanation]);

  const improvementsData = useMemo(() => {
    return safeParseJSON(snippet?.ai_improvement || "");
  }, [snippet?.ai_improvement]);

  const parsedExplanation = useMemo(() => {
    return renderParsedMarkdown(snippet?.ai_explanation || "");
  }, [snippet?.ai_explanation, renderParsedMarkdown]);

  const parsedImprovements = useMemo(() => {
    return renderParsedMarkdown(snippet?.ai_improvement || "");
  }, [snippet?.ai_improvement, renderParsedMarkdown]);

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
        <Animated.View entering={FadeIn} style={styles.landingContainer}>
          <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.landingScroll}>
            <View style={styles.landingCard}>
              <View style={styles.aiLogoBox}>
                <MaterialCommunityIcons
                  name="brain"
                  size={ICON_SIZE.xl * 2.2}
                  color={theme.activeTab}
                />
              </View>
              <Text style={styles.landingTitle}>Unlock Code Insights</Text>
              <Text style={styles.landingSubtitle}>
                Generate a structured code explanation, optimization tips, complexity details, and modern refactored recommendations.
              </Text>

              <View style={styles.featureList}>
                <View style={styles.featureItem}>
                  <MaterialCommunityIcons
                    name="text-box-search-outline"
                    size={22}
                    color={theme.activeTab}
                  />
                  <View style={styles.featureTexts}>
                    <Text style={styles.featureTitle}>Deep Code Explanation</Text>
                    <Text style={styles.featureDesc}>
                      Step-by-step logical breakdown of the code and algorithm flow.
                    </Text>
                  </View>
                </View>

                <View style={styles.featureItem}>
                  <MaterialCommunityIcons
                    name="lightbulb-on-outline"
                    size={22}
                    color={theme.scanGreen}
                  />
                  <View style={styles.featureTexts}>
                    <Text style={styles.featureTitle}>Boilerplate & Optimizations</Text>
                    <Text style={styles.featureDesc}>
                      Detailed recommendations for speed, security, and edge-cases.
                    </Text>
                  </View>
                </View>

                <View style={styles.featureItem}>
                  <MaterialCommunityIcons
                    name="lightning-bolt-outline"
                    size={22}
                    color={theme.fileIcon}
                  />
                  <View style={styles.featureTexts}>
                    <Text style={styles.featureTitle}>Apply Code Refactoring</Text>
                    <Text style={styles.featureDesc}>
                      Get clean code alternatives and autofill them directly back.
                    </Text>
                  </View>
                </View>
              </View>

              <Pressable
                onPress={handleGenerate}
                style={({ pressed }) => [
                  styles.generateButton,
                  pressed && styles.generateButtonPressed,
                ]}
              >
                <MaterialCommunityIcons name="creation" size={ICON_SIZE.md} color={theme.white} />
                <Text style={styles.generateButtonText}>Generate Insights</Text>
              </Pressable>
            </View>
          </ScrollView>
        </Animated.View>
      ) : (
        <Animated.View entering={FadeIn} style={styles.insightsContainer}>
          {/* Tabs */}
          <View style={styles.tabsRow}>
            {(["explanation", "improvements", "code"] as TabType[]).map((tab) => {
              const isActive = activeTab === tab;
              const labels = {
                explanation: "Explanation",
                improvements: "Optimizations",
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

          {/* Tab Content */}
          <ScrollView
            showsVerticalScrollIndicator={false}
            contentContainerStyle={styles.scrollContent}
          >
            <View style={{ display: activeTab === "explanation" ? "flex" : "none" }}>
              {explanationData ? (
                <View style={styles.markdownBody}>
                  {/* Overview */}
                  {explanationData.overview && (
                    <View style={styles.sectionCard}>
                      <Text style={styles.sectionSubtitle}>Overview</Text>
                      {renderFormattedText(explanationData.overview, styles.normalText)}
                    </View>
                  )}

                  {/* Steps */}
                  {explanationData.steps && explanationData.steps.length > 0 && (
                    <View style={styles.sectionCard}>
                      <Text style={styles.sectionSubtitle}>Logical Steps</Text>
                      {explanationData.steps.map((step: string, index: number) => (
                        <View key={index} style={styles.bulletContainer}>
                          <View style={styles.stepBadge}>
                            <Text style={styles.stepBadgeText}>{index + 1}</Text>
                          </View>
                          {renderFormattedText(step, styles.bulletText)}
                        </View>
                      ))}
                    </View>
                  )}

                  {/* Key Concepts */}
                  {explanationData.key_concepts && explanationData.key_concepts.length > 0 && (
                    <View style={styles.sectionCard}>
                      <Text style={styles.sectionSubtitle}>Key Concepts</Text>
                      {explanationData.key_concepts.map((concept: any, index: number) => (
                        <View key={index} style={styles.conceptItem}>
                          <Text style={styles.conceptName}>{concept.concept}</Text>
                          {renderFormattedText(concept.description, styles.conceptDesc)}
                        </View>
                      ))}
                    </View>
                  )}

                  {/* Complexity */}
                  {explanationData.complexity && (
                    <View style={styles.sectionCard}>
                      <Text style={styles.sectionSubtitle}>Complexity Analysis</Text>
                      <View style={styles.complexityRow}>
                        <View style={styles.complexityBadge}>
                          <Text style={styles.complexityLabel}>TIME</Text>
                          <Text style={styles.complexityValue}>{explanationData.complexity.time}</Text>
                        </View>
                        <View style={styles.complexityBadge}>
                          <Text style={styles.complexityLabel}>SPACE</Text>
                          <Text style={styles.complexityValue}>{explanationData.complexity.space}</Text>
                        </View>
                      </View>
                      {explanationData.complexity.details &&
                        renderFormattedText(explanationData.complexity.details, styles.complexityDetails)}
                    </View>
                  )}

                  {/* Tip */}
                  {explanationData.tip && (
                    <View style={styles.quoteContainer}>
                      <View style={styles.quoteContent}>
                        {renderFormattedText(explanationData.tip, styles.quoteText)}
                      </View>
                    </View>
                  )}
                </View>
              ) : (
                <View style={styles.contentCard}>
                  <View style={styles.cardHeader}>
                    <MaterialCommunityIcons name="text-box-search-outline" size={ICON_SIZE.md} color={theme.activeTab} />
                    <Text style={styles.cardTitle}>Logic Breakdown</Text>
                  </View>
                  <View style={styles.markdownBody}>
                    {parsedExplanation}
                  </View>
                </View>
              )}
            </View>

            <View style={{ display: activeTab === "improvements" ? "flex" : "none" }}>
              {improvementsData ? (
                <View style={styles.markdownBody}>
                  {/* Recommendations */}
                  {improvementsData.suggestions && improvementsData.suggestions.length > 0 && (
                    <View style={styles.sectionCard}>
                      <Text style={styles.sectionSubtitle}>Optimizations</Text>
                      {improvementsData.suggestions.map((suggestion: string, index: number) => (
                        <View key={index} style={styles.bulletContainer}>
                          <View style={styles.bulletDot} />
                          {renderFormattedText(suggestion, styles.bulletText)}
                        </View>
                      ))}
                    </View>
                  )}

                  {/* Warning */}
                  {improvementsData.warning && (
                    <View style={styles.quoteContainer}>
                      <View style={styles.quoteContent}>
                        {renderFormattedText(improvementsData.warning, styles.quoteText)}
                      </View>
                    </View>
                  )}
                </View>
              ) : (
                <View style={styles.contentCard}>
                  <View style={styles.cardHeader}>
                    <MaterialCommunityIcons name="lightbulb-on-outline" size={ICON_SIZE.md} color={theme.scanGreen} />
                    <Text style={styles.cardTitle}>Optimization Tips</Text>
                  </View>
                  <View style={styles.markdownBody}>
                    {parsedImprovements}
                  </View>
                </View>
              )}
            </View>

            <View style={{ display: activeTab === "code" ? "flex" : "none" }}>
              {/* Original Code Card */}
              <View style={[styles.contentCard, styles.codeCardOverride]}>
                <View style={styles.codeHeaderRow}>
                  <View style={styles.codeHeaderLeft}>
                    <MaterialCommunityIcons name="code-tags" size={ICON_SIZE.md} color={theme.mutedText} />
                    <Text style={styles.cardTitle}>Original Code</Text>
                  </View>
                  <Pressable
                    onPress={handleCopyOriginalCode}
                    style={({ pressed }) => [
                      styles.copyButton,
                      pressed && styles.copyButtonPressed,
                    ]}
                  >
                    <MaterialCommunityIcons name="content-copy" size={ICON_SIZE.sm} color={theme.activeTab} />
                    <Text style={styles.copyButtonText}>Copy</Text>
                  </Pressable>
                </View>

                <ScrollView style={styles.codeScroller} nestedScrollEnabled={true} horizontal={true}>
                  <ScrollView nestedScrollEnabled={true}>
                    <Text style={styles.codeBlockText}>
                      {renderHighlightedCode(snippet.code, snippet.language, theme)}
                    </Text>
                  </ScrollView>
                </ScrollView>
              </View>

              {/* Refactored Code Card */}
              <View style={[styles.contentCard, styles.codeCardOverride]}>
                <View style={styles.codeHeaderRow}>
                  <View style={styles.codeHeaderLeft}>
                    <MaterialCommunityIcons name="lightning-bolt-outline" size={ICON_SIZE.md} color={theme.fileIcon} />
                    <Text style={styles.cardTitle}>Refactored Code</Text>
                  </View>
                  <Pressable
                    onPress={handleCopyCode}
                    style={({ pressed }) => [
                      styles.copyButton,
                      pressed && styles.copyButtonPressed,
                    ]}
                  >
                    <MaterialCommunityIcons name="content-copy" size={ICON_SIZE.sm} color={theme.activeTab} />
                    <Text style={styles.copyButtonText}>Copy</Text>
                  </Pressable>
                </View>

                <ScrollView style={styles.codeScroller} nestedScrollEnabled={true} horizontal={true}>
                  <ScrollView nestedScrollEnabled={true}>
                    <Text style={styles.codeBlockText}>
                      {snippet.ai_improved_code ? renderHighlightedCode(snippet.ai_improved_code, snippet.language, theme) : null}
                    </Text>
                  </ScrollView>
                </ScrollView>
              </View>

              {/* Apply refactoring block */}
              <Pressable
                onPress={handleApplyImprovement}
                style={({ pressed }) => [
                  styles.applyButton,
                  pressed && styles.applyButtonPressed,
                ]}
              >
                <MaterialCommunityIcons name="check-decagram-outline" size={20} color={theme.white} />
                <Text style={styles.applyButtonText}>Apply Improved Code & Edit</Text>
              </Pressable>
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
    landingContainer: {
      flex: 1,
    },
    landingScroll: {
      paddingVertical: SPACING.lg,
    },
    landingCard: {
      backgroundColor: theme.card,
      borderColor: theme.cardBorder,
      borderWidth: 1,
      borderRadius: BORDER_RADIUS.lg,
      padding: SPACING.xl,
      alignItems: "center",
      ...SHADOW.md,
    },
    aiLogoBox: {
      width: 84,
      height: 84,
      borderRadius: BORDER_RADIUS.full,
      backgroundColor: theme.activeTabSoft,
      justifyContent: "center",
      alignItems: "center",
      marginBottom: SPACING.lg,
      ...SHADOW.sm,
    },
    landingTitle: {
      fontSize: FONT_SIZE.xl,
      fontFamily: FONT_FAMILY.bold,
      color: theme.text,
      marginBottom: SPACING.sm,
    },
    landingSubtitle: {
      fontSize: FONT_SIZE.md - 1,
      fontFamily: FONT_FAMILY.regular,
      color: theme.mutedText,
      textAlign: "center",
      lineHeight: 22,
      marginBottom: SPACING.xl,
    },
    featureList: {
      width: "100%",
      gap: SPACING.lg,
      marginBottom: SPACING.xxl,
    },
    featureItem: {
      flexDirection: "row",
      gap: SPACING.md,
      alignItems: "flex-start",
    },
    featureTexts: {
      flex: 1,
    },
    featureTitle: {
      fontSize: FONT_SIZE.md - 1,
      fontFamily: FONT_FAMILY.semibold,
      color: theme.text,
      marginBottom: 2,
    },
    featureDesc: {
      fontSize: FONT_SIZE.sm,
      fontFamily: FONT_FAMILY.regular,
      color: theme.mutedText,
      lineHeight: 18,
    },
    generateButton: {
      flexDirection: "row",
      alignItems: "center",
      justifyContent: "center",
      backgroundColor: theme.activeTab,
      paddingVertical: SPACING.md,
      width: "100%",
      borderRadius: BORDER_RADIUS.md,
      gap: SPACING.sm,
      ...SHADOW.sm,
    },
    generateButtonText: {
      color: theme.white,
      fontFamily: FONT_FAMILY.semibold,
      fontSize: FONT_SIZE.md - 1,
    },
    generateButtonPressed: {
      opacity: 0.85,
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
    contentCard: {
      backgroundColor: theme.card,
      borderColor: theme.cardBorder,
      borderWidth: 1,
      borderRadius: BORDER_RADIUS.lg,
      padding: SPACING.lg,
      ...SHADOW.sm,
      marginBottom: SPACING.md,
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
    cardTitle: {
      fontSize: FONT_SIZE.md,
      fontFamily: FONT_FAMILY.bold,
      color: theme.text,
    },
    markdownBody: {
      gap: SPACING.sm,
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
    codeCardOverride: {
      paddingHorizontal: SPACING.md,
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
      padding: SPACING.md,
      maxHeight: 400,
      borderWidth: 1,
      borderColor: theme.cardBorder,
    },
    codeBlockText: {
      fontFamily: "monospace",
      fontSize: FONT_SIZE.sm,
      color: theme.codeText,
      lineHeight: 20,
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
    normalText: {
      fontSize: FONT_SIZE.sm + 2,
      fontFamily: FONT_FAMILY.regular,
      color: theme.text,
      lineHeight: 22,
    },
    stepBadge: {
      width: 22,
      height: 22,
      borderRadius: 11,
      backgroundColor: theme.activeTabSoft,
      justifyContent: "center",
      alignItems: "center",
      marginRight: SPACING.sm,
      marginTop: 2,
    },
    stepBadgeText: {
      fontSize: 11,
      fontFamily: FONT_FAMILY.bold,
      color: theme.activeTab,
    },
    conceptItem: {
      marginBottom: SPACING.sm,
      borderBottomWidth: 1,
      borderBottomColor: theme.cardBorder,
      paddingBottom: SPACING.xs,
    },
    conceptName: {
      fontSize: FONT_SIZE.sm + 2,
      fontFamily: FONT_FAMILY.bold,
      color: theme.text,
      marginBottom: 2,
    },
    conceptDesc: {
      fontSize: FONT_SIZE.sm + 1,
      fontFamily: FONT_FAMILY.regular,
      color: theme.mutedText,
      lineHeight: 18,
    },
    complexityRow: {
      flexDirection: "row",
      gap: SPACING.md,
      marginBottom: SPACING.sm,
    },
    complexityBadge: {
      flex: 1,
      backgroundColor: theme.tagBg,
      borderColor: theme.cardBorder,
      borderWidth: 1,
      borderRadius: BORDER_RADIUS.sm,
      paddingVertical: SPACING.sm,
      alignItems: "center",
    },
    complexityLabel: {
      fontSize: 10,
      fontFamily: FONT_FAMILY.semibold,
      color: theme.mutedText,
      marginBottom: 2,
    },
    complexityValue: {
      fontSize: FONT_SIZE.md,
      fontFamily: FONT_FAMILY.bold,
      color: theme.activeTab,
    },
    complexityDetails: {
      fontSize: FONT_SIZE.sm + 1,
      fontFamily: FONT_FAMILY.regular,
      color: theme.mutedText,
      lineHeight: 20,
      marginTop: SPACING.xs,
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
  });
