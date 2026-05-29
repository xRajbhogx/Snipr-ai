import {
  BORDER_RADIUS,
  FONT_FAMILY,
  FONT_SIZE,
  FONT_WEIGHT,
  SHADOW,
  SPACING,
  Theme,
} from "@/constants/theme";
import { useTheme } from "@/hooks/useTheme";
import { MaterialCommunityIcons } from "@expo/vector-icons";
import React, { useEffect } from "react";
import { StyleSheet, Text, View } from "react-native";
import Animated, { FadeInDown, FadeOutDown } from "react-native-reanimated";

interface ToastProps {
  visible: boolean;
  message: string;
  onHide: () => void;
  duration?: number;
}

const Toast = ({ visible, message, onHide, duration = 2000 }: ToastProps) => {
  const theme = useTheme();
  const styles = makeStyles(theme);

  useEffect(() => {
    if (visible) {
      const timer = setTimeout(() => {
        onHide();
      }, duration);
      return () => clearTimeout(timer);
    }
  }, [visible, message, duration, onHide]);

  if (!visible) return null;

  return (
    <Animated.View
      entering={FadeInDown.duration(300).springify().damping(50)}
      exiting={FadeOutDown.duration(200)}
      style={styles.toastContainer}
    >
      <View style={styles.toastContent}>
        <MaterialCommunityIcons
          name="check-circle"
          size={18}
          color={theme.success}
          style={styles.toastIcon}
        />
        <Text style={styles.toastText}>{message}</Text>
      </View>
    </Animated.View>
  );
};

export default Toast;

const makeStyles = (theme: Theme) =>
  StyleSheet.create({
    toastContainer: {
      position: "absolute",
      bottom: 50,
      left: SPACING.lg,
      right: SPACING.lg,
      alignItems: "center",
      zIndex: 9999,
    },
    toastContent: {
      backgroundColor: theme.card,
      borderColor: theme.cardBorder,
      borderWidth: 1,
      borderRadius: BORDER_RADIUS.md,
      paddingVertical: SPACING.sm + 2,
      paddingHorizontal: SPACING.md,
      flexDirection: "row",
      alignItems: "center",
      maxWidth: "100%",
      ...SHADOW.md,
    },
    toastIcon: {
      marginRight: SPACING.sm,
    },
    toastText: {
      fontSize: FONT_SIZE.sm + 1,
      fontFamily: FONT_FAMILY.medium,
      fontWeight: FONT_WEIGHT.medium,
      color: theme.text,
    },
  });
