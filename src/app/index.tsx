import { Redirect } from "expo-router";
import { useUserPreferences } from "@/hooks/useUserPreferences";
import { ActivityIndicator, View, StyleSheet } from "react-native";
import { useTheme } from "@/hooks/useTheme";

function Index() {
  const { preferences, isLoading } = useUserPreferences();
  const theme = useTheme();

  if (isLoading) {
    return (
      <View style={[styles.container, { backgroundColor: theme.background }]}>
        <ActivityIndicator size="large" color={theme.activeTab} />
      </View>
    );
  }

  if (!preferences.isOnboarded) {
    return <Redirect href={"/onboarding" as any} />;
  }

  return <Redirect href="/(tabs)/home" />;
}

export default Index;

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
  },
});

