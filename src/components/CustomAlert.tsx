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
import React from "react";
import { Modal, Pressable, StyleSheet, Text, View } from "react-native";
import Animated, {
  FadeIn,
  FadeOut,
} from "react-native-reanimated";

export interface CustomAlertButton {
  text: string;
  onPress?: () => void;
  style?: "default" | "cancel" | "destructive";
}

interface CustomAlertProps {
  visible: boolean;
  title: string;
  message: string;
  buttons?: CustomAlertButton[];
  onClose: () => void;
}

const CustomAlert = ({
  visible,
  title,
  message,
  buttons = [],
  onClose,
}: CustomAlertProps) => {
  const theme = useTheme();
  const styles = makeStyles(theme);

  if (!visible) return null;

  const defaultButtons: CustomAlertButton[] =
    buttons.length > 0 ? buttons : [{ text: "OK", onPress: onClose }];

  return (
    <Modal
      transparent
      visible={visible}
      animationType="none"
      onRequestClose={onClose}
    >
      {/* Backdrop overlay */}
      <Animated.View
        entering={FadeIn.duration(200)}
        exiting={FadeOut.duration(150)}
        style={styles.backdrop}
      >
        {/* Alert container */}
        <Animated.View
          entering={FadeIn.duration(220)}
          exiting={FadeOut.duration(180)}
          style={styles.alertContainer}
        >
          <Text style={styles.titleText}>{title}</Text>
          <Text style={styles.messageText}>{message}</Text>

          <View
            style={[
              styles.buttonsRow,
              defaultButtons.length > 2 && styles.buttonsColumn,
            ]}
          >
            {defaultButtons.map((btn, index) => {
              const isCancel = btn.style === "cancel";
              const isDestructive = btn.style === "destructive";

              let btnBgStyle = styles.buttonPrimary;
              let btnTextStyle = styles.buttonTextPrimary;

              if (isCancel) {
                btnBgStyle = styles.buttonCancel;
                btnTextStyle = styles.buttonTextCancel;
              } else if (isDestructive) {
                btnBgStyle = styles.buttonDestructive;
                btnTextStyle = styles.buttonTextDestructive;
              }

              const handlePress = () => {
                onClose();
                if (btn.onPress) {
                  btn.onPress();
                }
              };

              return (
                <Pressable
                  key={index}
                  onPress={handlePress}
                  style={({ pressed }) => [
                    btnBgStyle,
                    defaultButtons.length <= 2 && styles.flexButton,
                    pressed && styles.buttonPressed,
                  ]}
                >
                  <Text style={btnTextStyle}>{btn.text}</Text>
                </Pressable>
              );
            })}
          </View>
        </Animated.View>
      </Animated.View>
    </Modal>
  );
};

export default CustomAlert;

const makeStyles = (theme: Theme) =>
  StyleSheet.create({
    backdrop: {
      flex: 1,
      backgroundColor: theme.overlay,
      justifyContent: "center",
      alignItems: "center",
      padding: SPACING.lg,
    },
    alertContainer: {
      backgroundColor: theme.card,
      borderColor: theme.cardBorder,
      borderWidth: 1,
      borderRadius: BORDER_RADIUS.lg,
      padding: SPACING.lg,
      width: "100%",
      maxWidth: 320,
      ...SHADOW.lg,
    },
    titleText: {
      fontSize: FONT_SIZE.lg,
      fontWeight: FONT_WEIGHT.bold,
      fontFamily: FONT_FAMILY.bold,
      color: theme.text,
      textAlign: "center",
      marginBottom: SPACING.sm,
    },
    messageText: {
      fontSize: FONT_SIZE.md,
      fontFamily: FONT_FAMILY.regular,
      color: theme.mutedText,
      textAlign: "center",
      lineHeight: 22,
      marginBottom: SPACING.lg,
    },
    buttonsRow: {
      flexDirection: "row",
      justifyContent: "center",
      gap: SPACING.md,
    },
    buttonsColumn: {
      flexDirection: "column",
      gap: SPACING.sm,
      width: "100%",
    },
    flexButton: {
      flex: 1,
    },
    buttonPrimary: {
      backgroundColor: theme.activeTab,
      paddingVertical: SPACING.sm,
      paddingHorizontal: SPACING.md,
      borderRadius: BORDER_RADIUS.md,
      justifyContent: "center",
      alignItems: "center",
    },
    buttonCancel: {
      backgroundColor: theme.tagBg,
      paddingVertical: SPACING.sm,
      paddingHorizontal: SPACING.md,
      borderRadius: BORDER_RADIUS.md,
      justifyContent: "center",
      alignItems: "center",
      borderWidth: 1,
      borderColor: theme.cardBorder,
    },
    buttonDestructive: {
      backgroundColor: theme.activeTab, // Red acts as brand red and destructive color
      paddingVertical: SPACING.sm,
      paddingHorizontal: SPACING.md,
      borderRadius: BORDER_RADIUS.md,
      justifyContent: "center",
      alignItems: "center",
    },
    buttonTextPrimary: {
      fontSize: FONT_SIZE.sm + 2,
      fontWeight: FONT_WEIGHT.semibold,
      fontFamily: FONT_FAMILY.semibold,
      color: theme.white,
    },
    buttonTextCancel: {
      fontSize: FONT_SIZE.sm + 2,
      fontWeight: FONT_WEIGHT.semibold,
      fontFamily: FONT_FAMILY.semibold,
      color: theme.text,
    },
    buttonTextDestructive: {
      fontSize: FONT_SIZE.sm + 2,
      fontWeight: FONT_WEIGHT.semibold,
      fontFamily: FONT_FAMILY.semibold,
      color: theme.white,
    },
    buttonPressed: {
      opacity: 0.8,
    },
  });
