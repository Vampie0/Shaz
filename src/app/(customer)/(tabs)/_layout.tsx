import { Ionicons } from "@expo/vector-icons";
import { Redirect, Tabs } from "expo-router";
import type { ComponentProps } from "react";
import {
  StyleSheet,
} from "react-native";
import type {
  ColorValue,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";

import FullScreenLoader from "@/components/ui/FullScreenLoader";
import { useAuth } from "@/features/auth/use-auth";
import { useAppTheme } from "@/hooks/use-app-theme";

type IconName =
  ComponentProps<typeof Ionicons>["name"];

type CustomerRoute =
  | "overview"
  | "my-cars"
  | "garage"
  | "bookings"
  | "inspections";

const icons: Record<
  CustomerRoute,
  {
    active: IconName;
    inactive: IconName;
  }
> = {
  overview: {
    active: "grid",
    inactive: "grid-outline",
  },

  "my-cars": {
    active: "car-sport",
    inactive: "car-sport-outline",
  },

  garage: {
    active: "car",
    inactive: "car-outline",
  },

  bookings: {
    active: "calendar",
    inactive: "calendar-outline",
  },

  inspections: {
    active: "shield-checkmark",
    inactive: "shield-checkmark-outline",
  },
};

function TabIcon({
  route,
  focused,
  color,
}: {
  route: CustomerRoute;
  focused: boolean;
  color: ColorValue;
}) {
  return (
    <Ionicons
      name={
        focused
          ? icons[route].active
          : icons[route].inactive
      }
      size={21}
      color={color}
    />
  );
}

export default function CustomerTabsLayout() {
  const theme = useAppTheme();
  const insets =
    useSafeAreaInsets();

  const {
    isInitializing,
    isAuthenticated,
    profile,
  } = useAuth();

  if (isInitializing) {
    return <FullScreenLoader />;
  }

  if (
    !isAuthenticated ||
    !profile
  ) {
    return (
      <Redirect href="/login" />
    );
  }

  if (
    profile.role !==
    "customer"
  ) {
    return <Redirect href="/" />;
  }

  return (
    <Tabs
      screenOptions={{
        freezeOnBlur: true,
        detachInactiveScreens: true,
        headerShown: false,
        tabBarHideOnKeyboard: true,

        tabBarActiveTintColor:
          theme.primary,

        tabBarInactiveTintColor:
          theme.textMuted,

        sceneStyle: {
          backgroundColor:
            theme.background,
        },

        tabBarStyle: {
          position: "relative",
          height:
            58 +
            Math.max(
              insets.bottom,
              6,
            ),
          paddingTop: 6,
          paddingBottom:
            Math.max(
              insets.bottom,
              6,
            ),
          backgroundColor:
            theme.surface,
          borderTopColor:
            theme.border,
          borderTopWidth:
            StyleSheet.hairlineWidth,
          elevation: 0,
          shadowOpacity: 0,
        },

        tabBarLabelStyle: {
          marginTop: 1,
          fontSize: 9,
          lineHeight: 13,
          fontWeight: "600",
        },

        tabBarItemStyle: {
          minWidth: 0,
        },
      }}
    >
      <Tabs.Screen
        name="overview"
        options={{
          title: "Overview",
          tabBarIcon: ({
            focused,
            color,
          }) => (
            <TabIcon
              route="overview"
              focused={focused}
              color={color}
            />
          ),
        }}
      />

      <Tabs.Screen
        name="my-cars"
        options={{
          title: "My Cars",
          tabBarIcon: ({
            focused,
            color,
          }) => (
            <TabIcon
              route="my-cars"
              focused={focused}
              color={color}
            />
          ),
        }}
      />

      <Tabs.Screen
        name="garage"
        options={{
          title: "Garage",
          tabBarIcon: ({
            focused,
            color,
          }) => (
            <TabIcon
              route="garage"
              focused={focused}
              color={color}
            />
          ),
        }}
      />

      <Tabs.Screen
        name="bookings"
        options={{
          title: "Bookings",
          tabBarIcon: ({
            focused,
            color,
          }) => (
            <TabIcon
              route="bookings"
              focused={focused}
              color={color}
            />
          ),
        }}
      />

      <Tabs.Screen
        name="inspections"
        options={{
          title: "Inspections",
          tabBarIcon: ({
            focused,
            color,
          }) => (
            <TabIcon
              route="inspections"
              focused={focused}
              color={color}
            />
          ),
        }}
      />
    </Tabs>
  );
}

