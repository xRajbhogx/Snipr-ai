import {
    BORDER_RADIUS,
    FONT_FAMILY,
    FONT_SIZE,
    FONT_WEIGHT,
    ICON_SIZE,
    SHADOW,
    SPACING,
    Theme,
} from "@/constants/theme";
import { useTheme } from "@/hooks/useTheme";
import { MaterialCommunityIcons } from "@expo/vector-icons";
import { router, useFocusEffect } from "expo-router";
import React, { useState, useCallback } from "react";
import { Pressable, StyleSheet, Text, View } from "react-native";
import Animated, {
    useAnimatedStyle,
    useSharedValue,
    withTiming,
} from "react-native-reanimated";
import { getDashboardStats } from "@/services/db/snippets";

type StatItem = {
  key: string;
  label: string;
  value: string;
  icon: keyof typeof MaterialCommunityIcons.glyphMap;
};

const STATS_TEMPLATE: Omit<StatItem, "value">[] = [
  { key: "snippets", label: "Snippets", icon: "code-tags" },
  { key: "favorites", label: "Favorites", icon: "star" },
  { key: "files", label: "Files", icon: "folder-outline" },
  { key: "screenshots", label: "Screenshots", icon: "image-outline" },
  { key: "downloads", label: "Downloads", icon: "download" },
  { key: "trash", label: "Trash", icon: "trash-can-outline" },
];

const AnimatedPressable = Animated.createAnimatedComponent(Pressable);

type StatCardProps = {
  item: StatItem;
  theme: Theme;
  styles: ReturnType<typeof makeStyles>;
};

const StatCard = ({ item, theme, styles }: StatCardProps) => {
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
    switch (item.key) {
      case 'snippets': 
        router.push('/AllSnippetsScreen');
        break;
      case 'favorites':
        router.push('/(tabs)/home/FavouritesScreen');
        break;
      default:
        // Future routes
        break;
    }
  };

  return (
    <AnimatedPressable
      accessibilityRole="button"
      onPress={handlePress}
      onPressIn={handlePressIn}
      onPressOut={handlePressOut}
      style={[styles.card, animatedStyle]}
    >
        <MaterialCommunityIcons
          name={item.icon}
          size={ICON_SIZE.lg}
          color={theme.activeTab}
        />
      <Text style={styles.cardLabel}>{item.label}</Text>
      <Text style={styles.cardValue}>{item.value}</Text>
    </AnimatedPressable>
  );
};

const HomeStatsGrid = () => {
  const theme = useTheme();
  const styles = makeStyles(theme);
  const [stats, setStats] = useState({
    snippets: 0,
    favorites: 0,
    files: 0,
    screenshots: 0,
    downloads: 0,
    trash: 0,
  });

  useFocusEffect(
    useCallback(() => {
      try {
        const counts = getDashboardStats();
        setStats(counts);
      } catch (error) {
        console.error("Error loading dashboard stats:", error);
      }
    }, [])
  );

  const getStatValue = (key: string): string => {
    switch (key) {
      case "snippets":
        return stats.snippets.toLocaleString();
      case "favorites":
        return stats.favorites.toLocaleString();
      case "files":
        return stats.files.toLocaleString();
      case "screenshots":
        return stats.screenshots.toLocaleString();
      case "downloads":
        return stats.downloads.toLocaleString();
      case "trash":
        return stats.trash.toLocaleString();
      default:
        return "0";
    }
  };

  return (
    <View style={styles.grid}>
      {STATS_TEMPLATE.map((item) => (
        <StatCard 
          key={item.key} 
          item={{ ...item, value: getStatValue(item.key) }} 
          theme={theme} 
          styles={styles} 
        />
      ))}
    </View>
  );
};

export default HomeStatsGrid;

const makeStyles = (theme: Theme) =>
  StyleSheet.create({
    grid: {
      flexDirection: "row",
      flexWrap: "wrap",
      justifyContent: "space-between",
      marginTop: SPACING.md,
    },
    card: {
      width: "31.5%",
      aspectRatio: 1,
      backgroundColor: theme.card,
      borderRadius: BORDER_RADIUS.lg,
      borderWidth: 1,
      borderColor: theme.cardBorder,
      paddingVertical: SPACING.lg,
      paddingHorizontal: SPACING.sm,
      alignItems: "center",
      justifyContent: "center",
      marginBottom: SPACING.md,
      ...SHADOW.sm,
    },
    cardLabel: {
      fontSize: FONT_SIZE.md,
      paddingTop: SPACING.xs,
      fontWeight: FONT_WEIGHT.semibold,
      fontFamily: FONT_FAMILY.semibold,
      color: theme.text,
      textAlign: "center",
    },
    cardValue: {
      marginTop: SPACING.xs,
      fontSize: FONT_SIZE.sm,
      fontWeight: FONT_WEIGHT.medium,
      fontFamily: FONT_FAMILY.medium,
      color: theme.mutedText,
      textAlign: "center",
    },
  });
