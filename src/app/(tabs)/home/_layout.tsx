import { Stack } from "expo-router";

export default function RootLayout() {
  return <Stack screenOptions={{ headerShown: false }}>
    <Stack.Screen name="index" />
    <Stack.Screen name="CreateSnippetScreen" />
    <Stack.Screen name="FavouritesScreen" />
    <Stack.Screen name="SearchScreen" />
  </Stack>;
}
