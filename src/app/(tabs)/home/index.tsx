import HomeSearchBar from "@/components/HomeSearchBar";
import HomeStatsGrid from "@/components/HomeStatsGrid";
import {
  FONT_FAMILY,
  FONT_SIZE,
  FONT_WEIGHT,
  SPACING,
  Theme,
} from "@/constants/theme";
import { useGlobalStyles } from "@/constants/useGlobalStyles";
import { useTheme } from "@/hooks/useTheme";
import { Button } from "@react-navigation/elements";
import { router } from "expo-router";
import React from "react";
import { StyleSheet, Text, View } from "react-native";

const HomeScreen = () => {
  const theme = useTheme();
  const globalStyles = useGlobalStyles(theme);
  const styles = makeStyles(theme);

  return (
    <View style={globalStyles.screenContainer}>
      {/* Header Row */}
      <View style={[globalStyles.headerRow, styles.headerRow]}>
        <Text style={styles.title}>Snipr-ai</Text>
      </View>
      <View style={styles.searchWrap}>
        <HomeSearchBar />
      </View>
      <HomeStatsGrid />
      <Button 
        onPressIn={()=>router.push('/(tabs)/home/CreateSnippetScreen')}
        style= {{margin: 20}}> 
          Add a new snippet
      </Button>
    </View>
  );
};

export default HomeScreen;

const makeStyles = (theme: Theme) =>
  StyleSheet.create({
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
  });
