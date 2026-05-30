import {
  BORDER_RADIUS,
  FONT_FAMILY,
  FONT_SIZE,
  ICON_SIZE,
  SHADOW,
  SPACING,
  Theme,
} from "@/constants/theme";
import { useTheme } from "@/hooks/useTheme";
import { useThemedStyles } from "@/hooks/useThemedStyles";
import { getAllSnippets } from "@/services/db/snippets";
import { Snippet } from "@/types";
import { MaterialCommunityIcons } from "@expo/vector-icons";
import { useFocusEffect, router } from "expo-router";
import React, { memo, useCallback, useMemo, useState } from "react";
import { Pressable, StyleSheet, Text, View } from "react-native";
import Animated, {
  useAnimatedStyle,
  useSharedValue,
  withTiming,
} from "react-native-reanimated";

const AnimatedPressable = Animated.createAnimatedComponent(Pressable);

const LANGUAGE_ICONS: Record<string, string> = {
  TypeScript: "language-typescript",
  JavaScript: "language-javascript",
  Python: "language-python",
  Java: "language-java",
  Go: "language-go",
  HTML: "language-html5",
  CSS: "language-css3",
};

const FeaturedSnippetCard = () => {
  const theme = useTheme();
  const styles = useThemedStyles(makeStyles, theme);
  const [latestSnippet, setLatestSnippet] = useState<Snippet | null>(null);
  const iconName = latestSnippet ? (LANGUAGE_ICONS[latestSnippet.language] || "code-tags") : "code-tags";

  useFocusEffect(
    useCallback(() => {
      const fetchSnippet = () => {
        try {
          // get latest snippets (the query is already ordered by created_at DESC)
          const snippets = getAllSnippets();
          if (snippets && snippets.length > 0) {
            setLatestSnippet(snippets[0]);
          } else {
            setLatestSnippet(null);
          }
        } catch (error) {
          console.error("Error fetching latest snippet:", error);
        }
      };
      fetchSnippet();
    }, [])
  );

  const scale = useSharedValue(1);

  const animatedStyle = useAnimatedStyle(() => ({
    transform: [{ scale: scale.value }],
  }));

  const handlePressIn = () => {
    scale.value = withTiming(0.97, { duration: 70 });
  };

  const handlePressOut = () => {
    scale.value = withTiming(1, { duration: 110 });
  };

  const handlePress = () => {
    if (latestSnippet) {
      router.push(`/SnippetDetailScreen?id=${latestSnippet.id}`);
    }
  };

  const createdDate = useMemo(() => {
    if (!latestSnippet) {
      return "";
    }
    return new Date(latestSnippet.created_at * 1000).toLocaleDateString(undefined, {
      month: "short",
      day: "numeric",
      year: "numeric",
    });
  }, [latestSnippet?.created_at]);

  // If there are no snippets saved yet, we return null to hide the component
  if (!latestSnippet) {
    return null;
  }

  return (
    <AnimatedPressable
      onPress={handlePress}
      onPressIn={handlePressIn}
      onPressOut={handlePressOut}
      style={[styles.card, animatedStyle]}
    >
      <View style={styles.headerRow}>
        <View style={styles.iconContainer}>
          <MaterialCommunityIcons
            name={iconName as any}
            size={ICON_SIZE.xl}
            color={theme.white}
          />
        </View>

        <View style={styles.headerTextContainer}>
          <Text style={styles.languageText} numberOfLines={1}>
            {latestSnippet.language}
          </Text>
          <Text style={styles.titleText} numberOfLines={1}>
            {latestSnippet.title}
          </Text>
        </View>

        <View style={styles.statusBadge}>
          <Text style={styles.statusText}>Latest</Text>
        </View>
      </View>

      {latestSnippet.description ? (
        <Text style={styles.descriptionText} numberOfLines={2}>
          {latestSnippet.description}
        </Text>
      ) : (
        <Text style={[styles.descriptionText, styles.codeTextMonospace]} numberOfLines={2}>
          {latestSnippet.code}
        </Text>
      )}

      <View style={styles.badgesRow}>
        <View style={styles.badge}>
          <MaterialCommunityIcons
            name="calendar"
            size={ICON_SIZE.sm}
            color={theme.mutedText}
          />
          <Text style={styles.badgeText}>{createdDate}</Text>
        </View>

        {latestSnippet.favorite === 1 && (
          <View style={styles.badge}>
            <MaterialCommunityIcons name="star" size={ICON_SIZE.sm} color={theme.favorite} />
            <Text style={styles.favoriteBadgeText}>
              Favorite
            </Text>
          </View>
        )}
      </View>
    </AnimatedPressable>
  );
};

export default memo(FeaturedSnippetCard);

const makeStyles = (theme: Theme) =>
  StyleSheet.create({
    card: {
      backgroundColor: theme.card,
      borderRadius: BORDER_RADIUS.xl,
      padding: SPACING.lg,
      marginTop: SPACING.md,
      borderWidth: 1,
      borderColor: theme.cardBorder,
      ...SHADOW.md,
    },
    headerRow: {
      flexDirection: "row",
      alignItems: "center",
      marginBottom: SPACING.md,
    },
    iconContainer: {
      width: 48,
      height: 48,
      borderRadius: BORDER_RADIUS.md,
      backgroundColor: theme.activeTab,
      justifyContent: "center",
      alignItems: "center",
      marginRight: SPACING.md,
    },
    headerTextContainer: {
      flex: 1,
      justifyContent: "center",
    },
    languageText: {
      fontSize: FONT_SIZE.sm,
      fontFamily: FONT_FAMILY.medium,
      color: theme.mutedText,
      marginBottom: 2,
      textTransform: "uppercase",
    },
    titleText: {
      fontSize: FONT_SIZE.lg,
      fontFamily: FONT_FAMILY.bold,
      color: theme.text,
    },
    statusBadge: {
      backgroundColor: theme.successSoft,
      paddingHorizontal: SPACING.sm,
      paddingVertical: 4,
      borderRadius: BORDER_RADIUS.full,
      marginLeft: SPACING.xs,
    },
    statusText: {
      color: theme.success,
      fontSize: FONT_SIZE.sm,
      fontFamily: FONT_FAMILY.semibold,
    },
    descriptionText: {
      fontSize: FONT_SIZE.md,
      fontFamily: FONT_FAMILY.regular,
      color: theme.mutedText,
      lineHeight: 22,
      marginBottom: SPACING.lg,
    },
    codeTextMonospace: {
      fontFamily: "monospace",
    },
    badgesRow: {
      flexDirection: "row",
      flexWrap: "wrap",
      gap: SPACING.sm,
    },
    badge: {
      flexDirection: "row",
      alignItems: "center",
      backgroundColor: theme.tagBg,
      paddingHorizontal: SPACING.sm,
      paddingVertical: 6,
      borderRadius: BORDER_RADIUS.md,
      gap: 6,
    },
    badgeText: {
      fontSize: FONT_SIZE.sm,
      fontFamily: FONT_FAMILY.medium,
      color: theme.text,
    },
    favoriteBadgeText: {
      fontSize: FONT_SIZE.sm,
      fontFamily: FONT_FAMILY.medium,
      color: theme.favorite,
    },
  });
