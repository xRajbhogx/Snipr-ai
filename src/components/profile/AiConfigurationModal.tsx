import React, { useState, useEffect, useRef } from "react";
import {
  ActivityIndicator,
  Modal,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from "react-native";
import Animated, { SlideInDown, SlideOutDown } from "react-native-reanimated";
import { MaterialCommunityIcons, AntDesign } from "@expo/vector-icons";

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
import { CustomAlertButton } from "@/components/CustomAlert";
import { AI_PROVIDERS, PROVIDER_MODELS } from "@/constants/profileConfig";
import {
  AIProvider,
  getStoredModel,
  getStoredAPIKey,
  setStoredAIProvider,
  setStoredModel,
  setStoredAPIKey,
  clearStoredAPIKey,
  explainCode,
} from "@/services/ai/aiServices";

interface AiConfigurationModalProps {
  visible: boolean;
  onClose: () => void;
  initialProvider: AIProvider;
  initialApiKey: string;
  initialModel: string;
  showToast: (message: string) => void;
  showAlert: (title: string, message: string, buttons?: CustomAlertButton[]) => void;
  onSaveSuccess: () => void;
}

const AiConfigurationModal = ({
  visible,
  onClose,
  initialProvider,
  initialApiKey,
  initialModel,
  showToast,
  showAlert,
  onSaveSuccess,
}: AiConfigurationModalProps) => {
  const theme = useTheme();
  const styles = useThemedStyles(makeStyles, theme);

  const [aiProvider, setAiProvider] = useState<AIProvider>(initialProvider);
  const [apiKey, setApiKey] = useState<string>(initialApiKey);
  const [aiModel, setAiModel] = useState<string>(initialModel);
  
  const [secureTextEntry, setSecureTextEntry] = useState(true);
  const [isTestingConnection, setIsTestingConnection] = useState(false);

  // Sync state if props change when opening the modal
  useEffect(() => {
    if (visible) {
      setAiProvider(initialProvider);
      setApiKey(initialApiKey);
      setAiModel(initialModel);
      setSecureTextEntry(true);
      setIsTestingConnection(false);
    }
  }, [visible, initialProvider, initialApiKey, initialModel]);

  const handleProviderChange = async (provider: AIProvider) => {
    setAiProvider(provider);
    try {
      const storedKey = await getStoredAPIKey(provider);
      setApiKey(storedKey || "");

      const model = await getStoredModel(provider);
      if (model && PROVIDER_MODELS[provider].includes(model)) {
        setAiModel(model);
      } else {
        setAiModel(PROVIDER_MODELS[provider][0]);
      }
    } catch (error) {
      // Failed to load provider settings
    }
  };

  const handleSaveAISettings = async () => {
    const keyToSave = apiKey.trim();
    
    // If the key is empty, we just clear it from storage and save other settings (provider, model)
    if (!keyToSave) {
      try {
        await setStoredAIProvider(aiProvider);
        await setStoredModel(aiProvider, aiModel);
        await clearStoredAPIKey(aiProvider);
        showToast("AI configuration saved successfully!");
        onSaveSuccess();
        onClose();
      } catch {
        showAlert("Error", "Failed to save AI configuration. Please try again.");
      }
      return;
    }

    // If key is not empty, we MUST validate it first before saving!
    setIsTestingConnection(true);
    try {
      const testResult = await explainCode(
        "console.log('hello')",
        "JavaScript",
        {
          provider: aiProvider,
          apiKey: keyToSave,
          model: aiModel,
        }
      );

      if (testResult && testResult.trim()) {
        // Validation succeeded -> Save everything!
        await setStoredAIProvider(aiProvider);
        await setStoredModel(aiProvider, aiModel);
        await setStoredAPIKey(aiProvider, keyToSave);
        showToast("AI configuration saved successfully!");
        onSaveSuccess();
        onClose();
      } else {
        throw new Error("No response received from the AI provider.");
      }
    } catch (error: any) {
      // Validation failed -> Delete/clear from storage, do not save!
      try {
        await clearStoredAPIKey(aiProvider);
      } catch {
        // Ignore
      }
      const errorMessage = error?.message || "An unknown error occurred. Please verify your API key and network connection.";
      showAlert("Save Failed (Invalid Key)", `API Key is invalid and was not saved. ${errorMessage}`);
    } finally {
      setIsTestingConnection(false);
    }
  };

  const handleTestConnection = async () => {
    const keyToTest = apiKey.trim();
    if (!keyToTest) {
      showAlert(
        "Missing API Key",
        `Please enter an API Key for ${aiProvider.charAt(0).toUpperCase() + aiProvider.slice(1)} before testing.`
      );
      return;
    }

    setIsTestingConnection(true);
    try {
      const testResult = await explainCode(
        "console.log('hello')",
        "JavaScript",
        {
          provider: aiProvider,
          apiKey: keyToTest,
          model: aiModel,
        }
      );

      if (testResult && testResult.trim()) {
        await setStoredAPIKey(aiProvider, keyToTest);
        showAlert(
          "Connection Successful",
          `API Key is valid and saved!`,
          [{ text: "Awesome", style: "default" }]
        );
      } else {
        throw new Error("No response received from the AI provider.");
      }
    } catch (error: any) {
      // Validation failed -> Delete/clear from storage!
      try {
        await clearStoredAPIKey(aiProvider);
      } catch {
        // Ignore
      }
      const errorMessage = error?.message || "An unknown error occurred. Please verify your API key and network connection.";
      showAlert("Connection Failed", errorMessage);
    } finally {
      setIsTestingConnection(false);
    }
  };

  return (
    <Modal
      visible={visible}
      transparent={true}
      animationType="slide"
      onRequestClose={onClose}
    >
      <View style={styles.modalBackdrop}>
        <Animated.View
          entering={SlideInDown.duration(300)}
          exiting={SlideOutDown.duration(250)}
          style={styles.modalContent}
        >
          {/* Header */}
          <View style={styles.modalHeader}>
            <Text style={styles.modalTitle}>AI Configuration</Text>
            <Pressable
              onPress={onClose}
              disabled={isTestingConnection}
              style={styles.modalCloseButton}
            >
              <MaterialCommunityIcons name="close" size={ICON_SIZE.lg} color={theme.text} />
            </Pressable>
          </View>

          <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.modalScrollBody}>
            {/* AI Provider */}
            <Text style={styles.cardLabel}>Active AI Provider</Text>
            <View style={styles.themeSelector}>
              {AI_PROVIDERS.map((provider) => {
                const isActive = aiProvider === provider.id;
                return (
                  <Pressable
                    key={provider.id}
                    onPress={() => handleProviderChange(provider.id)}
                    disabled={isTestingConnection}
                    style={({ pressed }) => [
                      styles.themeButton,
                      isActive && styles.themeButtonActive,
                      pressed && styles.themeButtonPressed,
                    ]}
                  >
                    {provider.id === "openai" ? (
                      <AntDesign
                        name="open-ai"
                        size={ICON_SIZE.md}
                        color={isActive ? theme.white : theme.mutedText}
                        style={styles.themeIcon}
                      />
                    ) : (
                      <MaterialCommunityIcons
                        name={provider.icon as any}
                        size={ICON_SIZE.md}
                        color={isActive ? theme.white : theme.mutedText}
                        style={styles.themeIcon}
                      />
                    )}
                    <Text
                      style={[
                        styles.themeText,
                        isActive && styles.themeTextActive,
                      ]}
                    >
                      {provider.label}
                    </Text>
                  </Pressable>
                );
              })}
            </View>

            <View style={styles.modalDivider} />

            {/* API Key */}
            <Text style={styles.cardLabel}>API Key</Text>
            <View style={styles.inputContainer}>
              <TextInput
                style={styles.inputField}
                value={apiKey}
                onChangeText={setApiKey}
                placeholder={`Enter ${aiProvider.charAt(0).toUpperCase() + aiProvider.slice(1)} API Key`}
                placeholderTextColor={theme.mutedText}
                secureTextEntry={secureTextEntry}
                autoCapitalize="none"
                autoCorrect={false}
                returnKeyType="done"
                editable={!isTestingConnection}
              />
              <Pressable
                onPress={() => setSecureTextEntry(!secureTextEntry)}
                style={styles.inputIcon}
              >
                <MaterialCommunityIcons
                  name={secureTextEntry ? "eye-off-outline" : "eye-outline"}
                  size={ICON_SIZE.md}
                  color={theme.mutedText}
                />
              </Pressable>
            </View>

            <View style={styles.modalDivider} />

            {/* AI Model */}
            <Text style={styles.cardLabel}>AI Model</Text>
            <View style={styles.modelListContainer}>
              {PROVIDER_MODELS[aiProvider].map((model) => {
                const isActive = aiModel === model;
                return (
                  <Pressable
                    key={model}
                    onPress={() => setAiModel(model)}
                    disabled={isTestingConnection}
                    style={({ pressed }) => [
                      styles.modelRow,
                      isActive && styles.modelRowActive,
                      pressed && styles.themeButtonPressed,
                    ]}
                  >
                    <MaterialCommunityIcons
                      name={isActive ? "radiobox-marked" : "radiobox-blank"}
                      size={ICON_SIZE.md}
                      color={isActive ? theme.white : theme.mutedText}
                    />
                    <Text
                      style={[
                        styles.modelText,
                        isActive && styles.modelTextActive,
                      ]}
                    >
                      {model}
                    </Text>
                  </Pressable>
                );
              })}
            </View>

            <View style={styles.modalDivider} />

            {/* Action Buttons */}
            <View style={styles.modalActionGroup}>
              <Pressable
                onPress={handleTestConnection}
                disabled={isTestingConnection}
                style={({ pressed }) => [
                  styles.testBtn,
                  pressed && styles.themeButtonPressed,
                ]}
              >
                {isTestingConnection ? (
                  <ActivityIndicator size="small" color={theme.activeTab} />
                ) : (
                  <View style={styles.testBtnContent}>
                    <MaterialCommunityIcons name="api" size={ICON_SIZE.md} color={theme.activeTab} />
                    <Text style={styles.testBtnText}>Test Connection</Text>
                  </View>
                )}
              </Pressable>

              <View style={styles.modalBtnRow}>
                <Pressable
                  onPress={onClose}
                  disabled={isTestingConnection}
                  style={({ pressed }) => [
                    styles.cancelBtn,
                    isTestingConnection && { opacity: 0.6 },
                    pressed && styles.themeButtonPressed,
                  ]}
                >
                  <Text style={styles.cancelBtnText}>Cancel</Text>
                </Pressable>

                <Pressable
                  onPress={handleSaveAISettings}
                  disabled={isTestingConnection}
                  style={({ pressed }) => [
                    styles.saveBtn,
                    isTestingConnection && { opacity: 0.6 },
                    pressed && styles.themeButtonPressed,
                  ]}
                >
                  {isTestingConnection ? (
                    <ActivityIndicator size="small" color={theme.white} />
                  ) : (
                    <Text style={styles.saveBtnText}>Save Settings</Text>
                  )}
                </Pressable>
              </View>
            </View>
          </ScrollView>
        </Animated.View>
      </View>
    </Modal>
  );
};

export default React.memo(AiConfigurationModal);

const makeStyles = (theme: Theme) =>
  StyleSheet.create({
    modalBackdrop: {
      flex: 1,
      backgroundColor: theme.overlay,
      justifyContent: "flex-end",
    },
    modalContent: {
      backgroundColor: theme.background,
      borderTopLeftRadius: BORDER_RADIUS.lg,
      borderTopRightRadius: BORDER_RADIUS.lg,
      paddingHorizontal: SPACING.md,
      paddingTop: SPACING.md,
      paddingBottom: SPACING.xl,
      height: "75%",
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
    modalScrollBody: {
      paddingBottom: SPACING.xl,
    },
    cardLabel: {
      fontSize: FONT_SIZE.md - 1,
      fontFamily: FONT_FAMILY.bold,
      fontWeight: FONT_WEIGHT.bold,
      color: theme.text,
      marginBottom: SPACING.md,
      marginTop: SPACING.sm,
    },
    themeSelector: {
      flexDirection: "row",
      backgroundColor: theme.tagBg,
      borderRadius: BORDER_RADIUS.md,
      padding: SPACING.xs - 2,
      marginBottom: SPACING.xs,
      gap: 2,
    },
    themeButton: {
      flex: 1,
      flexDirection: "row",
      alignItems: "center",
      justifyContent: "center",
      paddingVertical: SPACING.sm,
      borderRadius: BORDER_RADIUS.sm,
      gap: SPACING.xs,
    },
    themeButtonActive: {
      backgroundColor: theme.activeTab,
    },
    themeButtonPressed: {
      opacity: 0.8,
    },
    themeIcon: {
      marginRight: 2,
    },
    themeText: {
      fontSize: FONT_SIZE.sm + 1,
      fontFamily: FONT_FAMILY.medium,
      fontWeight: FONT_WEIGHT.medium,
      color: theme.mutedText,
    },
    themeTextActive: {
      color: theme.white,
      fontFamily: FONT_FAMILY.semibold,
      fontWeight: FONT_WEIGHT.semibold,
    },
    modalDivider: {
      height: 1,
      backgroundColor: theme.cardBorder,
      marginVertical: SPACING.md,
    },
    inputContainer: {
      flexDirection: "row",
      alignItems: "center",
      height: 48,
      backgroundColor: theme.tagBg,
      borderRadius: BORDER_RADIUS.md,
      borderWidth: 1,
      borderColor: theme.cardBorder,
      paddingHorizontal: SPACING.md,
    },
    inputField: {
      flex: 1,
      color: theme.text,
      fontSize: FONT_SIZE.md - 1,
      fontFamily: FONT_FAMILY.regular,
      height: "100%",
    },
    inputIcon: {
      padding: SPACING.xs,
    },
    modelListContainer: {
      gap: SPACING.sm,
    },
    modelRow: {
      flexDirection: "row",
      alignItems: "center",
      paddingVertical: SPACING.md,
      paddingHorizontal: SPACING.md,
      borderRadius: BORDER_RADIUS.md,
      backgroundColor: theme.tagBg,
      borderWidth: 1,
      borderColor: theme.cardBorder,
      gap: SPACING.md,
    },
    modelRowActive: {
      backgroundColor: theme.activeTab,
      borderColor: theme.activeTab,
    },
    modelText: {
      fontSize: FONT_SIZE.md - 1,
      fontFamily: FONT_FAMILY.medium,
      color: theme.text,
    },
    modelTextActive: {
      color: theme.white,
      fontFamily: FONT_FAMILY.semibold,
      fontWeight: FONT_WEIGHT.semibold,
    },
    modalActionGroup: {
      gap: SPACING.md,
      marginTop: SPACING.xs,
    },
    testBtn: {
      height: 48,
      borderRadius: BORDER_RADIUS.md,
      borderWidth: 1,
      borderColor: theme.activeTab,
      justifyContent: "center",
      alignItems: "center",
      backgroundColor: theme.activeTabSoft,
    },
    testBtnContent: {
      flexDirection: "row",
      alignItems: "center",
      gap: SPACING.sm,
    },
    testBtnText: {
      color: theme.activeTab,
      fontSize: FONT_SIZE.md - 1,
      fontFamily: FONT_FAMILY.semibold,
      fontWeight: FONT_WEIGHT.semibold,
    },
    modalBtnRow: {
      flexDirection: "row",
      gap: SPACING.md,
    },
    cancelBtn: {
      flex: 1,
      height: 48,
      borderRadius: BORDER_RADIUS.md,
      backgroundColor: theme.tagBg,
      borderWidth: 1,
      borderColor: theme.cardBorder,
      justifyContent: "center",
      alignItems: "center",
    },
    cancelBtnText: {
      color: theme.text,
      fontSize: FONT_SIZE.md - 1,
      fontFamily: FONT_FAMILY.semibold,
      fontWeight: FONT_WEIGHT.semibold,
    },
    saveBtn: {
      flex: 1,
      height: 48,
      borderRadius: BORDER_RADIUS.md,
      backgroundColor: theme.activeTab,
      justifyContent: "center",
      alignItems: "center",
    },
    saveBtnText: {
      color: theme.white,
      fontSize: FONT_SIZE.md - 1,
      fontFamily: FONT_FAMILY.semibold,
      fontWeight: FONT_WEIGHT.semibold,
    },
  });
