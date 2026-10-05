import { Redirect, Stack } from "expo-router";

import CustomerSidebar from "@/components/customer/CustomerSidebar";
import FullScreenLoader from "@/components/ui/FullScreenLoader";
import { useAuth } from "@/features/auth/use-auth";

const drawerScreen = {
  animation: "slide_from_left" as const,
  animationDuration: 320,
  gestureEnabled: true,
  contentStyle: {
    backgroundColor: "transparent",
  },
};

export default function CustomerLayout() {
  const { isInitializing, isAuthenticated, profile } = useAuth();

  if (isInitializing) {
    return <FullScreenLoader />;
  }

  if (!isAuthenticated || !profile) {
    return <Redirect href="/login" />;
  }

  if (profile.role !== "customer") {
    return <Redirect href="/" />;
  }

  return (
    <>
      <Stack
        screenOptions={{
          headerShown: false,
          animation: "slide_from_right",
          animationDuration: 280,
          gestureEnabled: true,
          contentStyle: {
            backgroundColor: "transparent",
          },
        }}
      >
        <Stack.Screen
          name="(tabs)"
          options={{
            animation: "none",
          }}
        />
        <Stack.Screen name="vehicle-inspection" options={drawerScreen} />
        <Stack.Screen name="mobile-services" options={drawerScreen} />
        <Stack.Screen name="buy-cars" options={drawerScreen} />
        <Stack.Screen name="parts" options={drawerScreen} />
        <Stack.Screen name="sell-my-car" options={drawerScreen} />
        <Stack.Screen name="about" options={drawerScreen} />
        <Stack.Screen name="account" options={drawerScreen} />
      </Stack>
      <CustomerSidebar />
    </>
  );
}

// import { Redirect, Stack } from "expo-router";

// import FullScreenLoader from "@/components/ui/FullScreenLoader";
// import { useAuth } from "@/features/auth/use-auth";
// import { useAppTheme } from "@/hooks/use-app-theme";

// export default function CustomerLayout() {
//   const theme = useAppTheme();
//   const { isInitializing, isAuthenticated, profile } = useAuth();

//   if (isInitializing) {
//     return <FullScreenLoader />;
//   }

//   if (!isAuthenticated || !profile) {
//     return <Redirect href="/login" />;
//   }

//   if (profile.role !== "customer") {
//     return <Redirect href="/" />;
//   }

//   return (
//     <Stack
//       screenOptions={{
//         headerShown: false,
//         contentStyle: {
//           backgroundColor: theme.background,
//         },
//       }}
//     />
//   );
// }
