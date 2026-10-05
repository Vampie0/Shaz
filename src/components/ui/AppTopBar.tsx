import { StyleSheet, Text, View } from "react-native";

import { fontSize, fontWeight, layout, spacing } from "@/constants/theme";
import { useResolvedColorScheme } from "@/features/theme/theme-preference";
import { useAppTheme } from "@/hooks/use-app-theme";

type AppTopBarProps = {
  trailingText?: string;
};

export default function AppTopBar({
  trailingText = "Field App",
}: AppTopBarProps) {
  const theme = useAppTheme();
  const colorScheme = useResolvedColorScheme();
  const isDark = colorScheme === "dark";

  return (
    <View
      style={[
        styles.bar,
        {
          backgroundColor: isDark ? theme.nav : theme.surface,
          borderBottomColor: theme.border,
        },
      ]}
    >
      <View style={styles.wordmark}>
        <Text style={[styles.wordmarkAccent, { color: theme.primary }]}>
          Shaz
        </Text>
      </View>

      <Text
        numberOfLines={1}
        style={[
          styles.trailing,
          {
            color: isDark ? theme.navMuted : theme.textSecondary,
          },
        ]}
      >
        {trailingText}
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  bar: {
    minHeight: layout.topBarHeight,
    paddingHorizontal: spacing.xl,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    gap: spacing.md,
    borderBottomWidth: StyleSheet.hairlineWidth,
  },

  wordmark: {
    flexDirection: "row",
    alignItems: "center",
  },

  wordmarkBase: {
    fontSize: fontSize.xl,
    fontWeight: fontWeight.bold,
    letterSpacing: -0.7,
  },

  wordmarkAccent: {
    fontSize: fontSize.xl,
    fontWeight: fontWeight.bold,
    letterSpacing: -0.7,
  },

  trailing: {
    flexShrink: 1,
    fontSize: fontSize.sm,
    fontWeight: fontWeight.semibold,
  },
});
