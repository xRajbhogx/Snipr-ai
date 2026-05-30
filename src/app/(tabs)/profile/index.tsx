import React, { useCallback, useState, useRef } from "react";
import {
  Modal,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
  ActivityIndicator,
  DevSettings,
  Platform,
  TextInput,
} from "react-native";
import { useFocusEffect } from "expo-router";
import Animated, { SlideInDown, SlideOutDown } from "react-native-reanimated";
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
import { useTheme, useThemePreference } from "@/hooks/useTheme";
import { useThemedStyles } from "@/hooks/useThemedStyles";
import { useUserPreferences, SortOrder } from "@/hooks/useUserPreferences";
import { getDashboardStats, seedDemoSnippets, deleteAllSnippets } from "@/services/db/snippets";
import { getStorageUsage, StorageStats, wipeFileSystem, wipeDatabaseFile } from "@/services/fileService";
import * as FileSystem from "expo-file-system/legacy";
import { getDatabaseSize, getCacheSize, clearAppCache, formatBytes } from "@/utils/storage";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { reloadAppAsync } from "expo";
import CustomAlert, { CustomAlertButton } from "@/components/CustomAlert";
import Toast from "@/components/Toast";
import type { ThemePreference } from "@/context/ThemeContext";
import { closeDatabase } from "@/services/db/client";
import {
  AIProvider,
  getStoredAIProvider,
  setStoredAIProvider,
  getStoredModel,
  setStoredModel,
  getStoredAPIKey,
  setStoredAPIKey,
  clearStoredAPIKey,
  explainCode,
} from "@/services/ai/aiServices";

const PROFILE_LANGUAGES = [
  { id: "ts", label: "TypeScript", icon: "language-typescript" },
  { id: "js", label: "JavaScript", icon: "language-javascript" },
  { id: "py", label: "Python", icon: "language-python" },
  { id: "java", label: "Java", icon: "language-java" },
  { id: "go", label: "Go", icon: "language-go" },
  { id: "kt", label: "Kotlin", icon: "language-kotlin" },
  { id: "swift", label: "Swift", icon: "language-swift" },
  { id: "cs", label: "C#", icon: "language-csharp" },
  { id: "cpp", label: "C++", icon: "language-cpp" },
  { id: "rs", label: "Rust", icon: "language-rust" },
  { id: "rb", label: "Ruby", icon: "language-ruby" },
  { id: "php", label: "PHP", icon: "language-php" },
];

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

const ProfileScreen = () => {
  const theme = useTheme();
  const globalStyles = useGlobalStyles(theme);
  const styles = useThemedStyles(makeStyles, theme);
  const { themePreference, setThemePreference } = useThemePreference();
  const { preferences, updatePreferences } = useUserPreferences();

  // Screen metrics states
  const [stats, setStats] = useState({ snippets: 0, favorites: 0 });
  const [dbSize, setDbSize] = useState(0);
  const [cacheSize, setCacheSize] = useState(0);
  const [fsStats, setFsStats] = useState<StorageStats | null>(null);

  // Modal toggles
  const [showPreferencesModal, setShowPreferencesModal] = useState(false);
  const [showStorageModal, setShowStorageModal] = useState(false);
  const [showLangModal, setShowLangModal] = useState(false);

  // AI Configuration Modal States
  const [showAIModal, setShowAIModal] = useState(false);
  const [aiProvider, setAiProvider] = useState<AIProvider>("gemini");
  const apiKeyRef = useRef("");
  const [aiModel, setAiModel] = useState("gemini-3.1-flash-lite");
  const [secureTextEntry, setSecureTextEntry] = useState(true);
  const [isTestingConnection, setIsTestingConnection] = useState(false);

  // Toast state
  const [toastVisible, setToastVisible] = useState(false);
  const [toastMessage, setToastMessage] = useState("");

  // Loading states for actions
  const [isMaintenanceActionLoading, setIsMaintenanceActionLoading] = useState(false);

  // Custom Alert configuration state
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

  const showAlert = (
    title: string,
    message: string,
    buttons: CustomAlertButton[] = []
  ) => {
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

  const loadAISettings = useCallback(async () => {
    try {
      const provider = await getStoredAIProvider();
      setAiProvider(provider);

      const apiKey = await getStoredAPIKey(provider);
      apiKeyRef.current = apiKey || "";

      const model = await getStoredModel(provider);
      if (model && PROVIDER_MODELS[provider].includes(model)) {
        setAiModel(model);
      } else {
        setAiModel(PROVIDER_MODELS[provider][0]);
      }
    } catch (error) {
      // Failed to load AI settings
    }
  }, []);

  const handleProviderChange = async (provider: AIProvider) => {
    setAiProvider(provider);
    try {
      const apiKey = await getStoredAPIKey(provider);
      apiKeyRef.current = apiKey || "";

      const model = await getStoredModel(provider);
      if (model && PROVIDER_MODELS[provider].includes(model)) {
        setAiModel(model);
      } else {
        setAiModel(PROVIDER_MODELS[provider][0]);
      }
    } catch (error) {
      // Failed to load AI settings
    }
  };

  const handleSaveAISettings = async () => {
    const keyToSave = apiKeyRef.current.trim();
    
    // If the key is empty, we just clear it from storage and save other settings (provider, model)
    if (!keyToSave) {
      try {
        await setStoredAIProvider(aiProvider);
        await setStoredModel(aiProvider, aiModel);
        await clearStoredAPIKey(aiProvider);
        showToast("AI configuration saved successfully!");
        setShowAIModal(false);
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
        setShowAIModal(false);
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
    const keyToTest = apiKeyRef.current.trim();
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

  const handleOpenAIModal = async () => {
    await loadAISettings();
    setSecureTextEntry(true);
    setShowAIModal(true);
  };

  // Load stats and storage metrics
  const loadStatsAndStorage = useCallback(async () => {
    try {
      const s = getDashboardStats();
      setStats({ snippets: s.snippets, favorites: s.favorites });

      const dSize = await getDatabaseSize();
      setDbSize(dSize);

      const cSize = await getCacheSize();
      setCacheSize(cSize);

      const fsUsage = await getStorageUsage();
      setFsStats(fsUsage);
    } catch {
      // Failed to load profile metrics
    }
  }, []);

  // Reload data every time tab screen focuses
  useFocusEffect(
    useCallback(() => {
      loadStatsAndStorage();
    }, [loadStatsAndStorage])
  );

  const handleClearCache = async () => {
    setIsMaintenanceActionLoading(true);
    try {
      await clearAppCache();
      await loadStatsAndStorage();
      showToast("Cache cleared successfully!");
    } catch {
      showAlert("Error", "Failed to clear the temporary app cache.");
    } finally {
      setIsMaintenanceActionLoading(false);
    }
  };



  const handleSeedData = () => {
    showAlert(
      "Import Starter Data",
      "This will import 4 starter code snippets into your local vault. Do you want to proceed?",
      [
        { text: "Cancel", style: "cancel" },
        {
          text: "Import",
          style: "default",
          onPress: async () => {
            setIsMaintenanceActionLoading(true);
            try {
              seedDemoSnippets();
              await loadStatsAndStorage();
              showToast("Starter snippets imported!");
            } catch {
              showAlert("Error", "Could not seed starter snippets.");
            } finally {
              setIsMaintenanceActionLoading(false);
            }
          },
        },
      ]
    );
  };

  const handleResetDb = () => {
    showAlert(
      "Reset Vault",
      "Are you absolutely sure you want to delete all snippets? This action is permanent and cannot be undone.",
      [
        { text: "Cancel", style: "cancel" },
        {
          text: "Reset Database",
          style: "destructive",
          onPress: async () => {
            setIsMaintenanceActionLoading(true);
            try {
              deleteAllSnippets();
              await loadStatsAndStorage();
              showToast("Vault reset completed!");
            } catch {
              showAlert("Error", "Could not clear local database storage.");
            } finally {
              setIsMaintenanceActionLoading(false);
            }
          },
        },
      ]
    );
  };

  const handleWipeAllAppData = () => {
    showAlert(
      "Wipe All App Data?",
      "This will permanently delete all snippets, screenshots, custom files, and app preferences. The app will then reload in a completely fresh state. This cannot be undone.",
      [
        { text: "Cancel", style: "cancel" },
        {
          text: "Wipe & Restart",
          style: "destructive",
          onPress: async () => {
            setIsMaintenanceActionLoading(true);
            try {
              // 1. Write reset pending flag file to trigger startup wipe
              const resetFileUri = `${FileSystem.documentDirectory}reset_pending`;
              await FileSystem.writeAsStringAsync(resetFileUri, 'true');

              // 2. Clear AsyncStorage immediately (so UI doesn't lag on restart)
              await AsyncStorage.clear();

              // 2.5. Delete all saved API keys securely
              try {
                await clearStoredAPIKey("gemini");
                await clearStoredAPIKey("openai");
                await clearStoredAPIKey("claude");
              } catch {
                // Ignore
              }

              // Close database explicitly to release the file lock
              try {
                closeDatabase();
              } catch {
                // Ignore
              }

              // 3. Reload the app
              if (Platform.OS === 'web') {
                window.location.reload();
              } else if (__DEV__) {
                DevSettings.reload();
              } else if (typeof globalThis !== 'undefined' && (globalThis.expo as any)?.reloadAppAsync) {
                await reloadAppAsync();
              } else {
                DevSettings.reload();
              }
            } catch {
              showAlert("Error", "An error occurred. The app will restart now.");
              setTimeout(() => {
                if (Platform.OS !== 'web') {
                  DevSettings.reload();
                } else {
                  window.location.reload();
                }
              }, 1500);
            } finally {
              setIsMaintenanceActionLoading(false);
            }
          },
        },
      ]
    );
  };

  const handleThemeChange = async (pref: ThemePreference) => {
    try {
      await setThemePreference(pref);
      showToast(`Theme updated to ${pref.charAt(0).toUpperCase() + pref.slice(1)}!`);
    } catch {
      // Ignore
    }
  };

  const handleSortOrderChange = async (order: SortOrder) => {
    try {
      await updatePreferences({ sortOrder: order });
      const orderLabel = order === "newest" ? "Newest" : order === "oldest" ? "Oldest" : "A-Z";
      showToast(`Sort order set to ${orderLabel}!`);
    } catch {
      // Ignore
    }
  };

  const handleDefaultLangChange = async (lang: string) => {
    try {
      await updatePreferences({ defaultLanguage: lang });
      showToast(`Default language set to ${lang}!`);
    } catch {
      // Ignore
    }
  };

  return (
    <View style={globalStyles.tabScreenContainer}>
      {/* Header */}
      <View style={[globalStyles.headerRow, styles.header]}>
        <Text style={styles.headerTitle}>Profile & Settings</Text>
      </View>

      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.scrollContent}
      >
        {/* Profile Card */}
        <View style={styles.profileCard}>
          <View style={styles.profileHeader}>
            <View style={styles.avatarContainer}>
              <MaterialCommunityIcons
                name="account"
                size={ICON_SIZE.xl + 8}
                color={theme.white}
              />
            </View>
            <View style={styles.profileInfo}>
              <Text style={styles.profileName}>Local Developer</Text>
              <Text style={styles.profileHandle}>@snipr_dev</Text>
              <View style={styles.badge}>
                <Text style={styles.badgeText}>Offline-First Mode</Text>
              </View>
            </View>
          </View>

          <View style={styles.statsDivider} />

          {/* Stats Row */}
          <View style={styles.statsRow}>
            <View style={styles.statBox}>
              <MaterialCommunityIcons
                name="code-tags"
                size={ICON_SIZE.md + 2}
                color={theme.activeTab}
              />
              <Text style={styles.statValue}>{stats.snippets}</Text>
              <Text style={styles.statLabel}>Total Snippets</Text>
            </View>

            <View style={styles.statDividerVertical} />

            <View style={styles.statBox}>
              <MaterialCommunityIcons
                name="star-circle"
                size={ICON_SIZE.md + 2}
                color={theme.favorite}
              />
              <Text style={styles.statValue}>{stats.favorites}</Text>
              <Text style={styles.statLabel}>Starred</Text>
            </View>
          </View>
        </View>

        {/* Minimalist Menu rows */}
        <Text style={styles.sectionTitle}>SETTINGS</Text>
        <View style={styles.card}>
          {/* App Preferences Row */}
          <Pressable
            onPress={() => setShowPreferencesModal(true)}
            style={({ pressed }) => [
              styles.menuRow,
              pressed && styles.menuRowPressed,
            ]}
          >
            <View style={styles.menuLeft}>
              <View style={[styles.menuIconBox, { backgroundColor: theme.activeTabSoft }]}>
                <MaterialCommunityIcons
                  name="cog-outline"
                  size={ICON_SIZE.md}
                  color={theme.activeTab}
                />
              </View>
              <View style={styles.menuTexts}>
                <Text style={styles.menuTitle}>App Preferences</Text>
                <Text style={styles.menuSub}>Theme, sorting, default language</Text>
              </View>
            </View>
            <MaterialCommunityIcons
              name="chevron-right"
              size={ICON_SIZE.lg}
              color={theme.mutedText}
            />
          </Pressable>

          <View style={styles.rowDivider} />

          {/* AI Configuration Row */}
          <Pressable
            onPress={handleOpenAIModal}
            style={({ pressed }) => [
              styles.menuRow,
              pressed && styles.menuRowPressed,
            ]}
          >
            <View style={styles.menuLeft}>
              <View style={[styles.menuIconBox, { backgroundColor: theme.aiIconSoft }]}>
                <AntDesign
                  name="open-ai"
                  size={ICON_SIZE.md}
                  color={theme.aiIcon}
                />
              </View>
              <View style={styles.menuTexts}>
                <Text style={styles.menuTitle}>AI Configuration</Text>
                <Text style={styles.menuSub}>Active provider, API keys, and models</Text>
              </View>
            </View>
            <MaterialCommunityIcons
              name="chevron-right"
              size={ICON_SIZE.lg}
              color={theme.mutedText}
            />
          </Pressable>

          <View style={styles.rowDivider} />

          {/* Storage Row */}
          <Pressable
            onPress={() => setShowStorageModal(true)}
            style={({ pressed }) => [
              styles.menuRow,
              pressed && styles.menuRowPressed,
            ]}
          >
            <View style={styles.menuLeft}>
              <View style={[styles.menuIconBox, { backgroundColor: "rgba(245, 166, 35, 0.15)" }]}>
                <MaterialCommunityIcons
                  name="database-outline"
                  size={ICON_SIZE.md}
                  color={theme.fileIcon}
                />
              </View>
              <View style={styles.menuTexts}>
                <Text style={styles.menuTitle}>Storage & Maintenance</Text>
                <Text style={styles.menuSub}>Database size, file vaults, cleanup</Text>
              </View>
            </View>
            <MaterialCommunityIcons
              name="chevron-right"
              size={ICON_SIZE.lg}
              color={theme.mutedText}
            />
          </Pressable>
        </View>

        {/* System Information Section */}
        <Text style={styles.sectionTitle}>SYSTEM INFORMATION</Text>
        <View style={styles.card}>
          <View style={styles.infoRow}>
            <View style={styles.infoLeft}>
              <MaterialCommunityIcons
                name="information-outline"
                size={ICON_SIZE.md}
                color={theme.mutedText}
              />
              <Text style={styles.infoText}>App Version</Text>
            </View>
            <Text style={styles.infoValue}>1.0.0 (Stable)</Text>
          </View>

          <View style={styles.infoRow}>
            <View style={styles.infoLeft}>
              <MaterialCommunityIcons
                name="database"
                size={ICON_SIZE.md}
                color={theme.mutedText}
              />
              <Text style={styles.infoText}>Storage Engine</Text>
            </View>
            <Text style={styles.infoValue}>SQLite Local DB</Text>
          </View>
        </View>

        {/* Danger Zone Section */}
        <Text style={styles.sectionTitle}>DANGER ZONE</Text>
        <View style={styles.card}>


          {/* Wipe All App Data Row */}
          <Pressable
            onPress={handleWipeAllAppData}
            style={({ pressed }) => [
              styles.menuRow,
              pressed && styles.menuRowPressed,
            ]}
          >
            <View style={styles.menuLeft}>
              <View style={[styles.menuIconBox, { backgroundColor: "rgba(255, 77, 77, 0.12)" }]}>
                <MaterialCommunityIcons
                  name="trash-can-outline"
                  size={ICON_SIZE.md}
                  color={theme.activeTab}
                />
              </View>
              <View style={styles.menuTexts}>
                <Text style={[styles.menuTitle, styles.destructiveText]}>Wipe All App Data</Text>
                <Text style={styles.menuSub}>Clear DB, files, preferences and restart</Text>
              </View>
            </View>
            <MaterialCommunityIcons
              name="chevron-right"
              size={ICON_SIZE.lg}
              color={theme.activeTab}
            />
          </Pressable>
        </View>
      </ScrollView>

      {/* ========================================== */}
      {/* AI Configuration Modal */}
      {/* ========================================== */}
      <Modal
        visible={showAIModal}
        transparent={true}
        animationType="slide"
        onRequestClose={() => setShowAIModal(false)}
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
                onPress={() => setShowAIModal(false)}
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
                  key={aiProvider}
                  style={styles.inputField}
                  defaultValue={apiKeyRef.current}
                  onChangeText={(text) => {
                    apiKeyRef.current = text;
                  }}
                  placeholder={`Enter ${aiProvider.charAt(0).toUpperCase() + aiProvider.slice(1)} API Key`}
                  placeholderTextColor={theme.mutedText}
                  secureTextEntry={secureTextEntry}
                  autoCapitalize="none"
                  autoCorrect={false}
                  returnKeyType="done"
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
                    onPress={() => setShowAIModal(false)}
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

      {/* ========================================== */}
      {/* 1. App Preferences Modal */}
      {/* ========================================== */}
      <Modal
        visible={showPreferencesModal}
        transparent={true}
        animationType="slide"
        onRequestClose={() => setShowPreferencesModal(false)}
      >
        <View style={styles.modalBackdrop}>
          <Animated.View
            entering={SlideInDown.duration(300)}
            exiting={SlideOutDown.duration(250)}
            style={styles.modalContent}
          >
            {/* Header */}
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>App Preferences</Text>
              <Pressable
                onPress={() => setShowPreferencesModal(false)}
                style={styles.modalCloseButton}
              >
                <MaterialCommunityIcons name="close" size={ICON_SIZE.lg} color={theme.text} />
              </Pressable>
            </View>

            <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.modalScrollBody}>
              {/* App Theme */}
              <Text style={styles.cardLabel}>App Theme</Text>
              <View style={styles.themeSelector}>
                {(["system", "light", "dark"] as ThemePreference[]).map((pref) => {
                  const isActive = themePreference === pref;
                  const iconMap = {
                    system: "laptop",
                    light: "weather-sunny",
                    dark: "weather-night",
                  };
                  const labelMap = {
                    system: "System",
                    light: "Light",
                    dark: "Dark",
                  };

                  return (
                    <Pressable
                      key={pref}
                      onPress={() => handleThemeChange(pref)}
                      style={({ pressed }) => [
                        styles.themeButton,
                        isActive && styles.themeButtonActive,
                        pressed && styles.themeButtonPressed,
                      ]}
                    >
                      <MaterialCommunityIcons
                        name={iconMap[pref] as any}
                        size={ICON_SIZE.md}
                        color={isActive ? theme.white : theme.mutedText}
                        style={styles.themeIcon}
                      />
                      <Text
                        style={[
                          styles.themeText,
                          isActive && styles.themeTextActive,
                        ]}
                      >
                        {labelMap[pref]}
                      </Text>
                    </Pressable>
                  );
                })}
              </View>

              <View style={styles.modalDivider} />

              {/* Default Sort Order */}
              <Text style={styles.cardLabel}>Default Sort Order</Text>
              <View style={styles.themeSelector}>
                {(["newest", "oldest", "alphabetical"] as SortOrder[]).map((order) => {
                  const isActive = preferences.sortOrder === order;
                  const iconMap = {
                    newest: "sort-clock-descending",
                    oldest: "sort-clock-ascending",
                    alphabetical: "sort-alphabetical-ascending",
                  };
                  const labelMap = {
                    newest: "Newest",
                    oldest: "Oldest",
                    alphabetical: "A-Z",
                  };

                  return (
                    <Pressable
                      key={order}
                      onPress={() => handleSortOrderChange(order)}
                      style={({ pressed }) => [
                        styles.themeButton,
                        isActive && styles.themeButtonActive,
                        pressed && styles.themeButtonPressed,
                      ]}
                    >
                      <MaterialCommunityIcons
                        name={iconMap[order] as any}
                        size={ICON_SIZE.md}
                        color={isActive ? theme.white : theme.mutedText}
                        style={styles.themeIcon}
                      />
                      <Text
                        style={[
                          styles.themeText,
                          isActive && styles.themeTextActive,
                        ]}
                      >
                        {labelMap[order]}
                      </Text>
                    </Pressable>
                  );
                })}
              </View>

              <View style={styles.modalDivider} />

              {/* Default Language Action Row */}
              <Text style={styles.cardLabel}>Default Language</Text>
              <Pressable
                onPress={() => setShowLangModal(true)}
                style={({ pressed }) => [
                  styles.actionButton,
                  pressed && styles.actionButtonPressed,
                ]}
              >
                <View style={styles.actionLeft}>
                  <MaterialCommunityIcons
                    name="code-json"
                    size={ICON_SIZE.md}
                    color={theme.text}
                  />
                  <Text style={styles.actionText}>{preferences.defaultLanguage}</Text>
                </View>
                <MaterialCommunityIcons
                  name="chevron-right"
                  size={ICON_SIZE.md}
                  color={theme.mutedText}
                />
              </Pressable>
            </ScrollView>
          </Animated.View>
        </View>
      </Modal>

      {/* Default Language Selector Modal */}
      {showLangModal && (
        <Modal
          visible={showLangModal}
          transparent={true}
          animationType="fade"
          onRequestClose={() => setShowLangModal(false)}
        >
          <Pressable
            style={styles.modalBackdrop}
            onPress={() => setShowLangModal(false)}
          >
            <Animated.View
              entering={SlideInDown.duration(250)}
              exiting={SlideOutDown.duration(200)}
              style={styles.modalContentLang}
            >
              <View style={styles.modalHeader}>
                <Text style={styles.modalTitle}>Default Language</Text>
                <Pressable onPress={() => setShowLangModal(false)} style={styles.modalCloseButton}>
                  <MaterialCommunityIcons name="close" size={ICON_SIZE.md} color={theme.text} />
                </Pressable>
              </View>

              <ScrollView
                showsVerticalScrollIndicator={true}
                contentContainerStyle={styles.modalScrollContent}
              >
                <View style={styles.modalLangGrid}>
                  {PROFILE_LANGUAGES.map((lang) => {
                    const isActive = preferences.defaultLanguage === lang.label;
                    return (
                      <Pressable
                        key={lang.id}
                        style={[styles.modalLangRow, isActive && styles.modalLangRowActive]}
                        onPress={() => {
                          handleDefaultLangChange(lang.label);
                          setShowLangModal(false);
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
      )}

      {/* ========================================== */}
      {/* 2. Storage & Vault Modal */}
      {/* ========================================== */}
      <Modal
        visible={showStorageModal}
        transparent={true}
        animationType="slide"
        onRequestClose={() => setShowStorageModal(false)}
      >
        <View style={styles.modalBackdrop}>
          <Animated.View
            entering={SlideInDown.duration(300)}
            exiting={SlideOutDown.duration(250)}
            style={styles.modalContent}
          >
            {/* Header */}
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Storage & Maintenance</Text>
              <Pressable
                onPress={() => setShowStorageModal(false)}
                style={styles.modalCloseButton}
              >
                <MaterialCommunityIcons name="close" size={ICON_SIZE.lg} color={theme.text} />
              </Pressable>
            </View>

            <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.modalScrollBody}>
              <Text style={styles.cardLabel}>Vault Breakdown</Text>
              
              {/* Database size */}
              <View style={styles.infoRow}>
                <View style={styles.infoLeft}>
                  <MaterialCommunityIcons name="database" size={ICON_SIZE.md} color={theme.mutedText} />
                  <Text style={styles.infoText}>Vault Database</Text>
                </View>
                <Text style={styles.infoValue}>{formatBytes(dbSize)}</Text>
              </View>

              {/* Cache size */}
              <View style={styles.infoRow}>
                <View style={styles.infoLeft}>
                  <MaterialCommunityIcons name="folder-open-outline" size={ICON_SIZE.md} color={theme.mutedText} />
                  <Text style={styles.infoText}>Temporary Cache</Text>
                </View>
                <Text style={styles.infoValue}>{formatBytes(cacheSize)}</Text>
              </View>

              {/* Exports folder size */}
              <View style={styles.infoRow}>
                <View style={styles.infoLeft}>
                  <MaterialCommunityIcons name="file-code-outline" size={ICON_SIZE.md} color={theme.mutedText} />
                  <Text style={styles.infoText}>Exported Code Files</Text>
                </View>
                <Text style={styles.infoValue}>{formatBytes(fsStats?.exportsSize || 0)}</Text>
              </View>

              {/* Images folder size */}
              <View style={styles.infoRow}>
                <View style={styles.infoLeft}>
                  <MaterialCommunityIcons name="image-outline" size={ICON_SIZE.md} color={theme.mutedText} />
                  <Text style={styles.infoText}>Screenshot Attachments</Text>
                </View>
                <Text style={styles.infoValue}>{formatBytes(fsStats?.imagesSize || 0)}</Text>
              </View>

              {/* Downloads folder size */}
              <View style={styles.infoRow}>
                <View style={styles.infoLeft}>
                  <MaterialCommunityIcons name="download" size={ICON_SIZE.md} color={theme.mutedText} />
                  <Text style={styles.infoText}>Downloaded Files</Text>
                </View>
                <Text style={styles.infoValue}>{formatBytes(fsStats?.downloadsSize || 0)}</Text>
              </View>



              {/* Cumulative Files Storage size */}
              <View style={[styles.infoRow, styles.totalRow]}>
                <View style={styles.infoLeft}>
                  <MaterialCommunityIcons name="chart-pie" size={ICON_SIZE.md} color={theme.text} />
                  <Text style={[styles.infoText, styles.totalText]}>Total File Vault Size</Text>
                </View>
                <Text style={[styles.infoValue, styles.totalValue]}>{formatBytes(fsStats?.totalSize || 0)}</Text>
              </View>

              <View style={styles.modalDivider} />

              <Text style={styles.cardLabel}>Maintenance Actions</Text>

              {isMaintenanceActionLoading ? (
                <View style={styles.maintenanceLoadingContainer}>
                  <ActivityIndicator size="small" color={theme.activeTab} />
                  <Text style={styles.maintenanceLoadingText}>Performing maintenance...</Text>
                </View>
              ) : (
                <View>
                  {/* Clear Cache */}
                  <Pressable
                    onPress={handleClearCache}
                    style={({ pressed }) => [
                      styles.actionButton,
                      pressed && styles.actionButtonPressed,
                    ]}
                  >
                    <View style={styles.actionLeft}>
                      <MaterialCommunityIcons name="broom" size={ICON_SIZE.md} color={theme.text} />
                      <Text style={styles.actionText}>Clear Temporary Cache</Text>
                    </View>
                    <MaterialCommunityIcons name="chevron-right" size={ICON_SIZE.md} color={theme.mutedText} />
                  </Pressable>



                  {/* Seed Demo Data */}
                  <Pressable
                    onPress={handleSeedData}
                    style={({ pressed }) => [
                      styles.actionButton,
                      pressed && styles.actionButtonPressed,
                    ]}
                  >
                    <View style={styles.actionLeft}>
                      <MaterialCommunityIcons name="database-import-outline" size={ICON_SIZE.md} color={theme.text} />
                      <Text style={styles.actionText}>Import Starter Snippets</Text>
                    </View>
                    <MaterialCommunityIcons name="chevron-right" size={ICON_SIZE.md} color={theme.mutedText} />
                  </Pressable>

                  {/* Reset Vault */}
                  <Pressable
                    onPress={handleResetDb}
                    style={({ pressed }) => [
                      styles.actionButton,
                      pressed && styles.actionButtonPressed,
                    ]}
                  >
                    <View style={styles.actionLeft}>
                      <MaterialCommunityIcons name="alert-octagon-outline" size={ICON_SIZE.md} color={theme.activeTab} />
                      <Text style={[styles.actionText, styles.destructiveText]}>Reset Vault Database</Text>
                    </View>
                    <MaterialCommunityIcons name="chevron-right" size={ICON_SIZE.md} color={theme.activeTab} />
                  </Pressable>
                </View>
              )}
            </ScrollView>
          </Animated.View>
        </View>
      </Modal>

      {/* Alerts & Toasts */}
      <CustomAlert
        visible={alertConfig.visible}
        title={alertConfig.title}
        message={alertConfig.message}
        buttons={alertConfig.buttons}
        onClose={hideAlert}
      />
      <Toast
        visible={toastVisible}
        message={toastMessage}
        onHide={() => setToastVisible(false)}
      />
    </View>
  );
};

export default ProfileScreen;

const makeStyles = (theme: Theme) =>
  StyleSheet.create({
    header: {
      paddingVertical: SPACING.md,
      marginBottom: SPACING.xs,
    },
    headerTitle: {
      fontSize: FONT_SIZE.xl,
      fontFamily: FONT_FAMILY.bold,
      fontWeight: FONT_WEIGHT.bold,
      color: theme.text,
    },
    scrollContent: {
      paddingBottom: SPACING.xxxl + SPACING.lg,
    },
    profileCard: {
      backgroundColor: theme.card,
      borderColor: theme.cardBorder,
      borderWidth: 1,
      borderRadius: BORDER_RADIUS.lg,
      padding: SPACING.lg,
      marginBottom: SPACING.lg,
      ...SHADOW.md,
    },
    profileHeader: {
      flexDirection: "row",
      alignItems: "center",
      gap: SPACING.md,
    },
    avatarContainer: {
      width: 68,
      height: 68,
      borderRadius: BORDER_RADIUS.full,
      backgroundColor: theme.activeTab,
      justifyContent: "center",
      alignItems: "center",
      ...SHADOW.sm,
    },
    profileInfo: {
      flex: 1,
    },
    profileName: {
      fontSize: FONT_SIZE.lg,
      fontFamily: FONT_FAMILY.bold,
      fontWeight: FONT_WEIGHT.bold,
      color: theme.text,
    },
    profileHandle: {
      fontSize: FONT_SIZE.sm + 1,
      fontFamily: FONT_FAMILY.medium,
      color: theme.mutedText,
      marginBottom: SPACING.xs,
    },
    badge: {
      backgroundColor: theme.activeTabSoft,
      paddingHorizontal: SPACING.sm,
      paddingVertical: 2,
      borderRadius: BORDER_RADIUS.sm,
      alignSelf: "flex-start",
    },
    badgeText: {
      color: theme.activeTab,
      fontSize: FONT_SIZE.sm - 2,
      fontFamily: FONT_FAMILY.semibold,
      fontWeight: FONT_WEIGHT.semibold,
    },
    statsDivider: {
      height: 1,
      backgroundColor: theme.cardBorder,
      marginVertical: SPACING.md,
    },
    statsRow: {
      flexDirection: "row",
      alignItems: "center",
    },
    statBox: {
      flex: 1,
      alignItems: "center",
      gap: SPACING.xs - 2,
    },
    statValue: {
      fontSize: FONT_SIZE.lg + 2,
      fontFamily: FONT_FAMILY.bold,
      fontWeight: FONT_WEIGHT.bold,
      color: theme.text,
    },
    statLabel: {
      fontSize: FONT_SIZE.sm,
      fontFamily: FONT_FAMILY.medium,
      color: theme.mutedText,
    },
    statDividerVertical: {
      width: 1,
      height: 38,
      backgroundColor: theme.cardBorder,
    },
    sectionTitle: {
      fontSize: FONT_SIZE.sm,
      fontFamily: FONT_FAMILY.semibold,
      fontWeight: FONT_WEIGHT.semibold,
      color: theme.mutedText,
      marginBottom: SPACING.sm,
      marginLeft: SPACING.xs,
      letterSpacing: 0.8,
    },
    card: {
      backgroundColor: theme.card,
      borderColor: theme.cardBorder,
      borderWidth: 1,
      borderRadius: BORDER_RADIUS.md,
      paddingVertical: SPACING.sm,
      paddingHorizontal: SPACING.md,
      marginBottom: SPACING.lg,
      ...SHADOW.sm,
    },
    cardLabel: {
      fontSize: FONT_SIZE.md - 1,
      fontFamily: FONT_FAMILY.bold,
      fontWeight: FONT_WEIGHT.bold,
      color: theme.text,
      marginBottom: SPACING.md,
      marginTop: SPACING.sm,
    },
    menuRow: {
      flexDirection: "row",
      alignItems: "center",
      justifyContent: "space-between",
      paddingVertical: SPACING.md,
    },
    menuRowPressed: {
      opacity: 0.7,
    },
    menuLeft: {
      flexDirection: "row",
      alignItems: "center",
      gap: SPACING.md,
      flex: 1,
    },
    menuIconBox: {
      width: 42,
      height: 42,
      borderRadius: BORDER_RADIUS.md,
      justifyContent: "center",
      alignItems: "center",
    },
    menuTexts: {
      flex: 1,
    },
    menuTitle: {
      fontSize: FONT_SIZE.md - 1,
      fontFamily: FONT_FAMILY.semibold,
      fontWeight: FONT_WEIGHT.semibold,
      color: theme.text,
      marginBottom: 2,
    },
    menuSub: {
      fontSize: FONT_SIZE.sm,
      fontFamily: FONT_FAMILY.regular,
      color: theme.mutedText,
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
    actionButton: {
      flexDirection: "row",
      alignItems: "center",
      justifyContent: "space-between",
      paddingVertical: SPACING.md,
      paddingHorizontal: SPACING.md,
      backgroundColor: theme.tagBg,
      borderRadius: BORDER_RADIUS.md,
      borderWidth: 1,
      borderColor: theme.cardBorder,
      marginBottom: SPACING.sm,
    },
    actionButtonPressed: {
      opacity: 0.7,
    },
    actionLeft: {
      flexDirection: "row",
      alignItems: "center",
      gap: SPACING.sm,
    },
    actionText: {
      fontSize: FONT_SIZE.md - 1,
      fontFamily: FONT_FAMILY.semibold,
      fontWeight: FONT_WEIGHT.semibold,
      color: theme.text,
    },
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
    modalScrollBody: {
      paddingBottom: SPACING.xl,
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
    infoRow: {
      flexDirection: "row",
      alignItems: "center",
      justifyContent: "space-between",
      paddingVertical: SPACING.sm + 2,
    },
    infoLeft: {
      flexDirection: "row",
      alignItems: "center",
      gap: SPACING.sm,
    },
    infoText: {
      fontSize: FONT_SIZE.sm + 2,
      fontFamily: FONT_FAMILY.medium,
      color: theme.text,
    },
    infoValue: {
      fontSize: FONT_SIZE.sm + 2,
      fontFamily: FONT_FAMILY.semibold,
      fontWeight: FONT_WEIGHT.semibold,
      color: theme.mutedText,
    },
    totalRow: {
      borderTopWidth: 1,
      borderTopColor: theme.cardBorder,
      paddingTop: SPACING.md,
      marginTop: SPACING.sm,
    },
    totalText: {
      fontFamily: FONT_FAMILY.bold,
      fontWeight: FONT_WEIGHT.bold,
      color: theme.text,
    },
    totalValue: {
      color: theme.activeTab,
      fontFamily: FONT_FAMILY.bold,
      fontWeight: FONT_WEIGHT.bold,
    },
    modalDivider: {
      height: 1,
      backgroundColor: theme.cardBorder,
      marginVertical: SPACING.md,
    },
    rowDivider: {
      height: 1,
      backgroundColor: theme.cardBorder,
      marginVertical: SPACING.xs,
    },
    destructiveText: {
      color: theme.activeTab,
    },
    maintenanceLoadingContainer: {
      flexDirection: "row",
      alignItems: "center",
      justifyContent: "center",
      paddingVertical: SPACING.xl,
      gap: SPACING.md,
    },
    maintenanceLoadingText: {
      fontSize: FONT_SIZE.sm + 1,
      fontFamily: FONT_FAMILY.medium,
      color: theme.mutedText,
    },
    inputContainer: {
      flexDirection: "row",
      alignItems: "center",
      backgroundColor: theme.tagBg,
      borderColor: theme.cardBorder,
      borderWidth: 1,
      borderRadius: BORDER_RADIUS.md,
      paddingHorizontal: SPACING.md,
      height: 52,
    },
    inputField: {
      flex: 1,
      fontSize: FONT_SIZE.md - 1,
      fontFamily: FONT_FAMILY.medium,
      color: theme.text,
      paddingVertical: 0,
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
      marginTop: SPACING.md,
    },
    testBtn: {
      flexDirection: "row",
      alignItems: "center",
      justifyContent: "center",
      paddingVertical: SPACING.md,
      borderRadius: BORDER_RADIUS.md,
      backgroundColor: theme.tagBg,
      borderWidth: 1,
      borderColor: theme.activeTab,
      height: 50,
    },
    testBtnContent: {
      flexDirection: "row",
      alignItems: "center",
      gap: SPACING.xs,
    },
    testBtnText: {
      fontSize: FONT_SIZE.md - 1,
      fontFamily: FONT_FAMILY.semibold,
      fontWeight: FONT_WEIGHT.semibold,
      color: theme.activeTab,
    },
    modalBtnRow: {
      flexDirection: "row",
      gap: SPACING.md,
    },
    cancelBtn: {
      flex: 1,
      alignItems: "center",
      justifyContent: "center",
      paddingVertical: SPACING.md,
      borderRadius: BORDER_RADIUS.md,
      backgroundColor: theme.tagBg,
      borderWidth: 1,
      borderColor: theme.cardBorder,
      height: 50,
    },
    cancelBtnText: {
      fontSize: FONT_SIZE.md - 1,
      fontFamily: FONT_FAMILY.medium,
      color: theme.mutedText,
    },
    saveBtn: {
      flex: 2,
      alignItems: "center",
      justifyContent: "center",
      paddingVertical: SPACING.md,
      borderRadius: BORDER_RADIUS.md,
      backgroundColor: theme.activeTab,
      height: 50,
    },
    saveBtnText: {
      fontSize: FONT_SIZE.md - 1,
      fontFamily: FONT_FAMILY.semibold,
      fontWeight: FONT_WEIGHT.semibold,
      color: theme.white,
    },
  });
