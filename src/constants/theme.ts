export const colors = {
  light: {
    background: "#F8FAFC",
    surface: "#FFFFFF",
    surfaceSecondary: "#F1F5F9",
    surfaceMuted: "#E2E8F0",

    text: "#0F172A",
    textSecondary: "#475569",
    textMuted: "#64748B",

    primary: "#D92D20",
    primaryPressed: "#B42318",
    primaryText: "#FFFFFF",
    primarySoft: "#FEF2F2",

    action: "#D92D20",
    actionPressed: "#B42318",
    actionText: "#FFFFFF",

    nav: "#0F172A",
    navText: "#FFFFFF",
    navMuted: "#94A3B8",

    border: "#E2E8F0",
    inputBorder: "#CBD5E1",

    success: "#059669",
    successSoft: "#ECFDF5",
    warning: "#D97706",
    warningSoft: "#FFFBEB",
    info: "#2563EB",
    infoSoft: "#EFF6FF",
    danger: "#D92D20",
    dangerSoft: "#FEF2F2",

    overlay: "rgba(15, 23, 42, 0.60)",
  },

  dark: {
    background: "#09131F",
    surface: "#0F2032",
    surfaceSecondary: "#162B42",
    surfaceMuted: "#1E3652",

    text: "#F8FAFC",
    textSecondary: "#94A3B8",
    textMuted: "#64748B",

    primary: "#F04438",
    primaryPressed: "#D92D20",
    primaryText: "#FFFFFF",
    primarySoft: "#3A1B1B",

    action: "#D92D20",
    actionPressed: "#B42318",
    actionText: "#FFFFFF",

    nav: "#06101B",
    navText: "#FFFFFF",
    navMuted: "#94A3B8",

    border: "#1E3652",
    inputBorder: "#2A4768",

    success: "#10B981",
    successSoft: "#064E3B",
    warning: "#F59E0B",
    warningSoft: "#451A03",
    info: "#3B82F6",
    infoSoft: "#1E3A8A",
    danger: "#F87171",
    dangerSoft: "#451A1A",

    overlay: "rgba(0, 0, 0, 0.75)",
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
