import React, { useCallback, useState } from "react";
import {
  Modal,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from "react-native";
import { useFocusEffect } from "expo-router";
import Animated, { SlideInDown, SlideOutDown } from "react-native-reanimated";
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
import { useUserPreferences, SortOrder } from "@/hooks/useUserPreferences";
import { getDashboardStats, seedDemoSnippets, deleteAllSnippets } from "@/services/db/snippets";
import { getDatabaseSize, getCacheSize, clearAppCache, formatBytes } from "@/utils/storage";
import CustomAlert, { CustomAlertButton } from "@/components/CustomAlert";
import Toast from "@/components/Toast";
import type { ThemePreference } from "@/context/ThemeContext";

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

const ProfileScreen = () => {
  const theme = useTheme();
  const globalStyles = useGlobalStyles(theme);
  const styles = makeStyles(theme);
  const { themePreference, setThemePreference } = useThemePreference();
  const { preferences, updatePreferences } = useUserPreferences();

  // Screen metrics states
  const [stats, setStats] = useState({ snippets: 0, favorites: 0 });
  const [dbSize, setDbSize] = useState(0);
  const [cacheSize, setCacheSize] = useState(0);

  // Toast state
  const [toastVisible, setToastVisible] = useState(false);
  const [toastMessage, setToastMessage] = useState("");

  // Default language modal visibility state
  const [showLangModal, setShowLangModal] = useState(false);

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

  // Load stats and storage metrics
  const loadStatsAndStorage = useCallback(() => {
    try {
      const s = getDashboardStats();
      setStats({ snippets: s.snippets, favorites: s.favorites });

      getDatabaseSize().then(setDbSize);
      getCacheSize().then(setCacheSize);
    } catch (error) {
      console.error("Failed to load profile metrics:", error);
    }
  }, []);

  // Reload data every time tab screen focuses
  useFocusEffect(
    useCallback(() => {
      loadStatsAndStorage();
    }, [loadStatsAndStorage])
  );

  const handleClearCache = async () => {
    try {
      await clearAppCache();
      const newCacheSize = await getCacheSize();
      setCacheSize(newCacheSize);
      showToast("Cache cleared successfully!");
    } catch (error) {
      console.error("Failed to clear cache:", error);
      showAlert("Error", "Failed to clear the temporary app cache.");
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
          onPress: () => {
            try {
              seedDemoSnippets();
              loadStatsAndStorage();
              showToast("Starter snippets imported!");
            } catch (error) {
              console.error("Failed to seed data:", error);
              showAlert("Error", "Could not seed starter snippets.");
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
          onPress: () => {
            try {
              deleteAllSnippets();
              loadStatsAndStorage();
              showToast("Vault reset completed!");
            } catch (error) {
              console.error("Failed to delete snippets:", error);
              showAlert("Error", "Could not clear local database storage.");
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
    } catch (e) {
      console.error("Failed to save theme preference:", e);
    }
  };

  const handleSortOrderChange = async (order: SortOrder) => {
    try {
      await updatePreferences({ sortOrder: order });
      const orderLabel = order === "newest" ? "Newest" : order === "oldest" ? "Oldest" : "A-Z";
      showToast(`Sort order set to ${orderLabel}!`);
    } catch (e) {
      console.error("Failed to save sort order preference:", e);
    }
  };

  const handleDefaultLangChange = async (lang: string) => {
    try {
      await updatePreferences({ defaultLanguage: lang });
      showToast(`Default language set to ${lang}!`);
    } catch (e) {
      console.error("Failed to save default language:", e);
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

        <Text style={styles.sectionTitle}>PREFERENCES</Text>
        <View style={styles.card}>
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

          <View style={styles.rowDivider} />

          {/* Default Sort Order */}
          <Text style={[styles.cardLabel, styles.cardLabelSpaced]}>Default Sort Order</Text>
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

          <View style={styles.rowDivider} />

          {/* Default Language Action Row */}
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
              <Text style={styles.actionText}>Default Language</Text>
            </View>
            <View style={styles.actionRight}>
              <Text style={styles.selectedLangValue}>{preferences.defaultLanguage}</Text>
              <MaterialCommunityIcons
                name="chevron-right"
                size={ICON_SIZE.md}
                color={theme.mutedText}
              />
            </View>
          </Pressable>

          {/* Default Language Modal */}
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
                  style={styles.modalContent}
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
        </View>

        {/* Storage & Maintenance Section */}
        <Text style={styles.sectionTitle}>STORAGE & MAINTENANCE</Text>
        <View style={styles.card}>
          {/* Database Size Row */}
          <View style={styles.infoRow}>
            <View style={styles.infoLeft}>
              <MaterialCommunityIcons
                name="database"
                size={ICON_SIZE.md}
                color={theme.mutedText}
              />
              <Text style={styles.infoText}>Vault Database</Text>
            </View>
            <Text style={styles.infoValue}>{formatBytes(dbSize)}</Text>
          </View>

          {/* Cache Size Row */}
          <View style={styles.infoRow}>
            <View style={styles.infoLeft}>
              <MaterialCommunityIcons
                name="folder-open-outline"
                size={ICON_SIZE.md}
                color={theme.mutedText}
              />
              <Text style={styles.infoText}>Temporary Cache</Text>
            </View>
            <Text style={styles.infoValue}>{formatBytes(cacheSize)}</Text>
          </View>

          <View style={styles.rowDivider} />

          {/* Action Row - Clear Cache */}
          <Pressable
            onPress={handleClearCache}
            style={({ pressed }) => [
              styles.actionButton,
              pressed && styles.actionButtonPressed,
            ]}
          >
            <View style={styles.actionLeft}>
              <MaterialCommunityIcons
                name="broom"
                size={ICON_SIZE.md}
                color={theme.text}
              />
              <Text style={styles.actionText}>Clear Cached Files</Text>
            </View>
            <MaterialCommunityIcons
              name="chevron-right"
              size={ICON_SIZE.md}
              color={theme.mutedText}
            />
          </Pressable>

          {/* Action Row - Seed Data */}
          <Pressable
            onPress={handleSeedData}
            style={({ pressed }) => [
              styles.actionButton,
              pressed && styles.actionButtonPressed,
            ]}
          >
            <View style={styles.actionLeft}>
              <MaterialCommunityIcons
                name="database-import-outline"
                size={ICON_SIZE.md}
                color={theme.text}
              />
              <Text style={styles.actionText}>Import Starter Snippets</Text>
            </View>
            <MaterialCommunityIcons
              name="chevron-right"
              size={ICON_SIZE.md}
              color={theme.mutedText}
            />
          </Pressable>

          {/* Action Row - Reset Database */}
          <Pressable
            onPress={handleResetDb}
            style={({ pressed }) => [
              styles.actionButton,
              pressed && styles.actionButtonPressed,
            ]}
          >
            <View style={styles.actionLeft}>
              <MaterialCommunityIcons
                name="alert-octagon-outline"
                size={ICON_SIZE.md}
                color={theme.activeTab}
              />
              <Text style={[styles.actionText, styles.destructiveText]}>
                Reset Local Vault
              </Text>
            </View>
            <MaterialCommunityIcons
              name="chevron-right"
              size={ICON_SIZE.md}
              color={theme.activeTab}
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
      </ScrollView>

      {/* Custom Alert */}
      <CustomAlert
        visible={alertConfig.visible}
        title={alertConfig.title}
        message={alertConfig.message}
        buttons={alertConfig.buttons}
        onClose={hideAlert}
      />

      {/* Custom Toast */}
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
      fontSize: FONT_SIZE.sm + 1,
      fontFamily: FONT_FAMILY.medium,
      color: theme.text,
      marginBottom: SPACING.sm,
      marginTop: SPACING.xs,
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
    cardLabelSpaced: {
      marginTop: SPACING.sm,
    },
    actionRight: {
      flexDirection: "row",
      alignItems: "center",
      gap: SPACING.xs,
    },
    selectedLangValue: {
      fontSize: FONT_SIZE.sm + 2,
      fontFamily: FONT_FAMILY.semibold,
      fontWeight: FONT_WEIGHT.semibold,
      color: theme.activeTab,
    },
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
    rowDivider: {
      height: 1,
      backgroundColor: theme.cardBorder,
      marginVertical: SPACING.xs,
    },
    actionButton: {
      flexDirection: "row",
      alignItems: "center",
      justifyContent: "space-between",
      paddingVertical: SPACING.md,
    },
    actionButtonPressed: {
      opacity: 0.6,
    },
    actionLeft: {
      flexDirection: "row",
      alignItems: "center",
      gap: SPACING.sm,
    },
    actionText: {
      fontSize: FONT_SIZE.sm + 2,
      fontFamily: FONT_FAMILY.semibold,
      fontWeight: FONT_WEIGHT.semibold,
      color: theme.text,
    },
    destructiveText: {
      color: theme.activeTab,
    },
  });
