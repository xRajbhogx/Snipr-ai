import CustomAlert from "@/components/CustomAlert";
import HomeSearchBar from "@/components/HomeSearchBar";
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
import { useUserPreferences } from "@/hooks/useUserPreferences";
import { getAllSnippets, deleteAllSnippets, seedDemoSnippets } from "@/services/db/snippets";
import { Snippet } from "@/types";
import { MaterialCommunityIcons } from "@expo/vector-icons";
import { router, useFocusEffect, useLocalSearchParams } from "expo-router";
import { useThemedStyles } from "@/hooks/useThemedStyles";
import React, { useCallback, useMemo, useState } from "react";
import {
  FlatList,
  ListRenderItemInfo,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from "react-native";

const LANGUAGE_ICONS: Record<string, string> = {
  TypeScript: "language-typescript",
  JavaScript: "language-javascript",
  Python: "language-python",
  Java: "language-java",
  Go: "language-go",
  HTML: "language-html5",
  CSS: "language-css3",
};

const loadSnippetsFromDb = (): Snippet[] => {
  try {
    return getAllSnippets();
  } catch (error) {
    console.error("Failed to load snippets", error);
    return [];
  }
};

const AllSnippetsScreen = () => {
  const theme = useTheme();
  useHideTabBar();
  const globalStyles = useGlobalStyles(theme);
  const styles = useThemedStyles(makeStyles, theme);
  const { preferences } = useUserPreferences();
  const [snippets, setSnippets] = useState<Snippet[]>(loadSnippetsFromDb);
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedLanguage, setSelectedLanguage] = useState<string | null>(null);
  const [alertVisible, setAlertVisible] = useState(false);
  const [successAlertVisible, setSuccessAlertVisible] = useState(false);

  const { focusSearch } = useLocalSearchParams<{ focusSearch?: string }>();
  const searchInputRef = React.useRef<TextInput | null>(null);

  const handleSeed = useCallback(() => {
    try {
      seedDemoSnippets();
      const data = getAllSnippets();
      setSnippets(data);
      setSuccessAlertVisible(true);
    } catch (error) {
      console.error("Failed to seed starter snippets in AllSnippetsScreen:", error);
    }
  }, []);

  const handleDeleteAll = useCallback(() => {
    try {
      deleteAllSnippets();
      setSnippets([]);
    } catch (error) {
      console.error("Failed to delete all snippets", error);
    }
  }, []);

  const availableLanguages = React.useMemo(() => {
    const langs = snippets
      .map((s) => s.language)
      .filter((lang): lang is string => typeof lang === "string" && lang.trim().length > 0);
    return ["All", ...Array.from(new Set(langs))];
  }, [snippets]);

  const filteredSnippets = React.useMemo(() => {
    return snippets.filter((snippet) => {
      const matchesLanguage =
        !selectedLanguage || selectedLanguage === "All" || snippet.language === selectedLanguage;
      
      const matchesSearch =
        !searchQuery ||
        snippet.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
        (snippet.description &&
          snippet.description.toLowerCase().includes(searchQuery.toLowerCase())) ||
        (snippet.code && snippet.code.toLowerCase().includes(searchQuery.toLowerCase())) ||
        (snippet.tags && snippet.tags.toLowerCase().includes(searchQuery.toLowerCase()));

      return matchesLanguage && matchesSearch;
    });
  }, [snippets, selectedLanguage, searchQuery]);

  const sortedSnippets = React.useMemo(() => {
    const list = [...filteredSnippets];
    if (preferences.sortOrder === "newest") {
      list.sort((a, b) => b.created_at - a.created_at);
    } else if (preferences.sortOrder === "oldest") {
      list.sort((a, b) => a.created_at - b.created_at);
    } else if (preferences.sortOrder === "alphabetical") {
      list.sort((a, b) => a.title.localeCompare(b.title));
    }
    return list;
  }, [filteredSnippets, preferences.sortOrder]);

  useFocusEffect(
    useCallback(() => {
      setSnippets(loadSnippetsFromDb());
      if (focusSearch === "true") {
        const frame = requestAnimationFrame(() => {
          searchInputRef.current?.focus();
        });
        return () => cancelAnimationFrame(frame);
      }
    }, [focusSearch]),
  );

  const handleBack = () => {
    router.back();
  };

  const hasAnySnippets = snippets.length > 0;

  const listEmptyComponent = useMemo(
    () => (
      <View style={styles.emptyContainer}>
        <MaterialCommunityIcons
          name={hasAnySnippets ? "text-search-variant" : "code-tags"}
          size={ICON_SIZE.xl * 2}
          color={theme.inactiveTab}
        />
        <Text style={styles.emptyTitle}>
          {hasAnySnippets ? "No match found" : "No snippets found"}
        </Text>
        <Text style={styles.emptySubtext}>
          {hasAnySnippets
            ? "Try adjusting your search or language filter."
            : "You haven't created any snippets yet."}
        </Text>
        <View style={styles.actionContainer}>
          <Pressable
            onPress={() => router.push("/CreateSnippetScreen")}
            style={({ pressed }) => [
              styles.primaryButton,
              pressed && styles.buttonPressed,
            ]}
          >
            <MaterialCommunityIcons
              name="plus"
              size={18}
              color={theme.white}
              style={styles.buttonIcon}
            />
            <Text style={styles.primaryButtonText}>Create First Snippet</Text>
          </Pressable>

          <Pressable
            onPress={handleSeed}
            style={({ pressed }) => [
              styles.secondaryButton,
              pressed && styles.buttonPressed,
            ]}
          >
            <MaterialCommunityIcons
              name="database-import-outline"
              size={18}
              color={theme.text}
              style={styles.buttonIcon}
            />
            <Text style={styles.secondaryButtonText}>Import Starter Snippets</Text>
          </Pressable>
        </View>
      </View>
    ),
    [hasAnySnippets, handleSeed, styles, theme.inactiveTab, theme.text, theme.white],
  );

  const renderSnippetItem = useCallback(
    ({ item }: ListRenderItemInfo<Snippet>) => <SnippetCard snippet={item} />,
    [],
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
          All Snippets
        </Text>
        {snippets.length > 0 ? (
          <Pressable
            onPress={() => setAlertVisible(true)}
            style={({ pressed }) => [
              styles.iconButton,
              pressed && styles.iconButtonPressed,
            ]}
          >
            <MaterialCommunityIcons
              name="trash-can-outline"
              size={ICON_SIZE.xl}
              color={theme.activeTab}
            />
          </Pressable>
        ) : (
          <View style={styles.placeholderButton}>
            <MaterialCommunityIcons
              name="trash-can-outline"
              size={ICON_SIZE.xl}
              color={theme.inactiveTab}
            />
          </View>
        )}
      </View>

      <View style={styles.searchWrap}>
        <HomeSearchBar ref={searchInputRef} value={searchQuery} onChangeText={setSearchQuery} />
      </View>

      {/* Language Chips */}
      {availableLanguages.length > 1 && (
        <View style={styles.chipsWrap}>
          <ScrollView
            horizontal
            showsHorizontalScrollIndicator={false}
            contentContainerStyle={styles.chipsContainer}
          >
            {availableLanguages.map((lang) => {
              const isSelected =
                (!selectedLanguage && lang === "All") || selectedLanguage === lang;
              const iconName = LANGUAGE_ICONS[lang] || "code-tags";
              return (
                <Pressable
                  key={lang}
                  onPress={() => setSelectedLanguage(lang === "All" ? null : lang)}
                  style={[styles.chip, isSelected && styles.chipActive]}
                >
                  {lang !== "All" && (
                    <MaterialCommunityIcons
                      name={iconName as any}
                      size={14}
                      color={isSelected ? theme.white : theme.mutedText}
                      style={styles.chipIcon}
                    />
                  )}
                  <Text style={[styles.chipText, isSelected && styles.chipTextActive]}>
                    {lang}
                  </Text>
                </Pressable>
              );
            })}
          </ScrollView>
        </View>
      )}

      <FlatList
        data={sortedSnippets}
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

      <CustomAlert
        visible={alertVisible}
        title="Delete All Snippets"
        message="Are you sure you want to delete all snippets? This action is permanent and cannot be undone."
        onClose={() => setAlertVisible(false)}
        buttons={[
          {
            text: "Cancel",
            style: "cancel",
          },
          {
            text: "Delete All",
            style: "destructive",
            onPress: handleDeleteAll,
          },
        ]}
      />

      <CustomAlert
        visible={successAlertVisible}
        title="Starter Snippets Imported"
        message="Four developer-oriented starter snippets have been successfully added to your local vault."
        onClose={() => setSuccessAlertVisible(false)}
      />
    </View>
  );
};

export default AllSnippetsScreen;

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
    iconButtonPressed: {
      opacity: 0.7,
    },
    placeholderButton: {
      padding: SPACING.sm,
      borderRadius: BORDER_RADIUS.full,
      backgroundColor: theme.card,
      opacity: 0.4,
    },
    headerTitle: {
      flex: 1,
      textAlign: "center",
      fontSize: FONT_SIZE.lg,
      fontFamily: FONT_FAMILY.bold,
      color: theme.text,
      marginHorizontal: SPACING.md,
    },
    searchWrap: {
      marginTop: SPACING.md,
    },
    chipsWrap: {
      marginTop: SPACING.md,
      marginBottom: SPACING.sm,
    },
    chipsContainer: {
      flexDirection: "row",
      paddingVertical: SPACING.xs,
    },
    chip: {
      flexDirection: "row",
      alignItems: "center",
      backgroundColor: theme.card,
      borderColor: theme.cardBorder,
      borderWidth: 1,
      paddingHorizontal: SPACING.md,
      paddingVertical: SPACING.xs,
      borderRadius: BORDER_RADIUS.full,
      marginRight: SPACING.sm,
      ...SHADOW.sm,
    },
    chipActive: {
      backgroundColor: theme.activeTab,
      borderColor: theme.activeTab,
    },
    chipIcon: {
      marginRight: 4,
    },
    chipText: {
      fontSize: FONT_SIZE.sm,
      fontFamily: FONT_FAMILY.medium,
      color: theme.mutedText,
    },
    chipTextActive: {
      color: theme.white,
      fontFamily: FONT_FAMILY.semibold,
    },
    listContent: {
      paddingTop: SPACING.md,
      paddingBottom: SPACING.xxxl,
    },
    emptyContainer: {
      flex: 1,
      justifyContent: "center",
      alignItems: "center",
      marginTop: SPACING.xxxl * 2,
    },
    emptyTitle: {
      fontSize: FONT_SIZE.lg,
      fontFamily: FONT_FAMILY.bold,
      color: theme.text,
      marginTop: SPACING.md,
    },
    emptySubtext: {
      fontSize: FONT_SIZE.md,
      fontFamily: FONT_FAMILY.regular,
      color: theme.mutedText,
      marginTop: SPACING.sm,
    },
    actionContainer: {
      width: "100%",
      gap: SPACING.sm,
      marginTop: SPACING.lg,
    },
    primaryButton: {
      flexDirection: "row",
      alignItems: "center",
      justifyContent: "center",
      backgroundColor: theme.activeTab,
      paddingVertical: SPACING.md,
      borderRadius: BORDER_RADIUS.md,
      ...SHADOW.sm,
    },
    primaryButtonText: {
      fontSize: FONT_SIZE.sm + 2,
      fontFamily: FONT_FAMILY.semibold,
      color: theme.white,
    },
    secondaryButton: {
      flexDirection: "row",
      alignItems: "center",
      justifyContent: "center",
      backgroundColor: theme.tagBg,
      borderColor: theme.cardBorder,
      borderWidth: 1,
      paddingVertical: SPACING.md,
      borderRadius: BORDER_RADIUS.md,
    },
    secondaryButtonText: {
      fontSize: FONT_SIZE.sm + 2,
      fontFamily: FONT_FAMILY.semibold,
      color: theme.text,
    },
    buttonPressed: {
      opacity: 0.85,
    },
    buttonIcon: {
      marginRight: SPACING.xs,
    },
  });