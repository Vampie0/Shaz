import { useAppTheme } from "@/hooks/use-app-theme";
import { Ionicons } from "@expo/vector-icons";
import { Redirect, Tabs } from "expo-router";
import { StyleSheet } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";

import { useAuth } from "@/features/auth/use-auth";
import InspectorNotificationManager from "@/features/notifications/InspectorNotificationManager";
import PushRegistrationManager from "@/features/notifications/PushRegistrationManager";

export default function InspectorTabsLayout() {
  const theme = useAppTheme();
  const insets = useSafeAreaInsets();
  const { isInitializing, isAuthenticated, profile } = useAuth();

  if (isInitializing) return null;
  if (!isAuthenticated || !profile) return <Redirect href="/login" />;
  if (profile.role !== "inspector") return <Redirect href="/" />;

  return (
    <>
      <InspectorNotificationManager />
      <PushRegistrationManager />

      <Tabs
        // PERFORMANCE FIX: detachInactiveScreens yahan Navigator level par aati hai
        detachInactiveScreens={true}
        screenOptions={{
          // Is se background tabs ki processing ruk jati hai (Smoothness ke liye)
          freezeOnBlur: true,

          headerShown: false,
          tabBarHideOnKeyboard: true,

          tabBarActiveTintColor: theme.primary,
          tabBarInactiveTintColor: theme.textMuted,
          sceneStyle: { backgroundColor: "transparent" },

          tabBarStyle: {
            position: "relative",
            height: 60 + insets.bottom,
            paddingTop: 8,
            paddingBottom: insets.bottom > 0 ? insets.bottom : 8,
            backgroundColor: theme.surface,
            borderTopColor: theme.border,
            borderTopWidth: StyleSheet.hairlineWidth,
            elevation: 0,
            shadowOpacity: 0,
          },
          tabBarLabelStyle: {
            marginTop: 2,
            fontSize: 10,
            fontWeight: "600",
          },
        }}
      >
        <Tabs.Screen
          name="today"
          options={{
            title: "Today",
            tabBarIcon: ({ focused, color }) => (
              <Ionicons
                name={focused ? "today" : "today-outline"}
                size={22}
                color={color}
              />
            ),
          }}
        />
        <Tabs.Screen
          name="jobs"
          options={{
            title: "Jobs",
            tabBarIcon: ({ focused, color }) => (
              <Ionicons
                name={focused ? "briefcase" : "briefcase-outline"}
                size={22}
                color={color}
              />
            ),
          }}
        />
        <Tabs.Screen
          name="history"
          options={{
            title: "History",
            tabBarIcon: ({ focused, color }) => (
              <Ionicons
                name={focused ? "time" : "time-outline"}
                size={22}
                color={color}
              />
            ),
          }}
        />
        <Tabs.Screen
          name="account"
          options={{
            title: "Account",
            tabBarIcon: ({ focused, color }) => (
              <Ionicons
                name={focused ? "person" : "person-outline"}
                size={22}
                color={color}
              />
            ),
          }}
        />
      </Tabs>
    </>
  );
}
