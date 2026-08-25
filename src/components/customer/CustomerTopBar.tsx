import { Ionicons } from "@expo/vector-icons";
import { router, useNavigation, usePathname } from "expo-router";
import { Pressable, StyleSheet, Text, View } from "react-native";

import { fontSize, fontWeight, layout, spacing } from "@/constants/theme";
import {
  isCustomerDrawerDestination,
  takeCustomerDrawerOrigin,
} from "@/features/customer/customer-drawer-origin";
import { useResolvedColorScheme } from "@/features/theme/theme-preference";
import { useAppTheme } from "@/hooks/use-app-theme";

type CustomerTopBarProps = {
  title: string;
  showBack?: boolean;
};

export default function CustomerTopBar({
  title,
  showBack = false,
}: CustomerTopBarProps) {
  const navigation = useNavigation("/(customer)") as unknown as {
    openDrawer: () => void;
  };

  const pathname = usePathname();
  const theme = useAppTheme();

  const goBack = () => {
    // 1. PRIORITY SUB-SCREEN RULE: account-edit MUST always go back to account!
    if (pathname.includes("account-edit")) {
      router.replace("/(customer)/account");
      return;
    }

    // 2. Drawer destination origin handling
    if (isCustomerDrawerDestination(pathname)) {
      const drawerOrigin = takeCustomerDrawerOrigin();
      if (drawerOrigin) {
        router.replace(drawerOrigin);
        return;
      }
    }

    // 3. Exact previous screen in stack history
    if (router.canGoBack()) {
      router.back();
      return;
    }

    // 4. Smart contextual fallbacks if stack history is cleared
    if (pathname.includes("car/")) {
      router.replace("/(customer)/buy-cars");
      return;
    }

    if (pathname.includes("book-service")) {
      router.replace("/(customer)/mobile-services");
      return;
    }

    if (pathname.includes("booking/")) {
      router.replace("/(customer)/(tabs)/bookings");
      return;
    }

    if (pathname.includes("inspection")) {
      router.replace("/(customer)/(tabs)/inspections");
      return;
    }

    if (pathname.includes("sell-my-car")) {
      router.replace("/(customer)/(tabs)/my-cars");
      return;
    }

    // Default fallback
    router.replace("/(customer)/(tabs)/overview");
  };

  const colorScheme = useResolvedColorScheme();
  const isDark = colorScheme === "dark";
  const foreground = isDark ? theme.navText : theme.text;
  const muted = isDark ? theme.navMuted : theme.textSecondary;

  const openDrawer = () => {
    navigation.openDrawer();
  };

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
        accessibilityLabel={showBack ? "Back" : "Open menu"}
        hitSlop={10}
        onPress={showBack ? goBack : openDrawer}
        style={({ pressed }) => [styles.menuButton, pressed && styles.pressed]}
      >
        <Ionicons
          name={showBack ? "arrow-back" : "menu"}
          size={26}
          color={foreground}
        />
      </Pressable>

      <View style={styles.wordmark}>
        <Text style={[styles.wordmarkBase, { color: foreground }]}>feng</Text>
        <Text style={[styles.wordmarkAccent, { color: theme.primary }]}>xing</Text>
      </View>

      <Text
        numberOfLines={1}
        style={[styles.title, { color: muted }]}
      >
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
  menuButton: {
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
