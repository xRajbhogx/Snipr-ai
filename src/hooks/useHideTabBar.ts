import { getTabBarStyle } from "@/constants/tabBarStyle";
import { useTheme } from "@/hooks/useTheme";
import { useFocusEffect, useNavigation } from "expo-router";
import { useCallback } from "react";

export const useHideTabBar = () => {
  const navigation = useNavigation();
  const theme = useTheme();

  useFocusEffect(
    useCallback(() => {
      const tabNavigator = navigation.getParent()?.getParent();
      if (!tabNavigator) {
        return;
      }

      tabNavigator.setOptions({
        tabBarStyle: { display: "none" },
      });

      return () => {
        tabNavigator.setOptions({
          tabBarStyle: getTabBarStyle(theme),
        });
      };
    }, [navigation, theme]),
  );
};
