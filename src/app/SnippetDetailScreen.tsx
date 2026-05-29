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
import { getSnippetById, toggleFavorite, deleteSnippet } from "@/services/db/snippets";
import { Snippet } from "@/types";
import { MaterialCommunityIcons } from "@expo/vector-icons";
import { router, useLocalSearchParams } from "expo-router";
import React, { useEffect, useState } from "react";
import {
  Alert,
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

  // Fetch the snippet based on the ID parameter
  useEffect(() => {
    if (id) {
      try {
        const data = getSnippetById(Number(id));
        setSnippet(data);
      } catch (error) {
        console.error("Failed to load snippet:", error);
      }
    }
  }, [id]);

  const handleBack = () => {
    router.back();
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
    Alert.alert("Delete Snippet", "Are you sure you want to delete this snippet?", [
      { text: "Cancel", style: "cancel" },
      { 
        text: "Delete", 
        style: "destructive", 
        onPress: () => {
          deleteSnippet(snippet.id);
          router.back();
        }
      }
    ]);
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
        <View style={{ width: ICON_SIZE.xl + SPACING.sm * 2 }} />
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
            <MaterialCommunityIcons name="content-copy" size={ICON_SIZE.md} color={theme.mutedText} />
          </View>
          <View style={styles.codeContainer}>
            <ScrollView showsVerticalScrollIndicator={true} nestedScrollEnabled={true}>
              <ScrollView horizontal showsHorizontalScrollIndicator={false}>
                <Text style={styles.codeText}>{snippet.code}</Text>
              </ScrollView>
            </ScrollView>
          </View>

          {/* Bottom Actions */}
          <View style={styles.bottomActionsRow}>
            <Pressable onPress={handleShare} style={styles.iconButtonSmall}>
              <MaterialCommunityIcons name="share-variant" size={ICON_SIZE.lg} color={theme.text} />
            </Pressable>
            <Pressable onPress={handleDelete} style={styles.iconButtonSmall}>
              <MaterialCommunityIcons name="delete-outline" size={ICON_SIZE.lg} color={theme.activeTab} />
            </Pressable>
            <Pressable onPress={handleToggleFavorite} style={styles.iconButtonSmall}>
              <MaterialCommunityIcons
                name={snippet.favorite ? "star" : "star-outline"}
                size={ICON_SIZE.lg}
                color={snippet.favorite ? theme.favorite : theme.text}
              />
            </Pressable>
          </View>
        </View>

      </ScrollView>
    </View>
  );
};

export default SnippetDetailScreen;

const makeStyles = (theme: Theme) =>
  StyleSheet.create({
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
    bottomActionsRow: {
      flexDirection: "row",
      justifyContent: "flex-end",
      alignItems: "center",
      marginTop: SPACING.md,
      gap: SPACING.sm,
    },
    iconButton: {
      padding: SPACING.sm,
      borderRadius: BORDER_RADIUS.full,
      backgroundColor: theme.card,
    },
    iconButtonSmall: {
      padding: 6,
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
  });