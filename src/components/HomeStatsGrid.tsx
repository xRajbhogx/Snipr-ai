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
import React from "react";
import { Pressable, StyleSheet, Text, View } from "react-native";
import Animated, {
    useAnimatedStyle,
    useSharedValue,
    withTiming,
} from "react-native-reanimated";

type StatItem = {
  key: string;
  label: string;
  value: string;
  icon: keyof typeof MaterialCommunityIcons.glyphMap;
};

const STATS: StatItem[] = [
  { key: "snippets", label: "Snippets", value: "1,248", icon: "code-tags" },
  { key: "favorites", label: "Favorites", value: "156", icon: "star" },
  { key: "files", label: "Files", value: "3,421", icon: "folder-outline" },
  { key: "screenshots", label: "Screenshots", value: "1,168", icon: "image-outline" },
  { key: "downloads", label: "Downloads", value: "342", icon: "download" },
  { key: "trash", label: "Trash", value: "28", icon: "trash-can-outline" },
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

  return (
    <AnimatedPressable
      accessibilityRole="button"
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

  return (
    <View style={styles.grid}>
      {STATS.map((item) => (
        <StatCard key={item.key} item={item} theme={theme} styles={styles} />
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
