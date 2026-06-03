import { MaterialCommunityIcons } from "@expo/vector-icons";
import React from "react";
import { Modal, Pressable, ScrollView, StyleSheet, Text, View } from "react-native";
import Animated, { SlideInDown, SlideOutDown } from "react-native-reanimated";

import { LANGUAGES } from "@/constants/languages";
import {
  BORDER_RADIUS,
  FONT_FAMILY,
  FONT_SIZE,
  ICON_SIZE,
  SPACING,
  Theme,
} from "@/constants/theme";
import { useTheme } from "@/hooks/useTheme";
import { useThemedStyles } from "@/hooks/useThemedStyles";

interface LanguagePickerModalProps {
  visible: boolean;
  selectedLang: string;
  onSelectLang: (lang: string) => void;
  onClose: () => void;
}

const LanguagePickerModal = ({
  visible,
  selectedLang,
  onSelectLang,
  onClose,
}: LanguagePickerModalProps) => {
  const theme = useTheme();
  const styles = useThemedStyles(makeStyles, theme);

  return (
    <Modal
      visible={visible}
      transparent={true}
      animationType="fade"
      onRequestClose={onClose}
    >
      <Pressable style={styles.modalBackdrop} onPress={onClose}>
        <Animated.View
          entering={SlideInDown.duration(250)}
          exiting={SlideOutDown.duration(200)}
          style={styles.modalContent}
        >
          <View style={styles.modalHeader}>
            <Text style={styles.modalTitle}>Select Language</Text>
            <Pressable onPress={onClose} style={styles.modalCloseButton}>
              <MaterialCommunityIcons
                name="close"
                size={ICON_SIZE.md}
                color={theme.text}
              />
            </Pressable>
          </View>

          <ScrollView
            showsVerticalScrollIndicator={true}
            contentContainerStyle={styles.modalScrollContent}
          >
            <View style={styles.modalLangGrid}>
              {LANGUAGES.map((lang) => {
                const isActive = selectedLang === lang.label;
                return (
                  <Pressable
                    key={lang.id}
                    style={[
                      styles.modalLangRow,
                      isActive && styles.modalLangRowActive,
                    ]}
                    onPress={() => {
                      onSelectLang(lang.label);
                    }}
                  >
                    <MaterialCommunityIcons
                      name={lang.icon as any}
                      size={ICON_SIZE.md + 4}
                      color={isActive ? theme.white : theme.text}
                    />
                    <Text
                      style={[
                        styles.modalLangText,
                        isActive && styles.modalLangTextActive,
                      ]}
                    >
                      {lang.label}
                    </Text>
                    {isActive && (
                      <MaterialCommunityIcons
                        name="check"
                        size={ICON_SIZE.md}
                        color={theme.white}
                        style={styles.checkIcon}
                      />
                    )}
                  </Pressable>
                );
              })}
            </View>
          </ScrollView>
        </Animated.View>
      </Pressable>
    </Modal>
  );
};

export default React.memo(LanguagePickerModal);

const makeStyles = (theme: Theme) =>
  StyleSheet.create({
    modalBackdrop: {
      flex: 1,
      backgroundColor: theme.overlay,
      justifyContent: "flex-end",
    },
    modalContent: {
      backgroundColor: theme.card,
      borderTopLeftRadius: BORDER_RADIUS.lg,
      borderTopRightRadius: BORDER_RADIUS.lg,
      paddingHorizontal: SPACING.md,
      paddingTop: SPACING.md,
      paddingBottom: SPACING.xl,
      maxHeight: "65%",
      borderColor: theme.cardBorder,
      borderTopWidth: 1,
    },
    modalHeader: {
      flexDirection: "row",
      justifyContent: "space-between",
      alignItems: "center",
      paddingBottom: SPACING.md,
      borderBottomWidth: 1,
      borderBottomColor: theme.cardBorder,
      marginBottom: SPACING.sm,
    },
    modalTitle: {
      fontSize: FONT_SIZE.lg,
      fontFamily: FONT_FAMILY.bold,
      color: theme.text,
    },
    modalCloseButton: {
      padding: SPACING.xs,
    },
    modalScrollContent: {
      paddingVertical: SPACING.xs,
    },
    modalLangGrid: {
      gap: SPACING.sm,
    },
    modalLangRow: {
      flexDirection: "row",
      alignItems: "center",
      paddingVertical: SPACING.md,
      paddingHorizontal: SPACING.md,
      borderRadius: BORDER_RADIUS.md,
      backgroundColor: theme.tagBg,
      borderWidth: 1,
      borderColor: theme.cardBorder,
    },
    modalLangRowActive: {
      backgroundColor: theme.activeTab,
      borderColor: theme.activeTab,
    },
    modalLangText: {
      fontSize: FONT_SIZE.md,
      fontFamily: FONT_FAMILY.medium,
      color: theme.text,
      marginLeft: SPACING.md,
      flex: 1,
    },
    modalLangTextActive: {
      color: theme.white,
      fontFamily: FONT_FAMILY.semibold,
    },
    checkIcon: {
      marginLeft: "auto",
    },
  });
