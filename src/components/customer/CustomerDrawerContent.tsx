import { Ionicons } from "@expo/vector-icons";
import { router, usePathname } from "expo-router";
import type { ComponentProps } from "react";
import { Pressable, ScrollView, StyleSheet, Text, View } from "react-native";

import FengxingWheel from "@/components/ui/FengxingWheel";
import { fontSize, fontWeight, radius, spacing } from "@/constants/theme";
import { useAuth } from "@/features/auth/use-auth";
import { useAppTheme } from "@/hooks/use-app-theme";

type IconName = ComponentProps<typeof Ionicons>["name"];

type MenuItem = {
  key: string;
  label: string;
  route: string;
  icon: IconName;
};

// CLEAN MENU LIST (REMOVED DUPLICATE ACCOUNT ITEM)
const menuItems: MenuItem[] = [
  { key: "buy-cars", label: "Buy Cars", route: "/(customer)/buy-cars", icon: "sparkles-outline" },
  { key: "parts", label: "Parts", route: "/(customer)/parts", icon: "cog-outline" },
  { key: "sell-my-car", label: "Sell My Car", route: "/(customer)/sell-my-car", icon: "car-sport-outline" },
  { key: "vehicle-inspection", label: "Vehicle Inspection", route: "/(customer)/vehicle-inspection", icon: "shield-checkmark-outline" },
  { key: "mobile-services", label: "Mobile Services", route: "/(customer)/mobile-services", icon: "build-outline" },
  { key: "about", label: "About", route: "/(customer)/about", icon: "information-circle-outline" },
];

export default function CustomerDrawerContent(props: any) {
  const theme = useAppTheme();
  const pathname = usePathname();
  const { profile, session } = useAuth();

  const name = profile?.full_name?.trim() || "Customer";
  const email = session?.user.email?.trim() || "";

  const navigateTo = (route: string) => {
    if (props.navigation?.closeDrawer) {
      props.navigation.closeDrawer();
    }
    router.push(route as any);
  };

  return (
    <View style={[styles.container, { backgroundColor: theme.surface }]}>
      {/* DRAWER HEADER (REMOVED RED CUSTOMER BADGE) */}
      <View style={[styles.header, { backgroundColor: theme.surface, borderBottomColor: theme.border }]}>
        <View style={styles.headerTop}>
          <FengxingWheel size={42} duration={12000} />
        </View>

        <View style={styles.headerUser}>
          <Text numberOfLines={1} style={[styles.userName, { color: theme.text }]}>
            {name}
          </Text>
          {email ? (
            <Text numberOfLines={1} style={[styles.userEmail, { color: theme.textSecondary }]}>
              {email}
            </Text>
          ) : null}
        </View>
      </View>

      {/* MENU ITEMS */}
      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.menuList}
      >
        {menuItems.map((item) => {
          const active = pathname.includes(item.key);
          return (
            <Pressable
              key={item.key}
              accessibilityRole="button"
              onPress={() => navigateTo(item.route)}
              style={({ pressed }) => [
                styles.menuItem,
                {
                  backgroundColor: active ? theme.primarySoft : "transparent",
                },
                pressed && styles.pressed,
              ]}
            >
              <Ionicons
                name={item.icon}
                size={22}
                color={active ? theme.primary : theme.textSecondary}
              />
              <Text
                style={[
                  styles.menuItemText,
                  {
                    color: active ? theme.primary : theme.text,
                    fontWeight: active ? fontWeight.bold : fontWeight.semibold,
                  },
                ]}
              >
                {item.label}
              </Text>
            </Pressable>
          );
        })}
      </ScrollView>

      {/* FOOTER */}
      <View style={[styles.footer, { borderTopColor: theme.border }]}>
        <Pressable
          accessibilityRole="button"
          onPress={() => navigateTo("/(customer)/account")}
          style={({ pressed }) => [
            styles.footerAccountButton,
            { backgroundColor: theme.surfaceSecondary },
            pressed && styles.pressed,
          ]}
        >
          <Ionicons name="person-circle-outline" size={22} color={theme.primary} />
          <Text style={[styles.footerAccountText, { color: theme.text }]}>
            Account Settings
          </Text>
          <Ionicons name="chevron-forward" size={16} color={theme.textMuted} />
        </Pressable>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  header: {
    paddingHorizontal: spacing.xl,
    paddingTop: spacing.xxl + 16,
    paddingBottom: spacing.xl,
    gap: spacing.md,
    borderBottomWidth: StyleSheet.hairlineWidth,
  },
  headerTop: {
    flexDirection: "row",
    alignItems: "center",
  },
  headerUser: {
    gap: 3,
  },
  userName: {
    fontSize: fontSize.lg,
    fontWeight: fontWeight.bold,
  },
  userEmail: {
    fontSize: fontSize.xs,
  },
  menuList: {
    paddingVertical: spacing.md,
    paddingHorizontal: spacing.md,
    gap: 4,
  },
  menuItem: {
    minHeight: 48,
    flexDirection: "row",
    alignItems: "center",
    gap: spacing.md,
    borderRadius: radius.lg,
    paddingHorizontal: spacing.lg,
  },
  menuItemText: {
    fontSize: fontSize.sm,
  },
  footer: {
    padding: spacing.lg,
    borderTopWidth: StyleSheet.hairlineWidth,
  },
  footerAccountButton: {
    minHeight: 48,
    flexDirection: "row",
    alignItems: "center",
    gap: spacing.md,
    borderRadius: radius.lg,
    paddingHorizontal: spacing.lg,
  },
  footerAccountText: {
    flex: 1,
    fontSize: fontSize.sm,
    fontWeight: fontWeight.bold,
  },
  pressed: {
    opacity: 0.65,
  },
});
