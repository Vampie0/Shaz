export const colors = {
  light: {
    background: "#FFFFFF",
    surface: "#FFFFFF",
    surfaceSecondary: "#F7F4EF",
    surfaceMuted: "#F9FAFB",

    text: "#13252A",
    textSecondary: "#344054",
    textMuted: "#667085",

    primary: "#E94A3F",
    primaryPressed: "#C73830",
    primaryText: "#FFFFFF",
    primarySoft: "#FEE4E2",

    action: "#E94A3F",
    actionPressed: "#C73830",
    actionText: "#FFFFFF",

    nav: "#082A30",
    navText: "#FFFFFF",
    navMuted: "#94A3B8",

    border: "#E4E7EC",
    inputBorder: "#D0D5DD",

    success: "#15803D",
    successSoft: "#DCFCE7",
    warning: "#D97706",
    warningSoft: "#FFFBEB",
    info: "#2563EB",
    infoSoft: "#EFF6FF",
    danger: "#C73830",
    dangerSoft: "#FEF3F2",

    overlay: "rgba(8, 42, 48, 0.60)",
  },

  dark: {
    background: "#082A30",
    surface: "#0C353C",
    surfaceSecondary: "#114048",
    surfaceMuted: "#164A54",

    text: "#F8FAFC",
    textSecondary: "#B7C9CD",
    textMuted: "#8AA3A8",

    primary: "#E94A3F",
    primaryPressed: "#C73830",
    primaryText: "#FFFFFF",
    primarySoft: "#3A1B1B",

    action: "#E94A3F",
    actionPressed: "#C73830",
    actionText: "#FFFFFF",

    nav: "#082A30",
    navText: "#FFFFFF",
    navMuted: "#8AA3A8",

    border: "#1E5A66",
    inputBorder: "#2A6B78",

    success: "#10B981",
    successSoft: "#064E3B",
    warning: "#F59E0B",
    warningSoft: "#451A03",
    info: "#3B82F6",
    infoSoft: "#1E3A8A",
    danger: "#F87171",
    dangerSoft: "#451A1A",

    overlay: "rgba(8, 42, 48, 0.75)",
  },
} as const;

export const spacing = {
  xs: 4,
  sm: 8,
  md: 12,
  lg: 16,
  xl: 20,
  xxl: 24,
  xxxl: 32,
  section: 36,
} as const;

export const radius = {
  sm: 10,
  md: 14,
  lg: 18,
  xl: 22,
  pill: 999,
} as const;

export const fontSize = {
  xs: 12,
  sm: 14,
  md: 16,
  lg: 18,
  xl: 22,
  xxl: 28,
  display: 34,
} as const;

export const fontWeight = {
  regular: "400",
  medium: "500",
  semibold: "600",
  bold: "700",
} as const;

export const layout = {
  screenHorizontalPadding: 18,
  buttonHeight: 48,
  inputHeight: 48,
  maxContentWidth: 600,
  topBarHeight: 56,
} as const;
