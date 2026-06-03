import { MaterialCommunityIcons } from "@expo/vector-icons";
import React, { useState } from "react";
import { Pressable, StyleSheet, Text, TextInput, View } from "react-native";

import {
  BORDER_RADIUS,
  FONT_FAMILY,
  FONT_SIZE,
  ICON_SIZE,
  SHADOW,
  SPACING,
  Theme,
} from "@/constants/theme";
import { useTheme } from "@/hooks/useTheme";
import { useThemedStyles } from "@/hooks/useThemedStyles";

interface TagInputSectionProps {
  tags: string[];
  onTagsChange: (newTags: string[]) => void;
}

const TagInputSection = ({ tags, onTagsChange }: TagInputSectionProps) => {
  const theme = useTheme();
  const styles = useThemedStyles(makeStyles, theme);
  const [tagInput, setTagInput] = useState("");

  const handleAddTag = () => {
    if (tagInput.trim()) {
      const newTag = tagInput.trim().toLowerCase();
      if (!tags.includes(newTag)) {
        onTagsChange([...tags, newTag]);
      }
      setTagInput("");
    }
  };

  const handleRemoveTag = (indexToRemove: number) => {
    onTagsChange(tags.filter((_, idx) => idx !== indexToRemove));
  };

  const handleTagInputChange = (text: string) => {
    if (text.endsWith(",") || text.endsWith(" ")) {
      const tagValue = text.slice(0, -1).trim().toLowerCase();
      if (tagValue) {
        if (!tags.includes(tagValue)) {
          onTagsChange([...tags, tagValue]);
        }
        setTagInput("");
      }
    } else {
      setTagInput(text);
    }
  };

  return (
    <View style={styles.section}>
      <Text style={styles.sectionHeader}>Tags</Text>
      <View style={styles.tagsContainer}>
        {tags.map((tag, index) => (
          <View key={index} style={styles.tagChip}>
            <Text style={styles.tagText}>#{tag}</Text>
            <Pressable
              onPress={() => handleRemoveTag(index)}
              style={styles.tagCloseBtn}
            >
              <MaterialCommunityIcons
                name="close"
                size={ICON_SIZE.xs}
                color={theme.text}
              />
            </Pressable>
          </View>
        ))}
        <TextInput
          style={styles.tagInput}
          value={tagInput}
          onChangeText={handleTagInputChange}
          onSubmitEditing={handleAddTag}
          placeholder={
            tags.length === 0
              ? "Add tags (space/comma separated)..."
              : "Add tag..."
          }
          placeholderTextColor={theme.mutedText}
          returnKeyType="done"
        />
      </View>
    </View>
  );
};

export default React.memo(TagInputSection);

const makeStyles = (theme: Theme) =>
  StyleSheet.create({
    section: {
      marginBottom: SPACING.xl,
    },
    sectionHeader: {
      fontSize: FONT_SIZE.lg,
      fontFamily: FONT_FAMILY.extrabold,
      color: theme.text,
      marginBottom: SPACING.sm,
      backgroundColor: theme.cardBorder,
      paddingHorizontal: SPACING.md,
      paddingVertical: SPACING.xs,
      borderRadius: BORDER_RADIUS.sm,
      alignSelf: "flex-start",
    },
    tagsContainer: {
      flexDirection: "row",
      flexWrap: "wrap",
      gap: SPACING.sm,
      marginBottom: SPACING.xl,
      alignItems: "center",
      backgroundColor: theme.card,
      borderWidth: 1,
      borderColor: theme.cardBorder,
      borderRadius: BORDER_RADIUS.md,
      padding: SPACING.md,
      ...SHADOW.sm,
    },
    tagChip: {
      backgroundColor: theme.tagBg,
      paddingLeft: SPACING.md,
      paddingRight: SPACING.sm,
      paddingVertical: SPACING.xs,
      borderRadius: BORDER_RADIUS.full,
      flexDirection: "row",
      alignItems: "center",
      gap: SPACING.sm,
    },
    tagText: {
      color: theme.text,
      fontSize: FONT_SIZE.sm,
      fontFamily: FONT_FAMILY.medium,
    },
    tagCloseBtn: {
      justifyContent: "center",
      alignItems: "center",
    },
    tagInput: {
      color: theme.text,
      fontSize: FONT_SIZE.sm,
      fontFamily: FONT_FAMILY.medium,
      minWidth: 120,
      padding: 0,
    },
  });
