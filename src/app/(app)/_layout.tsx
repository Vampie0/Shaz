import { Redirect, Stack } from "expo-router";

import FullScreenLoader from "@/components/ui/FullScreenLoader";
import { useAuth } from "@/features/auth/use-auth";
import { useAppTheme } from "@/hooks/use-app-theme";

export default function AppLayout() {
  const theme = useAppTheme();
  const {
    isInitializing,
    isAuthenticated,
    profile,
  } = useAuth();

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
    <Stack
      screenOptions={{
        headerShown: false,
        contentStyle: {
          backgroundColor: theme.background,
        },
      }}
    />
  );
}
