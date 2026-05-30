export const COLORS = {
  light: {
    background: "#fffcfc",
    text: "#000000",
    textBorder: "#000000",
    activeTab: "#ff4d4dff",
    inactiveTab: "#a3a3a3",
    activeTabSoft: "rgba(255,77,77,0.12)",
    card: "#ffffff",
    cardBorder: "#eeeeee",
    mutedText: "#5f5f5f",
    inputBorder: "#cccccc",
    tagBg: "#f0f0f0",
    favorite: "#F59E0B",
    success: "#22C55E",
    successSoft: "rgba(34, 197, 94, 0.15)",
    codeBg: "rgba(255, 255, 255, 1)",
    codeText: "#ff0000ff",
    white: "#FFFFFF",
    snippetDescriptionBg: "#e6e6e6ff",
    overlay: "#fffcfc",
    fileIcon: "#F5A623",
    scanGreen: "#7ED321",
    aiIcon: "#a855f7",
    aiIconSoft: "rgba(104, 85, 247, 0.12)",
  },
  dark: {
    background: "#1c1c1c",
    text: "#FFFFFF",
    textBorder: "#FFFFFF",
    activeTab: "#ff4d4d",
    inactiveTab: "#8a8a8a",
    activeTabSoft: "rgba(255,77,77,0.16)",
    card: "#242424",
    cardBorder: "#2f2f2f",
    mutedText: "#b5b5b5",
    inputBorder: "#3d3127",
    tagBg: "#262626",
    favorite: "#F59E0B",
    success: "#22C55E",
    successSoft: "rgba(34, 197, 94, 0.15)",
    codeBg: "#1E1E1E",
    codeText: "#fffb00ff",
    white: "#FFFFFF",
    snippetDescriptionBg: "#1e1e1eff",
    overlay: "#1c1c1c",
    fileIcon: "#F5A623",
    scanGreen: "#7ED321",
    aiIcon: "#1aff00ff",
    aiIconSoft: "rgba(129, 255, 127, 0.2)",
  },
};
export type Theme = typeof COLORS.light;
export type ColorScheme = keyof typeof COLORS;

export const FONT_SIZE = {
  sm: 12,
  md: 16,
  lg: 20,
  xl: 24,
  xxl: 28,
  xxxl: 32,
};

export const SPACING = {
  xs: 4,
  sm: 8,
  md: 16,
  lg: 24,
  xl: 32,
  xxl: 48,
  xxxl: 64,
};

export const BORDER_RADIUS = {
  sm: 6,
  md: 12,
  lg: 18,
  xl: 24,
  full: 9999,
};

export const FONT_WEIGHT = {
  light: "300",
  normal: "400",
  medium: "500",
  semibold: "600",
  bold: "700",
  extrabold: "800",
} as const;

export const FONT_FAMILY = {
  regular: "Inter-Regular",
  medium: "Inter-Medium",
  semibold: "Inter-SemiBold",
  bold: "Inter-Bold",
  extrabold: "Inter-ExtraBold",
};

export const ICON_SIZE = {
  xs: 14,
  sm: 16,
  md: 20,
  lg: 24,
  xl: 32,
};

export const SHADOW = {
  sm: {
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.08,
    shadowRadius: 2,
    elevation: 2,
  },
  md: {
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.12,
    shadowRadius: 8,
    elevation: 5,
  },
  lg: {
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.16,
    shadowRadius: 16,
    elevation: 10,
  },
};
