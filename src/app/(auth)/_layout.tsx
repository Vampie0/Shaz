import { Redirect, Stack } from "expo-router";

import { useAuth } from "@/features/auth/use-auth";

export default function AuthLayout() {
  const { isInitializing, isAuthenticated, profile } = useAuth();

  if (isInitializing) {
    return null;
  }

  if (isAuthenticated && profile) {
    if (profile.role === "inspector") {
      return <Redirect href="/(tabs)/today" />;
    }

    if (profile.role === "customer") {
      return <Redirect href="/(customer)/(tabs)/overview" />;
    }
  }

  return (
    <Stack
      screenOptions={{
        headerShown: false,
        contentStyle: {
          backgroundColor: "transparent",
        },
      }}
    />
  );
}

// import { Redirect, Stack } from "expo-router";

// import { useAuth } from "@/features/auth/use-auth";
// import { useAppTheme } from "@/hooks/use-app-theme";

// export default function AuthLayout() {
//   const theme = useAppTheme();
//   const { isInitializing, isAuthenticated, profile } = useAuth();

//   if (isInitializing) {
//     return null;
//   }

//   if (isAuthenticated && profile) {
//     if (profile.role === "inspector") {
//       return <Redirect href="/(tabs)/today" />;
//     }

//     if (profile.role === "customer") {
//       return <Redirect href="/(customer)/(tabs)/overview" />;
//     }
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
