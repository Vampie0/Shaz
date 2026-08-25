import { Redirect, usePathname } from "expo-router";
import { Drawer } from "expo-router/drawer";

import CustomerDrawerContent from "@/components/customer/CustomerDrawerContent";
import FullScreenLoader from "@/components/ui/FullScreenLoader";
import { useAuth } from "@/features/auth/use-auth";
import { rememberCustomerDrawerOrigin } from "@/features/customer/customer-drawer-origin";
import { useAppTheme } from "@/hooks/use-app-theme";

export default function CustomerDrawerLayout() {
  const theme = useAppTheme();
  const pathname = usePathname();
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
    <Drawer
      drawerContent={(props) => <CustomerDrawerContent {...props} />}
      screenListeners={{
        drawerItemPress: () => {
          rememberCustomerDrawerOrigin(pathname);
        },
      }}
      screenOptions={{
        headerShown: false,
        drawerStyle: {
          backgroundColor: theme.surface,
          width: 300,
        },
        sceneStyle: {
          backgroundColor: theme.background,
        },
      }}
    >
      <Drawer.Screen
        name="(tabs)"
        options={{
          title: "Dashboard",
          drawerItemStyle: { display: "none" },
        }}
      />

      <Drawer.Screen name="buy-cars" options={{ title: "Buy Cars" }} />
      <Drawer.Screen name="parts" options={{ title: "Parts" }} />
      <Drawer.Screen name="sell-my-car" options={{ title: "Sell My Car" }} />
      <Drawer.Screen name="vehicle-inspection" options={{ title: "Vehicle Inspection" }} />
      <Drawer.Screen name="mobile-services" options={{ title: "Mobile Services" }} />
      <Drawer.Screen name="about" options={{ title: "About" }} />
      <Drawer.Screen name="account" options={{ title: "Account", drawerItemStyle: { display: "none" } }} />
      <Drawer.Screen name="account-edit" options={{ title: "Edit Profile", drawerItemStyle: { display: "none" } }} />

      <Drawer.Screen
        name="book-service/[serviceId]"
        options={{
          title: "Book Service",
          drawerItemStyle: { display: "none" },
        }}
      />

      <Drawer.Screen
        name="booking/[bookingId]"
        options={{
          title: "Booking Details",
          drawerItemStyle: { display: "none" },
        }}
      />

      <Drawer.Screen
        name="inspection/[inspectionId]"
        options={{
          title: "Inspection",
          drawerItemStyle: { display: "none" },
        }}
      />

      <Drawer.Screen
        name="inspection-report/[inspectionId]"
        options={{
          title: "Inspection Report",
          drawerItemStyle: { display: "none" },
        }}
      />

      <Drawer.Screen
        name="car/[carId]"
        options={{
          title: "Car Details",
          drawerItemStyle: { display: "none" },
        }}
      />
    </Drawer>
  );
}
