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
import { getFavorites } from "@/services/db/snippets";
import { Snippet } from "@/types";
import { MaterialCommunityIcons } from "@expo/vector-icons";
import { router, useFocusEffect } from "expo-router";
import React, { useCallback, useState } from "react";
import {
  FlatList,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from "react-native";
import Animated, {
  useAnimatedStyle,
  useSharedValue,
  withTiming,
} from "react-native-reanimated";

const LANGUAGE_ICONS: Record<string, string> = {
  TypeScript: "language-typescript",
  JavaScript: "language-javascript",
  Python: "language-python",
  Java: "language-java",
  Go: "language-go",
  HTML: "language-html5",
  CSS: "language-css3",
};

const FavouritesScreen = () => {
  const theme = useTheme();
  const globalStyles = useGlobalStyles(theme);
  const styles = makeStyles(theme);
  
  const [favourites, setFavourites] = useState<Snippet[]>([]);
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedLanguage, setSelectedLanguage] = useState<string | null>(null);
  
  const emptyOpacity = useSharedValue(0);
  const emptyTranslateY = useSharedValue(20);

  const animatedEmptyStyle = useAnimatedStyle(() => ({
    opacity: emptyOpacity.value,
    transform: [{ translateY: emptyTranslateY.value }],
  }));

  const availableLanguages = React.useMemo(() => {
    const langs = favourites
      .map((s) => s.language)
      .filter((lang): lang is string => typeof lang === "string" && lang.trim().length > 0);
    return ["All", ...Array.from(new Set(langs))];
  }, [favourites]);

  const filteredFavourites = React.useMemo(() => {
    return favourites.filter((snippet) => {
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
  }, [favourites, selectedLanguage, searchQuery]);

  const filteredCount = filteredFavourites.length;

  React.useEffect(() => {
    if (filteredCount === 0) {
      emptyOpacity.value = 0;
      emptyTranslateY.value = 20;
      emptyOpacity.value = withTiming(1, { duration: 400 });
      emptyTranslateY.value = withTiming(0, { duration: 400 });
    }
  }, [filteredCount, emptyOpacity, emptyTranslateY]);

  useFocusEffect(
    useCallback(() => {
      try {
        const data = getFavorites();
        setFavourites(data);
        if (data.length === 0) {
          emptyOpacity.value = 0;
          emptyTranslateY.value = 20;
          emptyOpacity.value = withTiming(1, { duration: 400 });
          emptyTranslateY.value = withTiming(0, { duration: 400 });
        }
      } catch (error) {
        console.error("Failed to load favourites", error);
      }
    }, [emptyOpacity, emptyTranslateY])
  );

  const handleBack = () => {
    router.back();
  };

  const renderEmpty = () => {
    const hasAnyFavourites = favourites.length > 0;
    return (
      <Animated.View style={[styles.emptyContainer, animatedEmptyStyle]}>
        <MaterialCommunityIcons
          name={hasAnyFavourites ? "text-search-variant" : "star-outline"}
          size={ICON_SIZE.xl * 2}
          color={theme.inactiveTab}
        />
        <Text style={styles.emptyTitle}>
          {hasAnyFavourites ? "No match found" : "No Favourites Yet"}
        </Text>
        <Text style={styles.emptySubtext}>
          {hasAnyFavourites
            ? "Try adjusting your search or language filter."
            : "Tap the star icon on any snippet to save it here."}
        </Text>
      </Animated.View>
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
          Favourites
        </Text>
        <View style={{ width: ICON_SIZE.xl + SPACING.sm * 2 }} />
      </View>

      <View style={styles.searchWrap}>
        <HomeSearchBar value={searchQuery} onChangeText={setSearchQuery} />
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
        data={filteredFavourites}
        keyExtractor={(item) => item.id.toString()}
        renderItem={({ item }) => <SnippetCard snippet={item} />}
        contentContainerStyle={styles.listContent}
        showsVerticalScrollIndicator={false}
        ListEmptyComponent={renderEmpty}
      />
    </View>
  );
};

export default FavouritesScreen;

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
      marginTop: SPACING.sm,
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
      textAlign: "center",
      paddingHorizontal: SPACING.xl,
    },
  });