import { useAppTheme } from "@/hooks/use-app-theme";
import { Ionicons } from "@expo/vector-icons";
import { Redirect, Tabs } from "expo-router";
import type { ComponentProps } from "react";
import type { ColorValue } from "react-native";
import { StyleSheet } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";

import FullScreenLoader from "@/components/ui/FullScreenLoader";
import { useAuth } from "@/features/auth/use-auth";
import InspectorNotificationManager from "@/features/notifications/InspectorNotificationManager";
import PushRegistrationManager from "@/features/notifications/PushRegistrationManager";

type IconName = ComponentProps<typeof Ionicons>["name"];

const icons: Record<
  "today" | "jobs" | "history" | "account",
  { active: IconName; inactive: IconName }
> = {
  today: {
    active: "today",
    inactive: "today-outline",
  },
  jobs: {
    active: "briefcase",
    inactive: "briefcase-outline",
  },
  history: {
    active: "time",
    inactive: "time-outline",
  },
  account: {
    active: "person",
    inactive: "person-outline",
  },
};

function TabIcon({
  route,
  focused,
  color,
}: {
  route: keyof typeof icons;
  focused: boolean;
  color: ColorValue;
}) {
  return (
    <Ionicons
      name={focused ? icons[route].active : icons[route].inactive}
      size={22}
      color={color}
    />
  );
}

export default function InspectorTabsLayout() {
  const theme = useAppTheme();
  const insets = useSafeAreaInsets();
  const { isInitializing, isAuthenticated, profile } = useAuth();

  if (isInitializing) {
    return <FullScreenLoader />;
  }

  if (!isAuthenticated || !profile) {
    return <Redirect href="/login" />;
  }

  if (profile.role !== "inspector") {
    return <Redirect href="/" />;
  }

  return (
    <>
      <InspectorNotificationManager />
      <PushRegistrationManager />

      <Tabs
        screenOptions={{
          headerShown: false,
          tabBarHideOnKeyboard: true,

          tabBarActiveTintColor: theme.primary,
          tabBarInactiveTintColor: theme.textMuted,

          sceneStyle: {
            backgroundColor: theme.background,
          },

          tabBarStyle: {
            position: "relative",
            height: 58 + Math.max(insets.bottom, 6),
            paddingTop: 6,
            paddingBottom: Math.max(insets.bottom, 6),
            backgroundColor: theme.surface,
            borderTopColor: theme.border,
            borderTopWidth: StyleSheet.hairlineWidth,
            elevation: 0,
            shadowOpacity: 0,
          },

          tabBarLabelStyle: {
            marginTop: 1,
            fontSize: 10,
            lineHeight: 14,
            fontWeight: "600",
          },
        }}
      >
        <Tabs.Screen
          name="today"
          options={{
            title: "Today",
            tabBarIcon: ({ focused, color }) => (
              <TabIcon route="today" focused={focused} color={color} />
            ),
          }}
        />

        <Tabs.Screen
          name="jobs"
          options={{
            title: "Jobs",
            tabBarIcon: ({ focused, color }) => (
              <TabIcon route="jobs" focused={focused} color={color} />
            ),
          }}
        />

        <Tabs.Screen
          name="history"
          options={{
            title: "History",
            tabBarIcon: ({ focused, color }) => (
              <TabIcon route="history" focused={focused} color={color} />
            ),
          }}
        />

        <Tabs.Screen
          name="account"
          options={{
            title: "Account",
            tabBarIcon: ({ focused, color }) => (
              <TabIcon route="account" focused={focused} color={color} />
            ),
          }}
        />
      </Tabs>
    </>
  );
}
