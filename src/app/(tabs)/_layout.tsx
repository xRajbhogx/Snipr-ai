import { Tabs } from "expo-router";
import { useTheme } from "@/hooks/useTheme";
// import { FONT_SIZE, FONT_WEIGHT, Theme } from "@/constants/theme";
import Ionicons from '@expo/vector-icons/Ionicons';

export default function RootLayout() {
  const theme = useTheme();
  return (
    <Tabs
      screenOptions={{
        headerShown: false,
        tabBarStyle: {
          backgroundColor: theme.background,
          borderTopWidth: 0,
          elevation: 0,
        },
      }}
    >
      <Tabs.Screen 
        name="home"
        options={{
          tabBarIcon: ({ color, size }) => <Ionicons name="home" size={size} color={color} />
        }}
      />
      <Tabs.Screen 
        name="profile"
        options={{
          tabBarIcon: ({ color, size }) => <Ionicons name="person" size={size} color={color} />
        }}
      />
    </Tabs>
  );
}
