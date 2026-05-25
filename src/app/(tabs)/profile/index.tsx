import { FONT_SIZE, FONT_WEIGHT, Theme } from "@/constants/theme";
import { useGlobalStyles } from "@/constants/useGlobalStyles";
import { useTheme } from "@/hooks/useTheme";
import React from "react";
import { StyleSheet, Text, View } from "react-native";

const ProfileScreen = () => {
  const theme = useTheme();
  const globalStyles = useGlobalStyles(theme);
  const styles = makeStyles(theme);

  return (
    <View style={globalStyles.screenContainer}>
      <Text style={styles.title}>ProfileScreen</Text>
    </View>
  );
};

export default ProfileScreen;

const makeStyles = (theme: Theme) =>
  StyleSheet.create({
    title: {
      fontSize: FONT_SIZE.lg,
      fontWeight: FONT_WEIGHT.bold,
      color: theme.text,
    },
  });
