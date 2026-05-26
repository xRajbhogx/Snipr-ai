import SnippetCard from "@/components/SnippetCard";
import {
  BORDER_RADIUS,
  FONT_FAMILY,
  FONT_SIZE,
  ICON_SIZE,
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
  StyleSheet,
  Text,
  View,
} from "react-native";
import Animated, {
  useAnimatedStyle,
  useSharedValue,
  withTiming,
} from "react-native-reanimated";

const FavouritesScreen = () => {
  const theme = useTheme();
  const globalStyles = useGlobalStyles(theme);
  const styles = makeStyles(theme);
  
  const [favourites, setFavourites] = useState<Snippet[]>([]);
  
  const emptyOpacity = useSharedValue(0);
  const emptyTranslateY = useSharedValue(20);

  const animatedEmptyStyle = useAnimatedStyle(() => ({
    opacity: emptyOpacity.value,
    transform: [{ translateY: emptyTranslateY.value }],
  }));

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

  const renderEmpty = () => (
    <Animated.View style={[styles.emptyContainer, animatedEmptyStyle]}>
      <MaterialCommunityIcons
        name="star-outline"
        size={ICON_SIZE.xl * 2}
        color={theme.inactiveTab}
      />
      <Text style={styles.emptyTitle}>No Favourites Yet</Text>
      <Text style={styles.emptySubtext}>
        Tap the star icon on any snippet to save it here.
      </Text>
    </Animated.View>
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
          Favourites
        </Text>
        <View style={{ width: ICON_SIZE.xl + SPACING.sm * 2 }} />
      </View>

      <FlatList
        data={favourites}
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