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
import { Snippet } from "@/types";
import { MaterialCommunityIcons } from "@expo/vector-icons";
import { router } from "expo-router";
import React from "react";
import { Pressable, StyleSheet, Text, View } from "react-native";
import Animated, {
  useAnimatedStyle,
  useSharedValue,
  withTiming,
} from "react-native-reanimated";

const AnimatedPressable = Animated.createAnimatedComponent(Pressable);

type SnippetCardProps = {
  snippet: Snippet;
};

const SnippetCard = ({ snippet }: SnippetCardProps) => {
  const theme = useTheme();
  const styles = makeStyles(theme);

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
    router.push(`/SnippetDetailScreen?id=${snippet.id}`);
  };

  const createdDate = new Date(snippet.created_at * 1000).toLocaleDateString(
    undefined,
    {
      month: "short",
      day: "numeric",
      year: "numeric",
    }
  );

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
            name="code-brackets"
            size={ICON_SIZE.md}
            color={theme.white}
          />
        </View>

        <View style={styles.headerTextContainer}>
          <Text style={styles.languageText} numberOfLines={1}>
            {snippet.language}
          </Text>
          <Text style={styles.titleText} numberOfLines={1}>
            {snippet.title}
          </Text>
        </View>

        {snippet.favorite === 1 && (
          <View style={styles.favoriteBadge}>
            <MaterialCommunityIcons name="star" size={ICON_SIZE.sm} color={theme.favorite} />
          </View>
        )}
      </View>

      <View style = {styles.descriptionContainer}>
        <Text style={styles.descriptionText} numberOfLines={2}>
          {snippet.description || snippet.code}
        </Text>
      </View>

      <View style={styles.badgesRow}>
        <View style={styles.badge}>
          <MaterialCommunityIcons
            name="calendar"
            size={14}
            color={theme.mutedText}
          />
          <Text style={styles.badgeText}>{createdDate}</Text>
        </View>
      </View>
    </AnimatedPressable>
  );
};

export default SnippetCard;

const makeStyles = (theme: Theme) =>
  StyleSheet.create({
    card: {
      backgroundColor: theme.card,
      borderRadius: BORDER_RADIUS.md,
      padding: SPACING.md,
      marginBottom: SPACING.md,
      borderWidth: 1,
      borderColor: theme.cardBorder,
      ...SHADOW.sm,
    },
    headerRow: {
      flexDirection: "row",
      alignItems: "center",
      marginBottom: SPACING.sm,
    },
    iconContainer: {
      width: 40,
      height: 40,
      borderRadius: BORDER_RADIUS.sm,
      backgroundColor: theme.activeTab,
      justifyContent: "center",
      alignItems: "center",
      marginRight: SPACING.sm,
    },
    headerTextContainer: {
      flex: 1,
      justifyContent: "center",
    },
    languageText: {
      fontSize: 11,
      fontFamily: FONT_FAMILY.medium,
      color: theme.mutedText,
      marginBottom: 2,
      textTransform: "uppercase",
    },
    titleText: {
      fontSize: FONT_SIZE.md,
      fontFamily: FONT_FAMILY.bold,
      color: theme.text,
    },
    favoriteBadge: {
      marginLeft: SPACING.xs,
      padding: 4,
      backgroundColor: "rgba(245, 158, 11, 0.1)",
      borderRadius: BORDER_RADIUS.full,
    },
    descriptionContainer: {
      // backgroundColor: theme.snippetDescriptionBg, 
      borderWidth: 1, 
      borderColor: theme.cardBorder,
      justifyContent: 'center', 
      paddingHorizontal: 10, 
      paddingVertical: 5,
      marginBottom: SPACING.sm,
      marginTop: SPACING.sm,
      borderRadius: BORDER_RADIUS.sm,
    },
    descriptionText: {
      fontSize: FONT_SIZE.sm,
      fontFamily: FONT_FAMILY.regular,
      color: theme.text,
      lineHeight: 18,

    },
    badgesRow: {
      flexDirection: "row",
      flexWrap: "wrap",
      gap: SPACING.xs,
    },
    badge: {
      flexDirection: "row",
      alignItems: "center",
      backgroundColor: theme.tagBg,
      paddingHorizontal: SPACING.sm,
      paddingVertical: 4,
      borderRadius: BORDER_RADIUS.sm,
      gap: 4,
    },
    badgeText: {
      fontSize: 12,
      fontFamily: FONT_FAMILY.medium,
      color: theme.text,
    },
  });
