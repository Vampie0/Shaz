import NetworkStatusBanner from "@/components/system/NetworkStatusBanner";
import { Stack } from "expo-router";
import * as SplashScreen from "expo-splash-screen";
import { useEffect, useState } from "react";
import { Dimensions, StyleSheet, View } from "react-native";
import { useSharedValue, withTiming } from "react-native-reanimated";
import { SafeAreaProvider } from "react-native-safe-area-context";

import AnimatedSplashScreen from "@/components/system/AnimatedSplashScreen";
import AppStatusBar from "@/components/system/AppStatusBar";
import AppToastProvider from "@/components/ui/AppToastProvider";
import DottedSurface from "@/components/ui/DottedSurface";
import { useAuth } from "@/features/auth/use-auth";
import "@/features/theme/theme-preference";
import { useAppTheme } from "@/hooks/use-app-theme";
import AuthProvider from "@/providers/AuthProvider";
import QueryProvider from "@/providers/QueryProvider";

SplashScreen.preventAutoHideAsync().catch(() => {});

const { width: windowWidth, height: windowHeight } = Dimensions.get("window");

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

function AppContent({ theme }: { theme: ReturnType<typeof useAppTheme> }) {
  const { isInitializing } = useAuth();
  const [splashComplete, setSplashComplete] = useState(false);
  const panX = useSharedValue(0);
  const panY = useSharedValue(0);

  useEffect(() => {
    if (!isInitializing) {
      SplashScreen.hideAsync().catch(() => {});
    }
  }, [isInitializing]);

  return (
    <View
      style={[styles.shell, { backgroundColor: theme.background }]}
      onTouchMove={(event) => {
        const { pageX, pageY } = event.nativeEvent;
        panX.value = withTiming((pageX / windowWidth - 0.5) * 24, {
          duration: 180,
        });
        panY.value = withTiming((pageY / windowHeight - 0.5) * 24, {
          duration: 180,
        });
      }}
      onTouchEnd={() => {
        panX.value = withTiming(0, { duration: 420 });
        panY.value = withTiming(0, { duration: 420 });
      }}
    >
      <DottedSurface
        size={8}
        opacity={0.8}
        sizeAttenuation
        vertexColors
        panX={panX}
        panY={panY}
      />
      <AppStatusBar />
      <NetworkStatusBanner />
      <Stack
        screenOptions={{
          headerShown: false,
          animation: "none",
          contentStyle: { backgroundColor: "transparent" },
        }}
      />
      {!splashComplete ? (
        <AnimatedSplashScreen
          onFinish={() => {
            if (!isInitializing) setSplashComplete(true);
          }}
        />
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  shell: {
    flex: 1,
  },
});

// import NetworkStatusBanner from "@/components/system/NetworkStatusBanner";
// import { Stack } from "expo-router";
// import * as SplashScreen from "expo-splash-screen";
// import { useEffect, useState } from "react";
// import { SafeAreaProvider } from "react-native-safe-area-context";

// import AnimatedSplashScreen from "@/components/system/AnimatedSplashScreen";
// import AppStatusBar from "@/components/system/AppStatusBar";
// import AppToastProvider from "@/components/ui/AppToastProvider";
// import { useAuth } from "@/features/auth/use-auth";
// import "@/features/theme/theme-preference";
// import { useAppTheme } from "@/hooks/use-app-theme";
// import AuthProvider from "@/providers/AuthProvider";
// import QueryProvider from "@/providers/QueryProvider";

// SplashScreen.preventAutoHideAsync().catch(() => {});

// export default function RootLayout() {
//   const theme = useAppTheme();

//   return (
//     <SafeAreaProvider>
//       <AppToastProvider>
//         <QueryProvider>
//           <AuthProvider>
//             <AppContent theme={theme} />
//           </AuthProvider>
//         </QueryProvider>
//       </AppToastProvider>
//     </SafeAreaProvider>
//   );
// }

// function AppContent({ theme }: { theme: any }) {
//   const { isInitializing } = useAuth(); // Auth status check karen
//   const [splashComplete, setSplashComplete] = useState(false);

//   useEffect(() => {
//     // Sirf tab splash khatam karen jab Auth initialize ho chuka ho
//     if (!isInitializing) {
//       SplashScreen.hideAsync().catch(() => {});
//     }
//   }, [isInitializing]);

//   return (
//     <>
//       <AppStatusBar />
//       <NetworkStatusBanner />
//       <Stack
//         screenOptions={{
//           headerShown: false,
//           animation: "none",
//           contentStyle: { backgroundColor: theme.background },
//         }}
//       />

//       {!splashComplete ? (
//         <AnimatedSplashScreen
//           // Splash tab khatam hoga jab animation puri ho aur isInitializing false ho
//           onFinish={() => {
//             if (!isInitializing) setSplashComplete(true);
//           }}
//         />
//       ) : null}
//     </>
//   );
// }
