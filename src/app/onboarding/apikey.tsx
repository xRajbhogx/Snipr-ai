import React, { useState, useRef } from "react";
import {
  StyleSheet,
  Text,
  View,
  Pressable,
  TextInput,
  ActivityIndicator,
  ScrollView,
} from "react-native";
import { router } from "expo-router";
import Animated, { FadeInDown, FadeInUp } from "react-native-reanimated";
import { MaterialCommunityIcons, AntDesign } from "@expo/vector-icons";
import {
  BORDER_RADIUS,
  FONT_FAMILY,
  FONT_SIZE,
  FONT_WEIGHT,
  ICON_SIZE,
  SHADOW,
  SPACING,
  Theme,
} from "@/constants/theme";
import { useGlobalStyles } from "@/constants/useGlobalStyles";
import { useTheme } from "@/hooks/useTheme";
import { useThemedStyles } from "@/hooks/useThemedStyles";
import { useUserPreferences } from "@/hooks/useUserPreferences";
import CustomAlert, { CustomAlertButton } from "@/components/CustomAlert";
import Toast from "@/components/Toast";
import {
  AIProvider,
  setStoredAIProvider,
  setStoredModel,
  setStoredAPIKey,
  explainCode,
} from "@/services/ai/aiServices";

const AI_PROVIDERS: { id: AIProvider; label: string; icon: string }[] = [
  { id: "gemini", label: "Gemini", icon: "google" },
  { id: "openai", label: "OpenAI", icon: "robot-outline" },
  { id: "claude", label: "Claude", icon: "brain" },
];

const PROVIDER_MODELS: Record<AIProvider, string[]> = {
  gemini: ["gemini-3.1-pro", "gemini-3.1-flash-lite", "gemini-3-flash-preview", "gemini-3-pro-preview"],
  openai: ["gpt-5.5", "gpt-5.4", "gpt-5.4-mini"],
  claude: ["claude-opus-4-8", "claude-sonnet-4-6", "claude-haiku-4-5"],
};

function AIConfigurationScreen() {
  const theme = useTheme();
  const globalStyles = useGlobalStyles(theme);
  const styles = useThemedStyles(makeStyles, theme);
  const { updatePreferences } = useUserPreferences();

  // State
  const [provider, setProvider] = useState<AIProvider>("gemini");
  const apiKeyRef = useRef("");
  const [secureTextEntry, setSecureTextEntry] = useState(true);
  const [isValidating, setIsValidating] = useState(false);
  const [toastVisible, setToastVisible] = useState(false);
  const [toastMessage, setToastMessage] = useState("");

  const handleProviderChange = (newProvider: AIProvider) => {
    setProvider(newProvider);
    apiKeyRef.current = "";
  };

  // Alert State
  const [alertConfig, setAlertConfig] = useState<{
    visible: boolean;
    title: string;
    message: string;
    buttons: CustomAlertButton[];
  }>({
    visible: false,
    title: "",
    message: "",
    buttons: [],
  });

  const showToast = (message: string) => {
    setToastMessage(message);
    setToastVisible(true);
  };

  const showAlert = (title: string, message: string, buttons: CustomAlertButton[] = []) => {
    setAlertConfig({
      visible: true,
      title,
      message,
      buttons,
    });
  };

  const hideAlert = () => {
    setAlertConfig((prev) => ({ ...prev, visible: false }));
  };

  const handleCompleteOnboarding = async () => {
    try {
      await updatePreferences({ isOnboarded: true });
      router.replace("/(tabs)/home");
    } catch (error) {
      router.replace("/(tabs)/home");
    }
  };

  const handleSkip = () => {
    showAlert(
      "Skip AI Configuration?",
      "AI-powered features like explaining code and generating docstrings will be unavailable until you configure a key in Settings. You can still manage snippets offline. Proceed?",
      [
        { text: "Go Back", style: "cancel" },
        {
          text: "Skip & Finish",
          style: "default",
          onPress: handleCompleteOnboarding,
        },
      ]
    );
  };

  const handleSaveAndComplete = async () => {
    const keyToSave = apiKeyRef.current.trim();
    if (!keyToSave) {
      handleSkip();
      return;
    }

    setIsValidating(true);
    const defaultModel = PROVIDER_MODELS[provider][0];

    try {
      // Validate key by running a test request
      const testResult = await explainCode(
        "console.log('hello')",
        "JavaScript",
        {
          provider,
          apiKey: keyToSave,
          model: defaultModel,
        }
      );

      if (testResult && testResult.trim()) {
        // Save to SecureStore and local storage
        await setStoredAIProvider(provider);
        await setStoredModel(provider, defaultModel);
        await setStoredAPIKey(provider, keyToSave);

        showToast("AI configured and saved successfully!");
        
        // Wait briefly for the toast to be seen before redirecting
        setTimeout(() => {
          handleCompleteOnboarding();
        }, 1200);
      } else {
        throw new Error("No response received from the AI provider.");
      }
    } catch (error: any) {
      const errorMessage =
        error?.message ||
        "An unknown error occurred. Please verify your API key and network connection.";
      showAlert(
        "Validation Failed",
        `We could not verify this API key. Would you like to save it anyway or skip?\n\nError: ${errorMessage}`,
        [
          { text: "Edit Key", style: "cancel" },
          {
            text: "Save Anyway",
            style: "default",
            onPress: async () => {
              try {
                await setStoredAIProvider(provider);
                await setStoredModel(provider, defaultModel);
                await setStoredAPIKey(provider, keyToSave);
                await handleCompleteOnboarding();
              } catch {
                showAlert("Error", "Failed to save configuration.");
              }
            },
          },
        ]
      );
    } finally {
      setIsValidating(false);
    }
  };

  return (
    <View style={globalStyles.screenContainer}>
      {/* Header */}
      <Animated.View entering={FadeInUp.duration(500)} style={styles.header}>
        <Pressable
          onPress={() => router.back()}
          style={styles.backButton}
          hitSlop={{ top: 15, bottom: 15, left: 15, right: 15 }}
        >
          <MaterialCommunityIcons name="arrow-left" size={ICON_SIZE.lg} color={theme.text} />
        </Pressable>
        <Text style={styles.title}>AI Companion</Text>
        <Text style={styles.subtitle}>
          (Optional) Connect an AI provider to unlock code explanations, summaries, and smart edits.
        </Text>
      </Animated.View>

      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.scrollBody}
      >
        {/* Select AI Provider */}
        <Animated.View
          entering={FadeInDown.duration(400).delay(100)}
          style={styles.section}
        >
          <Text style={styles.sectionLabel}>CHOOSE PROVIDER</Text>
          <View style={styles.providerRow}>
            {AI_PROVIDERS.map((item) => {
              const isSelected = provider === item.id;
              return (
                <Pressable
                  key={item.id}
                  onPress={() => handleProviderChange(item.id)}
                  style={({ pressed }) => [
                    styles.providerCard,
                    isSelected && styles.providerCardSelected,
                    pressed && styles.providerCardPressed,
                  ]}
                >
                  {item.id === "openai" ? (
                    <AntDesign
                      name="open-ai"
                      size={ICON_SIZE.lg}
                      color={isSelected ? theme.activeTab : theme.mutedText}
                    />
                  ) : (
                    <MaterialCommunityIcons
                      name={item.icon as any}
                      size={ICON_SIZE.lg}
                      color={isSelected ? theme.activeTab : theme.mutedText}
                    />
                  )}
                  <Text
                    style={[
                      styles.providerLabel,
                      isSelected && styles.providerLabelSelected,
                    ]}
                  >
                    {item.label}
                  </Text>
                </Pressable>
              );
            })}
          </View>
        </Animated.View>

        {/* Input API Key */}
        <Animated.View
          entering={FadeInDown.duration(400).delay(200)}
          style={styles.section}
        >
          <Text style={styles.sectionLabel}>ENTER API KEY</Text>
          <View style={styles.inputContainer}>
            <TextInput
              key={provider}
              style={styles.inputField}
              defaultValue={apiKeyRef.current}
              onChangeText={(text) => {
                apiKeyRef.current = text;
              }}
              placeholder={`Enter your ${provider.charAt(0).toUpperCase() + provider.slice(1)} API Key`}
              placeholderTextColor={theme.mutedText}
              secureTextEntry={secureTextEntry}
              autoCapitalize="none"
              autoCorrect={false}
              returnKeyType="done"
              editable={!isValidating}
            />
            <Pressable
              onPress={() => setSecureTextEntry(!secureTextEntry)}
              style={styles.eyeButton}
              hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
            >
              <MaterialCommunityIcons
                name={secureTextEntry ? "eye-off-outline" : "eye-outline"}
                size={ICON_SIZE.md}
                color={theme.mutedText}
              />
            </Pressable>
          </View>
          <Text style={styles.helpText}>
            Your key is encrypted and stored safely on this device.
          </Text>
        </Animated.View>
      </ScrollView>

      {/* Footer Actions */}
      <View style={styles.footer}>
        <View style={styles.buttonRow}>
          <Pressable
            onPress={handleSkip}
            disabled={isValidating}
            style={({ pressed }) => [
              styles.skipButton,
              pressed && styles.skipButtonPressed,
            ]}
          >
            <Text style={styles.skipButtonText}>Skip Setup</Text>
          </Pressable>

          <Pressable
            onPress={handleSaveAndComplete}
            disabled={isValidating}
            style={({ pressed }) => [
              styles.primaryButton,
              pressed && styles.primaryButtonPressed,
            ]}
          >
            {isValidating ? (
              <ActivityIndicator size="small" color={theme.white} />
            ) : (
              <>
                <Text style={styles.primaryButtonText}>Complete Setup</Text>
                <MaterialCommunityIcons
                  name="check"
                  size={ICON_SIZE.md}
                  color={theme.white}
                  style={styles.buttonIcon}
                />
              </>
            )}
          </Pressable>
        </View>
      </View>

      {/* Toast Alert */}
      <Toast
        visible={toastVisible}
        message={toastMessage}
        onHide={() => setToastVisible(false)}
      />

      {/* Custom Alert */}
      <CustomAlert
        visible={alertConfig.visible}
        title={alertConfig.title}
        message={alertConfig.message}
        buttons={alertConfig.buttons}
        onClose={hideAlert}
      />
    </View>
  );
}

export default AIConfigurationScreen;

const makeStyles = (theme: Theme) =>
  StyleSheet.create({
    header: {
      marginTop: SPACING.md,
      marginBottom: SPACING.lg,
    },
    backButton: {
      marginBottom: SPACING.md,
      alignSelf: "flex-start",
    },
    title: {
      fontSize: FONT_SIZE.xl + 2,
      fontFamily: FONT_FAMILY.bold,
      fontWeight: FONT_WEIGHT.bold,
      color: theme.text,
      marginBottom: SPACING.xs,
    },
    subtitle: {
      fontSize: FONT_SIZE.md - 1,
      fontFamily: FONT_FAMILY.regular,
      color: theme.mutedText,
      lineHeight: 20,
    },
    scrollBody: {
      flexGrow: 1,
      paddingBottom: SPACING.xl,
    },
    section: {
      marginBottom: SPACING.xl,
    },
    sectionLabel: {
      fontSize: FONT_SIZE.sm,
      fontFamily: FONT_FAMILY.semibold,
      fontWeight: FONT_WEIGHT.semibold,
      color: theme.mutedText,
      letterSpacing: 1.5,
      marginBottom: SPACING.sm,
      paddingLeft: SPACING.xs,
    },
    providerRow: {
      flexDirection: "row",
      gap: SPACING.sm,
    },
    providerCard: {
      flex: 1,
      backgroundColor: theme.card,
      borderColor: theme.cardBorder,
      borderWidth: 1,
      borderRadius: BORDER_RADIUS.md,
      paddingVertical: SPACING.md,
      alignItems: "center",
      justifyContent: "center",
      height: 90,
      ...SHADOW.sm,
    },
    providerCardSelected: {
      borderColor: theme.activeTab,
      backgroundColor: theme.activeTabSoft,
    },
    providerCardPressed: {
      opacity: 0.95,
      transform: [{ scale: 0.98 }],
    },
    providerLabel: {
      fontSize: FONT_SIZE.sm + 1,
      fontFamily: FONT_FAMILY.medium,
      fontWeight: FONT_WEIGHT.medium,
      color: theme.mutedText,
      marginTop: SPACING.sm,
    },
    providerLabelSelected: {
      color: theme.text,
      fontFamily: FONT_FAMILY.semibold,
      fontWeight: FONT_WEIGHT.semibold,
    },
    inputContainer: {
      flexDirection: "row",
      backgroundColor: theme.card,
      borderColor: theme.inputBorder,
      borderWidth: 1,
      borderRadius: BORDER_RADIUS.md,
      alignItems: "center",
      paddingHorizontal: SPACING.md,
      height: 52,
      ...SHADOW.sm,
    },
    inputField: {
      flex: 1,
      fontSize: FONT_SIZE.md - 1,
      fontFamily: FONT_FAMILY.regular,
      color: theme.text,
      paddingRight: SPACING.md,
    },
    eyeButton: {
      padding: SPACING.xs,
    },
    helpText: {
      fontSize: FONT_SIZE.sm,
      fontFamily: FONT_FAMILY.regular,
      color: theme.mutedText,
      marginTop: SPACING.sm,
      paddingLeft: SPACING.xs,
    },
    footer: {
      paddingVertical: SPACING.md,
      backgroundColor: theme.background,
    },
    buttonRow: {
      flexDirection: "row",
      gap: SPACING.md,
    },
    skipButton: {
      flex: 1,
      backgroundColor: theme.tagBg,
      borderColor: theme.cardBorder,
      borderWidth: 1,
      paddingVertical: SPACING.md,
      borderRadius: BORDER_RADIUS.md,
      justifyContent: "center",
      alignItems: "center",
      ...SHADOW.sm,
    },
    skipButtonPressed: {
      opacity: 0.9,
    },
    skipButtonText: {
      fontSize: FONT_SIZE.md - 1,
      fontFamily: FONT_FAMILY.semibold,
      fontWeight: FONT_WEIGHT.semibold,
      color: theme.text,
    },
    primaryButton: {
      flex: 2,
      flexDirection: "row",
      backgroundColor: theme.activeTab,
      paddingVertical: SPACING.md,
      borderRadius: BORDER_RADIUS.md,
      justifyContent: "center",
      alignItems: "center",
      ...SHADOW.md,
    },
    primaryButtonPressed: {
      opacity: 0.9,
      transform: [{ scale: 0.98 }],
    },
    primaryButtonText: {
      fontSize: FONT_SIZE.md - 1,
      fontFamily: FONT_FAMILY.semibold,
      fontWeight: FONT_WEIGHT.semibold,
      color: theme.white,
    },
    buttonIcon: {
      marginLeft: SPACING.xs,
    },
  });
