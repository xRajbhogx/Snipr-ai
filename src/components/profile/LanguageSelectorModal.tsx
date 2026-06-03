import React from "react";
import {
  Modal,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from "react-native";
import Animated, { SlideInDown, SlideOutDown } from "react-native-reanimated";
import { MaterialCommunityIcons } from "@expo/vector-icons";

import {
  BORDER_RADIUS,
  FONT_FAMILY,
  FONT_SIZE,
  FONT_WEIGHT,
  ICON_SIZE,
  SPACING,
  Theme,
} from "@/constants/theme";
import { useTheme } from "@/hooks/useTheme";
import { useThemedStyles } from "@/hooks/useThemedStyles";
import { PROFILE_LANGUAGES } from "@/constants/profileConfig";

interface LanguageSelectorModalProps {
  visible: boolean;
  onClose: () => void;
  defaultLanguage: string;
  onSelectLanguage: (lang: string) => void;
}

const LanguageSelectorModal = ({
  visible,
  onClose,
  defaultLanguage,
  onSelectLanguage,
}: LanguageSelectorModalProps) => {
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
          style={styles.modalContentLang}
        >
          <View style={styles.modalHeader}>
            <Text style={styles.modalTitle}>Default Language</Text>
            <Pressable onPress={onClose} style={styles.modalCloseButton}>
              <MaterialCommunityIcons name="close" size={ICON_SIZE.md} color={theme.text} />
            </Pressable>
          </View>

          <ScrollView
            showsVerticalScrollIndicator={true}
            contentContainerStyle={styles.modalScrollContent}
          >
            <View style={styles.modalLangGrid}>
              {PROFILE_LANGUAGES.map((lang) => {
                const isActive = defaultLanguage === lang.label;
                return (
                  <Pressable
                    key={lang.id}
                    style={[styles.modalLangRow, isActive && styles.modalLangRowActive]}
                    onPress={() => {
                      onSelectLanguage(lang.label);
                      onClose();
                    }}
                  >
                    <MaterialCommunityIcons
                      name={lang.icon as any}
                      size={ICON_SIZE.md + 4}
                      color={isActive ? theme.white : theme.text}
                    />
                    <Text style={[styles.modalLangText, isActive && styles.modalLangTextActive]}>
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

export default React.memo(LanguageSelectorModal);

const makeStyles = (theme: Theme) =>
  StyleSheet.create({
    modalBackdrop: {
      flex: 1,
      backgroundColor: theme.overlay,
      justifyContent: "flex-end",
    },
    modalContentLang: {
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
      fontWeight: FONT_WEIGHT.bold,
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
      fontWeight: FONT_WEIGHT.semibold,
    },
    checkIcon: {
      marginLeft: "auto",
    },
  });
