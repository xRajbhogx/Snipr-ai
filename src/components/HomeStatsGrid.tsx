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
import { router, useFocusEffect, useLocalSearchParams } from "expo-router";
import { useThemedStyles } from "@/hooks/useThemedStyles";
import React, { memo, useState, useCallback, useEffect, useMemo } from "react";
import { Pressable, StyleSheet, Text, View } from "react-native";
import Animated, {
    useAnimatedStyle,
    useSharedValue,
    withTiming,
} from "react-native-reanimated";
import { getDashboardStats } from "@/services/db/snippets";
import { DirectoryType, listFiles } from "@/services/fileService";
import FileManagementModal from "@/components/FileManagementModal";

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
  onPress: (key: string) => void;
};

const StatCard = memo(({ item, theme, styles, onPress }: StatCardProps) => {
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

  const handlePress = useCallback(() => {
    onPress(item.key);
  }, [item.key, onPress]);

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
});

StatCard.displayName = "StatCard";

const HomeStatsGrid = () => {
  const theme = useTheme();
  const styles = useThemedStyles(makeStyles, theme);
  const [stats, setStats] = useState({
    snippets: 0,
    favorites: 0,
    files: 0,
    screenshots: 0,
    downloads: 0,
    trash: 0,
  });

  // Modal control states
  const [modalVisible, setModalVisible] = useState(false);
  const [selectedDir, setSelectedDir] = useState<DirectoryType | null>(null);

  const params = useLocalSearchParams<{ openModal?: string }>();

  useEffect(() => {
    if (params.openModal === "exports" || params.openModal === "files") {
      setSelectedDir("exports");
      setModalVisible(true);
      router.setParams({ openModal: undefined });
    } else if (params.openModal === "screenshots") {
      setSelectedDir("images");
      setModalVisible(true);
      router.setParams({ openModal: undefined });
    } else if (params.openModal === "downloads") {
      setSelectedDir("downloads");
      setModalVisible(true);
      router.setParams({ openModal: undefined });
    }
  }, [params.openModal]);

  const loadStats = useCallback(async () => {
    try {
      const counts = getDashboardStats();
      
      // Load file counts from filesystem
      let exportsCount = 0;
      let imagesCount = 0;
      let downloadsCount = 0;
      
      try {
        const exportsList = await listFiles("exports");
        exportsCount = exportsList.length;
      } catch (err) {
        console.error("Error reading exports count:", err);
      }
      
      try {
        const imagesList = await listFiles("images");
        imagesCount = imagesList.length;
      } catch (err) {
        console.error("Error reading images count:", err);
      }
      
      try {
        const downloadsList = await listFiles("downloads");
        downloadsCount = downloadsList.length;
      } catch (err) {
        console.error("Error reading downloads count:", err);
      }

      setStats({
        snippets: counts.snippets,
        favorites: counts.favorites,
        files: exportsCount,
        screenshots: imagesCount,
        downloads: downloadsCount,
        trash: counts.trash,
      });
    } catch (error) {
      console.error("Error loading dashboard stats:", error);
    }
  }, []);

  useFocusEffect(
    useCallback(() => {
      loadStats();
    }, [loadStats])
  );

  const statItems = useMemo<StatItem[]>(
    () =>
      STATS_TEMPLATE.map((item) => {
        let value = "0";
        switch (item.key) {
          case "snippets":
            value = stats.snippets.toLocaleString();
            break;
          case "favorites":
            value = stats.favorites.toLocaleString();
            break;
          case "files":
            value = stats.files.toLocaleString();
            break;
          case "screenshots":
            value = stats.screenshots.toLocaleString();
            break;
          case "downloads":
            value = stats.downloads.toLocaleString();
            break;
          case "trash":
            value = stats.trash.toLocaleString();
            break;
        }
        return { ...item, value };
      }),
    [stats],
  );

  const handlePressCard = useCallback((key: string) => {
    switch (key) {
      case "snippets":
        router.push("/home/AllSnippetsScreen");
        break;
      case "favorites":
        router.push("/home/FavouritesScreen");
        break;
      case "files":
        setSelectedDir("exports");
        setModalVisible(true);
        break;
      case "screenshots":
        setSelectedDir("images");
        setModalVisible(true);
        break;
      case "downloads":
        setSelectedDir("downloads");
        setModalVisible(true);
        break;
      default:
        break;
    }
  }, []);

  const handleCloseModal = useCallback(() => {
    setModalVisible(false);
  }, []);

  return (
    <View style={styles.grid}>
      {statItems.map((item) => (
        <StatCard
          key={item.key}
          item={item}
          theme={theme}
          styles={styles}
          onPress={handlePressCard}
        />
      ))}

      <FileManagementModal
        visible={modalVisible}
        directory={selectedDir}
        onClose={handleCloseModal}
        onRefreshStats={loadStats}
      />
    </View>
  );
};

export default memo(HomeStatsGrid);

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
