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
import { useTheme } from "@/hooks/useTheme";
import { getAllSnippets, deleteAllSnippets } from "@/services/db/snippets";
import { Snippet } from "@/types";
import { MaterialCommunityIcons } from "@expo/vector-icons";
import { router, useFocusEffect, useLocalSearchParams } from "expo-router";
import React, { useCallback, useState } from "react";
import {
  FlatList,
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

const AllSnippetsScreen = () => {
  const theme = useTheme();
  const globalStyles = useGlobalStyles(theme);
  const styles = makeStyles(theme);
  const [snippets, setSnippets] = useState<Snippet[]>([]);
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedLanguage, setSelectedLanguage] = useState<string | null>(null);
  const [alertVisible, setAlertVisible] = useState(false);

  const { focusSearch } = useLocalSearchParams<{ focusSearch?: string }>();
  const searchInputRef = React.useRef<TextInput | null>(null);

  const handleDeleteAll = () => {
    try {
      deleteAllSnippets();
      setSnippets([]);
    } catch (error) {
      console.error("Failed to delete all snippets", error);
    }
  };

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

  useFocusEffect(
    useCallback(() => {
      try {
        const data = getAllSnippets();
        setSnippets(data);
        if (focusSearch === "true") {
          setTimeout(() => {
            searchInputRef.current?.focus();
          }, 100);
        }
      } catch (error) {
        console.error("Failed to load snippets", error);
      }
    }, [focusSearch])
  );

  const handleBack = () => {
    router.back();
  };

  const renderEmpty = () => {
    const hasAnySnippets = snippets.length > 0;
    return (
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
      </View>
    );
  };

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
        data={filteredSnippets}
        keyExtractor={(item) => item.id.toString()}
        renderItem={({ item }) => <SnippetCard snippet={item} />}
        contentContainerStyle={styles.listContent}
        showsVerticalScrollIndicator={false}
        ListEmptyComponent={renderEmpty}
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
  });