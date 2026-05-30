import { Theme } from "@/constants/theme";
import { useMemo } from "react";

/**
 * Memoizes StyleSheet.create output so list items and heavy screens
 * do not rebuild styles on unrelated parent state updates.
 */
export function useThemedStyles<T>(
  makeStyles: (theme: Theme) => T,
  theme: Theme,
): T {
  return useMemo(() => makeStyles(theme), [theme, makeStyles]);
}
