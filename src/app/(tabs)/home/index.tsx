import CustomAlert from "@/components/CustomAlert";
import HomeEmptyState from "@/components/HomeEmptyState";
import HomeSearchBar from "@/components/HomeSearchBar";
import HomeStatsGrid from "@/components/HomeStatsGrid";
import SnippetCard from "@/components/SnippetCard";
import {
  FONT_FAMILY,
  FONT_SIZE,
  FONT_WEIGHT,
  SPACING,
  Theme,
} from "@/constants/theme";
import { useGlobalStyles } from "@/constants/useGlobalStyles";
import { useTheme } from "@/hooks/useTheme";
import { useThemedStyles } from "@/hooks/useThemedStyles";
import { getAllSnippets, seedDemoSnippets } from "@/services/db/snippets";
import { Snippet } from "@/types";
import { router, useFocusEffect } from "expo-router";
import React, { useCallback, useState } from "react";
import { Pressable, ScrollView, StyleSheet, Text, View } from "react-native";

const HomeScreen = () => {
  const theme = useTheme();
  const globalStyles = useGlobalStyles(theme);
  const styles = useThemedStyles(makeStyles, theme);
  const [recentSnippets, setRecentSnippets] = useState<Snippet[]>([]);
  const [refreshTrigger, setRefreshTrigger] = useState(0);
  const [alertVisible, setAlertVisible] = useState(false);

  const loadSnippets = useCallback(() => {
    try {
      const snippets = getAllSnippets();
      setRecentSnippets(snippets.slice(0, 3));
    } catch (error) {
      // Ignore
    }
  }, []);

  useFocusEffect(
    useCallback(() => {
      loadSnippets();
    }, [loadSnippets])
  );

  const handleImportStarterSnippets = useCallback(() => {
    try {
      seedDemoSnippets();
      loadSnippets();
      setRefreshTrigger((prev) => prev + 1);
      setAlertVisible(true);
    } catch (error) {
      // Ignore
    }
  }, [loadSnippets]);

  const handleCloseAlert = useCallback(() => {
    setAlertVisible(false);
  }, []);

  return (
    <View style={styles.screenRoot}>
      <ScrollView 
        contentContainerStyle={globalStyles.tabScreenContentContainer} 
        showsVerticalScrollIndicator={false}
      >
        {/* Header Row */}
        <View style={[globalStyles.headerRow, styles.headerRow]}>
          <Text style={styles.title}>Snipr-ai</Text>
        </View>

        <Pressable
          onPress={() => router.push("/home/AllSnippetsScreen?focusSearch=true")}
          style={styles.searchWrap}
        >
          <HomeSearchBar editable={false} pointerEvents="none" />
        </Pressable>
        <HomeStatsGrid key={refreshTrigger} />
        
        {recentSnippets.length > 0 ? (
          <View style={styles.recentSection}>
            <View style={styles.recentHeader}>
              <Text style={styles.recentTitle}>Recent Snippets</Text>
              <Pressable 
              onPress={() => router.push("/home/AllSnippetsScreen")}
              hitSlop={{
                top: 20, bottom: 50, left: 50, right: 50
              }}>
                <Text style={styles.viewAllText}>View All</Text>
              </Pressable>
            </View>
            
            {recentSnippets.map((snippet) => (
              <SnippetCard key={snippet.id} snippet={snippet} />
            ))}
          </View>
        ) : (
          <HomeEmptyState onImportStarterSnippets={handleImportStarterSnippets} />
        )}
        
      </ScrollView>

      <CustomAlert
        visible={alertVisible}
        title="Starter Snippets Imported"
        message="Four developer-oriented starter snippets have been successfully added to your local vault."
        onClose={handleCloseAlert}
      />
    </View>
  );
};

export default HomeScreen;

const makeStyles = (theme: Theme) =>
  StyleSheet.create({
    screenRoot: {
      flex: 1,
      backgroundColor: theme.background,
    },
    headerRow: {
      marginTop: SPACING.md,
    },
    title: {
      fontSize: FONT_SIZE.xxl,
      fontWeight: FONT_WEIGHT.bold,
      fontFamily: FONT_FAMILY.bold,
      color: theme.text,
    },
    searchWrap: {
      marginTop: SPACING.md,
    },
    recentSection: {
      marginTop: SPACING.xl,
    },
    recentHeader: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'center',
      marginBottom: SPACING.md,
    },
    recentTitle: {
      fontSize: FONT_SIZE.lg,
      fontFamily: FONT_FAMILY.bold,
      color: theme.text,
    },
    viewAllText: {
      fontSize: FONT_SIZE.sm,
      fontFamily: FONT_FAMILY.semibold,
      color: theme.activeTab,
    },
  });
