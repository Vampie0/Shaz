import NetworkStatusBanner from "@/components/system/NetworkStatusBanner";
import * as SplashScreen from "expo-splash-screen";
import { Stack } from "expo-router";
import { useEffect, useState } from "react";
import { SafeAreaProvider } from "react-native-safe-area-context";

import AnimatedSplashScreen from "@/components/system/AnimatedSplashScreen";
import AppStatusBar from "@/components/system/AppStatusBar";
import AppToastProvider from "@/components/ui/AppToastProvider";
import "@/features/theme/theme-preference";
import { useAppTheme } from "@/hooks/use-app-theme";
import AuthProvider from "@/providers/AuthProvider";
import QueryProvider from "@/providers/QueryProvider";

SplashScreen.preventAutoHideAsync().catch(() => {});

export default function RootLayout() {
  const theme = useAppTheme();

  return (
    <SafeAreaProvider>
      <AppToastProvider>
        <QueryProvider>
          <AuthProvider>
            <AppContent theme={theme} />
          </AuthProvider>
        </QueryProvider>
      </AppToastProvider>
    </SafeAreaProvider>
  );
}

function AppContent({ theme }: { theme: any }) {
  const [splashComplete, setSplashComplete] = useState(false);

  useEffect(() => {
    SplashScreen.hideAsync().catch(() => {});
  }, []);

  return (
    <>
      <AppStatusBar />
          <NetworkStatusBanner />

      <Stack
        screenOptions={{
          headerShown: false,
          animation: "none",
          contentStyle: {
            backgroundColor: theme.background,
          },
        }}
      />

      {!splashComplete ? (
        <AnimatedSplashScreen
          onFinish={() => setSplashComplete(true)}
        />
      ) : null}
    </>
  );
}
