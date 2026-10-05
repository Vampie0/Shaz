import { Ionicons } from "@expo/vector-icons";
import { router, usePathname } from "expo-router";
import { type ComponentProps, useEffect, useRef, useState } from "react";
import {
  Animated,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";

import FengxingWheel from "@/components/ui/FengxingWheel";
import { fontSize, fontWeight, radius, spacing } from "@/constants/theme";
import { useAuth } from "@/features/auth/use-auth";
import {
  closeCustomerDrawer,
  useCustomerDrawerOpen,
} from "@/features/customer/customer-drawer";
import { useAppTheme } from "@/hooks/use-app-theme";

type IconName = ComponentProps<typeof Ionicons>["name"];

type MenuItem = {
  key: string;
  label: string;
  route: string;
  icon: IconName;
};

const menuItems: MenuItem[] = [
  {
    key: "vehicle-inspection",
    label: "Vehicle Inspection",
    route: "/(customer)/vehicle-inspection",
    icon: "shield-checkmark-outline",
  },
  {
    key: "mobile-services",
    label: "Mobile Services",
    route: "/(customer)/mobile-services",
    icon: "build-outline",
  },
  {
    key: "buy-cars",
    label: "Buy Cars",
    route: "/(customer)/buy-cars",
    icon: "sparkles-outline",
  },
  {
    key: "parts",
    label: "Parts",
    route: "/(customer)/parts",
    icon: "cog-outline",
  },
  {
    key: "sell-my-car",
    label: "Sell My Car",
    route: "/(customer)/sell-my-car",
    icon: "car-sport-outline",
  },
  {
    key: "about",
    label: "About",
    route: "/(customer)/about",
    icon: "information-circle-outline",
  },
];

const DRAWER_WIDTH = 288;

export default function CustomerSidebar() {
  const theme = useAppTheme();
  const insets = useSafeAreaInsets();
  const pathname = usePathname();
  const { profile, session } = useAuth();
  const visible = useCustomerDrawerOpen();
  const [isRendered, setIsRendered] = useState(visible);

  const name = profile?.full_name?.trim() || "Customer";
  const email = session?.user.email?.trim() || "";

  const slideAnim = useRef(new Animated.Value(-DRAWER_WIDTH)).current;
  const fadeAnim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    if (visible) {
      setIsRendered(true);
    }

    Animated.parallel([
      Animated.timing(slideAnim, {
        toValue: visible ? 0 : -DRAWER_WIDTH,
        duration: visible ? 280 : 220,
        useNativeDriver: true,
      }),
      Animated.timing(fadeAnim, {
        toValue: visible ? 1 : 0,
        duration: visible ? 240 : 180,
        useNativeDriver: true,
      }),
    ]).start(({ finished }) => {
      if (finished && !visible) {
        setIsRendered(false);
      }
    });
  }, [fadeAnim, slideAnim, visible]);

  const navigateTo = (route: string) => {
    closeCustomerDrawer();
    router.push(route as never);
  };

  if (!isRendered) {
    return null;
  }

  return (
    <View style={styles.overlay} pointerEvents="box-none">
      <Animated.View style={[styles.backdrop, { opacity: fadeAnim }]}>
        <Pressable
          style={StyleSheet.absoluteFill}
          onPress={closeCustomerDrawer}
        />
      </Animated.View>

      <Animated.View
        style={[
          styles.sidebar,
          {
            backgroundColor: theme.surface,
            paddingTop: insets.top,
            paddingBottom: insets.bottom,
            borderRightColor: theme.border,
            transform: [{ translateX: slideAnim }],
          },
        ]}
      >
        <View style={[styles.header, { borderBottomColor: theme.border }]}>
          <View style={styles.headerTop}>
            <FengxingWheel size={60} duration={12000} />
            <Pressable
              accessibilityRole="button"
              accessibilityLabel="Close menu"
              onPress={closeCustomerDrawer}
              style={({ pressed }) => [
                styles.closeButton,
                pressed && styles.pressed,
              ]}
            >
              <Ionicons name="close" size={22} color={theme.textMuted} />
            </Pressable>
          </View>

          <View style={styles.headerUser}>
            <Text
              numberOfLines={1}
              style={[styles.userName, { color: theme.text }]}
            >
              {name}
            </Text>
            {email ? (
              <Text
                numberOfLines={1}
                style={[styles.userEmail, { color: theme.textSecondary }]}
              >
                {email}
              </Text>
            ) : null}
          </View>
        </View>

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
                      fontWeight: active
                        ? fontWeight.bold
                        : fontWeight.semibold,
                    },
                  ]}
                >
                  {item.label}
                </Text>
              </Pressable>
            );
          })}
        </ScrollView>

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
            <Ionicons
              name="person-circle-outline"
              size={22}
              color={theme.primary}
            />
            <Text style={[styles.footerAccountText, { color: theme.text }]}>
              Account Settings
            </Text>
            <Ionicons
              name="chevron-forward"
              size={16}
              color={theme.textMuted}
            />
          </Pressable>
        </View>
      </Animated.View>
    </View>
  );
}

const styles = StyleSheet.create({
  overlay: {
    ...StyleSheet.absoluteFill,
    zIndex: 999,
    elevation: 999,
  },
  backdrop: {
    ...StyleSheet.absoluteFill,
    backgroundColor: "rgba(8, 42, 48, 0.38)",
  },
  sidebar: {
    width: DRAWER_WIDTH,
    height: "100%",
    maxWidth: DRAWER_WIDTH,
    borderRightWidth: StyleSheet.hairlineWidth,
    overflow: "hidden",
  },
  header: {
    paddingHorizontal: spacing.xl,
    paddingTop: spacing.xs,
    paddingBottom: spacing.xl,
    gap: spacing.md,
    borderBottomWidth: StyleSheet.hairlineWidth,
  },
  headerTop: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },
  closeButton: {
    width: 40,
    height: 40,
    borderRadius: 18,
    alignItems: "center",
    justifyContent: "center",
  },
  headerUser: {
    gap: 3,
  },
  userName: {
    fontSize: fontSize.xl,
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
