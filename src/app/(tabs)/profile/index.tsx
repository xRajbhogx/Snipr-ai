import React, { useCallback, useState, useRef } from "react";
import {
  DevSettings,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from "react-native";
import { useFocusEffect } from "expo-router";
import { MaterialCommunityIcons } from "@expo/vector-icons";

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
import { getDatabaseSize, getCacheSize, clearAppCache } from "@/utils/storage";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { reloadAppAsync } from "expo";
import CustomAlert, { CustomAlertButton } from "@/components/CustomAlert";
import Toast from "@/components/Toast";
import type { ThemePreference } from "@/context/ThemeContext";
import { closeDatabase } from "@/services/db/client";
import {
  AIProvider,
  getStoredAIProvider,
  getStoredModel,
  getStoredAPIKey,
  clearStoredAPIKey,
} from "@/services/ai/aiServices";

// Import extracted sub-components
import AppPreferencesModal from "@/components/profile/AppPreferencesModal";
import LanguageSelectorModal from "@/components/profile/LanguageSelectorModal";
import AiConfigurationModal from "@/components/profile/AiConfigurationModal";
import StorageMaintenanceModal from "@/components/profile/StorageMaintenanceModal";

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
  const [showAIModal, setShowAIModal] = useState(false);

  // AI Settings cached in parent for initializing the AI configuration modal
  const [aiProvider, setAiProvider] = useState<AIProvider>("gemini");
  const apiKeyRef = useRef("");
  const [aiModel, setAiModel] = useState("gemini-3.1-flash-lite");

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

  const showToast = useCallback((message: string) => {
    setToastMessage(message);
    setToastVisible(true);
  }, []);

  const showAlert = useCallback((
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
  }, []);

  const hideAlert = useCallback(() => {
    setAlertConfig((prev) => ({ ...prev, visible: false }));
  }, []);

  const loadAISettings = useCallback(async () => {
    try {
      const provider = await getStoredAIProvider();
      setAiProvider(provider);

      const apiKey = await getStoredAPIKey(provider);
      apiKeyRef.current = apiKey || "";

      const model = await getStoredModel(provider);
      if (model) {
        setAiModel(model);
      }
    } catch (error) {
      // Failed to load AI settings
    }
  }, []);

  const handleOpenAIModal = async () => {
    await loadAISettings();
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

  const handleClearCache = useCallback(async () => {
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
  }, [loadStatsAndStorage, showToast, showAlert]);

  const handleSeedData = useCallback(() => {
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
  }, [loadStatsAndStorage, showToast, showAlert]);

  const handleResetDb = useCallback(() => {
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
  }, [loadStatsAndStorage, showToast, showAlert]);

  const handleWipeAllAppData = useCallback(() => {
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
  }, [showAlert]);

  const handleThemeChange = useCallback(async (pref: ThemePreference) => {
    try {
      await setThemePreference(pref);
      showToast(`Theme updated to ${pref.charAt(0).toUpperCase() + pref.slice(1)}!`);
    } catch {
      // Ignore
    }
  }, [setThemePreference, showToast]);

  const handleSortOrderChange = useCallback(async (order: SortOrder) => {
    try {
      await updatePreferences({ sortOrder: order });
      const orderLabel = order === "newest" ? "Newest" : order === "oldest" ? "Oldest" : "A-Z";
      showToast(`Sort order set to ${orderLabel}!`);
    } catch {
      // Ignore
    }
  }, [updatePreferences, showToast]);

  const handleDefaultLangChange = useCallback(async (lang: string) => {
    try {
      await updatePreferences({ defaultLanguage: lang });
      showToast(`Default language set to ${lang}!`);
    } catch {
      // Ignore
    }
  }, [updatePreferences, showToast]);

  const handleOpenLanguageSelector = useCallback(() => {
    setShowPreferencesModal(false);
    // Add small delay to let the preferences modal close cleanly before opening language modal
    setTimeout(() => {
      setShowLangModal(true);
    }, 150);
  }, []);

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
                <MaterialCommunityIcons
                  name="brain"
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

      {/* Conditionally mount modals to optimize memory and performance */}
      {showPreferencesModal && (
        <AppPreferencesModal
          visible={showPreferencesModal}
          onClose={() => setShowPreferencesModal(false)}
          themePreference={themePreference}
          onThemeChange={handleThemeChange}
          sortOrder={preferences.sortOrder}
          onSortOrderChange={handleSortOrderChange}
          defaultLanguage={preferences.defaultLanguage}
          onOpenLanguageSelector={handleOpenLanguageSelector}
        />
      )}

      {showLangModal && (
        <LanguageSelectorModal
          visible={showLangModal}
          onClose={() => setShowLangModal(false)}
          defaultLanguage={preferences.defaultLanguage}
          onSelectLanguage={handleDefaultLangChange}
        />
      )}

      {showAIModal && (
        <AiConfigurationModal
          visible={showAIModal}
          onClose={() => setShowAIModal(false)}
          initialProvider={aiProvider}
          initialApiKey={apiKeyRef.current}
          initialModel={aiModel}
          showToast={showToast}
          showAlert={showAlert}
          onSaveSuccess={loadAISettings}
        />
      )}

      {showStorageModal && (
        <StorageMaintenanceModal
          visible={showStorageModal}
          onClose={() => setShowStorageModal(false)}
          dbSize={dbSize}
          cacheSize={cacheSize}
          fsStats={fsStats}
          isMaintenanceActionLoading={isMaintenanceActionLoading}
          onClearCache={handleClearCache}
          onSeedData={handleSeedData}
          onResetDb={handleResetDb}
        />
      )}

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
    destructiveText: {
      color: theme.activeTab,
    },
    rowDivider: {
      height: 1,
      backgroundColor: theme.cardBorder,
      marginVertical: 0,
    },
  });
