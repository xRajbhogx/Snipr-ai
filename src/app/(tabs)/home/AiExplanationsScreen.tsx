import SnippetCard from "@/components/SnippetCard";
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
import { useHideTabBar } from "@/hooks/useHideTabBar";
import { useTheme } from "@/hooks/useTheme";
import { getExplainedSnippets } from "@/services/db/snippets";
import { Snippet } from "@/types";
import { MaterialCommunityIcons } from "@expo/vector-icons";
import { router, useFocusEffect } from "expo-router";
import { useThemedStyles } from "@/hooks/useThemedStyles";
import React, { useCallback, useMemo, useState } from "react";
import {
  FlatList,
  ListRenderItemInfo,
  Pressable,
  StyleSheet,
  Text,
  TextInput,
  View,
} from "react-native";

const AiExplanationsScreen = () => {
  const theme = useTheme();
  useHideTabBar();
  const globalStyles = useGlobalStyles(theme);
  const styles = useThemedStyles(makeStyles, theme);
  const [snippets, setSnippets] = useState<Snippet[]>([]);
  const [searchQuery, setSearchQuery] = useState("");

  const loadSnippets = useCallback(() => {
    try {
      const data = getExplainedSnippets();
      setSnippets(data);
    } catch (error) {
      // Ignore
    }
  }, []);

  useFocusEffect(
    useCallback(() => {
      loadSnippets();
    }, [loadSnippets])
  );

  const handleBack = () => {
    router.back();
  };

  const filteredSnippets = useMemo(() => {
    return snippets.filter((snippet) => {
      const matchesSearch =
        !searchQuery ||
        snippet.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
        (snippet.description &&
          snippet.description.toLowerCase().includes(searchQuery.toLowerCase())) ||
        (snippet.code && snippet.code.toLowerCase().includes(searchQuery.toLowerCase())) ||
        (snippet.tags && snippet.tags.toLowerCase().includes(searchQuery.toLowerCase()));

      return matchesSearch;
    });
  }, [snippets, searchQuery]);

  const listEmptyComponent = useMemo(
    () => (
      <View style={styles.emptyContainer}>
        <MaterialCommunityIcons
          name="brain"
          size={ICON_SIZE.xl * 2}
          color={theme.inactiveTab}
        />
        <Text style={styles.emptyTitle}>No AI Insights Yet</Text>
        <Text style={styles.emptySubtext}>
          Open a code snippet and click the AI assistant button to generate structured explanations and improvements.
        </Text>
        <Pressable
          onPress={() => router.push("/home/AllSnippetsScreen")}
          style={({ pressed }) => [
            styles.primaryButton,
            pressed && styles.buttonPressed,
          ]}
        >
          <MaterialCommunityIcons
            name="code-tags"
            size={18}
            color={theme.white}
            style={styles.buttonIcon}
          />
          <Text style={styles.primaryButtonText}>Browse Snippets</Text>
        </Pressable>
      </View>
    ),
    [styles, theme.inactiveTab, theme.white]
  );

  const handleSnippetPress = useCallback((item: Snippet) => {
    router.push(`/AiScreen?id=${item.id}`);
  }, []);

  const renderSnippetItem = useCallback(
    ({ item }: ListRenderItemInfo<Snippet>) => (
      <SnippetCard snippet={item} onPress={handleSnippetPress} />
    ),
    [handleSnippetPress]
  );

  const keyExtractor = useCallback((item: Snippet) => String(item.id), []);

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
          AI Explanations
        </Text>
        <View style={styles.headerPlaceholder} />
      </View>

      {/* Search Input */}
      <View style={styles.searchContainer}>
        <MaterialCommunityIcons
          name="magnify"
          size={ICON_SIZE.md + 4}
          color={theme.mutedText}
          style={styles.searchIcon}
        />
        <TextInput
          style={styles.searchInput}
          placeholder="Search explained snippets..."
          placeholderTextColor={theme.mutedText}
          value={searchQuery}
          onChangeText={setSearchQuery}
          autoCapitalize="none"
          autoCorrect={false}
        />
        {searchQuery.length > 0 && (
          <Pressable onPress={() => setSearchQuery("")} style={styles.clearButton}>
            <MaterialCommunityIcons
              name="close-circle"
              size={ICON_SIZE.md}
              color={theme.mutedText}
            />
          </Pressable>
        )}
      </View>

      <FlatList
        data={filteredSnippets}
        keyExtractor={keyExtractor}
        renderItem={renderSnippetItem}
        contentContainerStyle={styles.listContent}
        showsVerticalScrollIndicator={false}
        ListEmptyComponent={listEmptyComponent}
        removeClippedSubviews
        initialNumToRender={8}
        maxToRenderPerBatch={8}
        windowSize={7}
      />
    </View>
  );
};

export default AiExplanationsScreen;

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
    headerPlaceholder: {
      width: 40,
      height: 40,
    },
    headerTitle: {
      flex: 1,
      textAlign: "center",
      fontSize: FONT_SIZE.lg,
      fontFamily: FONT_FAMILY.bold,
      color: theme.text,
      marginHorizontal: SPACING.md,
    },
    searchContainer: {
      flexDirection: "row",
      alignItems: "center",
      backgroundColor: theme.card,
      borderColor: theme.cardBorder,
      borderWidth: 1,
      borderRadius: BORDER_RADIUS.md,
      paddingHorizontal: SPACING.md,
      marginVertical: SPACING.md,
      height: 48,
      ...SHADOW.sm,
    },
    searchIcon: {
      marginRight: SPACING.xs,
    },
    searchInput: {
      flex: 1,
      color: theme.text,
      fontFamily: FONT_FAMILY.medium,
      fontSize: FONT_SIZE.md - 1,
      height: "100%",
      padding: 0,
    },
    clearButton: {
      padding: SPACING.xs,
    },
    listContent: {
      paddingTop: SPACING.xs,
      paddingBottom: SPACING.xxxl,
    },
    emptyContainer: {
      flex: 1,
      justifyContent: "center",
      alignItems: "center",
      marginTop: SPACING.xxxl * 1.5,
      paddingHorizontal: SPACING.lg,
    },
    emptyTitle: {
      fontSize: FONT_SIZE.lg,
      fontFamily: FONT_FAMILY.bold,
      color: theme.text,
      marginTop: SPACING.md,
    },
    emptySubtext: {
      fontSize: FONT_SIZE.md - 1,
      fontFamily: FONT_FAMILY.regular,
      color: theme.mutedText,
      marginTop: SPACING.sm,
      textAlign: "center",
      lineHeight: 22,
    },
    primaryButton: {
      flexDirection: "row",
      alignItems: "center",
      justifyContent: "center",
      backgroundColor: theme.activeTab,
      paddingVertical: SPACING.md,
      paddingHorizontal: SPACING.lg,
      borderRadius: BORDER_RADIUS.md,
      marginTop: SPACING.xl,
      ...SHADOW.sm,
    },
    primaryButtonText: {
      fontSize: FONT_SIZE.md - 1,
      fontFamily: FONT_FAMILY.semibold,
      color: theme.white,
    },
    buttonPressed: {
      opacity: 0.85,
    },
    buttonIcon: {
      marginRight: SPACING.xs,
    },
  });
