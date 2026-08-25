import { Ionicons } from "@expo/vector-icons";
import { router, usePathname } from "expo-router";
import { Pressable, StyleSheet, Text, View } from "react-native";

import { fontSize, fontWeight, layout, spacing } from "@/constants/theme";
import { useResolvedColorScheme } from "@/features/theme/theme-preference";
import { useAppTheme } from "@/hooks/use-app-theme";

type CustomerFlowTopBarProps = {
  title: string;
};

export default function CustomerFlowTopBar({ title }: CustomerFlowTopBarProps) {
  const theme = useAppTheme();
  const pathname = usePathname();

  const goBack = () => {
    if (pathname.includes("account-edit")) {
      router.replace("/(customer)/account");
      return;
    }

    if (router.canGoBack()) {
      router.back();
      return;
    }

    if (pathname.includes("book-service")) {
      router.replace("/(customer)/mobile-services");
      return;
    }

    router.replace("/(customer)/(tabs)/overview");
  };

  const colorScheme = useResolvedColorScheme();
  const isDark = colorScheme === "dark";
  const foreground = isDark ? theme.navText : theme.text;
  const muted = isDark ? theme.navMuted : theme.textSecondary;

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
      <Pressable
        accessibilityRole="button"
        accessibilityLabel="Back"
        hitSlop={10}
        onPress={goBack}
        style={({ pressed }) => [styles.backButton, pressed && styles.pressed]}
      >
        <Ionicons name="arrow-back" size={26} color={foreground} />
      </Pressable>

      <View style={styles.wordmark}>
        <Text style={[styles.wordmarkBase, { color: foreground }]}>feng</Text>
        <Text style={[styles.wordmarkAccent, { color: theme.primary }]}>xing</Text>
      </View>

      <Text numberOfLines={1} style={[styles.title, { color: muted }]}>
        {title}
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  bar: {
    minHeight: layout.topBarHeight,
    paddingHorizontal: spacing.lg,
    flexDirection: "row",
    alignItems: "center",
    gap: spacing.md,
    borderBottomWidth: StyleSheet.hairlineWidth,
  },
  backButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    alignItems: "center",
    justifyContent: "center",
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
  title: {
    flex: 1,
    textAlign: "right",
    fontSize: fontSize.sm,
    fontWeight: fontWeight.semibold,
  },
  pressed: {
    opacity: 0.58,
  },
});
