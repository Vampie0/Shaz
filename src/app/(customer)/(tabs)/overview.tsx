import { Ionicons } from "@expo/vector-icons";
import { router } from "expo-router";
import { useState } from "react";
import {
  RefreshControl,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from "react-native";

import CustomerBookingCard from "@/components/customer/CustomerBookingCard";
import CustomerInspectionCard from "@/components/customer/CustomerInspectionCard";
import CustomerListState from "@/components/customer/CustomerListState";
import CustomerListingCard from "@/components/customer/CustomerListingCard";
import CustomerQuickAction from "@/components/customer/CustomerQuickAction";
import CustomerSectionHeader from "@/components/customer/CustomerSectionHeader";
import CustomerTopBar from "@/components/customer/CustomerTopBar";
import CustomerVehicleCard from "@/components/customer/CustomerVehicleCard";
import AppButton from "@/components/ui/AppButton";
import AppModal from "@/components/ui/AppModal";
import ScreenContainer from "@/components/ui/ScreenContainer";
import { fontSize, fontWeight, radius, spacing } from "@/constants/theme";
import { useAuth } from "@/features/auth/use-auth";
import { useCustomerDashboard } from "@/features/customer/use-customer-dashboard";
import { toastError, toastSuccess } from "@/features/toast/toast-store";
import { useAppTheme } from "@/hooks/use-app-theme";
import { markCarAsSold } from "@/services/customer/sell-car.service";
import type { CustomerGarageVehicle } from "@/types/customer";

export default function CustomerOverviewScreen() {
  const theme = useAppTheme();
  const { profile, session } = useAuth();

  const query = useCustomerDashboard(session?.user.id);
  const data = query.data;

  const firstName =
    profile?.full_name?.trim().split(/\s+/)[0] ||
    profile?.full_name ||
    "there";

  const [selectedSoldCarId, setSelectedSoldCarId] = useState<string | null>(null);
  const [isMarkingSold, setIsMarkingSold] = useState(false);

  const [selectedGarageVehicle, setSelectedGarageVehicle] = useState<CustomerGarageVehicle | null>(null);
  const [isRemovingVehicle, setIsRemovingVehicle] = useState(false);

  const handleMarkSold = async () => {
    if (!selectedSoldCarId || !session?.user.id) return;
    setIsMarkingSold(true);
    try {
      await markCarAsSold(selectedSoldCarId, session.user.id);

      setSelectedSoldCarId(null);
      await query.refetch();
      toastSuccess("The car has been marked as sold.", "Car marked as sold");
    } catch (err) {
      console.error("Mark sold error:", err);
      toastError("Could not mark car as sold.");
    } finally {
      setIsMarkingSold(false);
    }
  };

  const handleRemoveVehicle = async () => {
    if (!selectedGarageVehicle || !session?.user.id) return;
    setIsRemovingVehicle(true);
    try {
      const { error } = await supabase
        .from("garage_vehicles")
        .delete()
        .eq("id", selectedGarageVehicle.id)
        .eq("customer_id", session.user.id);

      if (error) throw error;

      const label = [selectedGarageVehicle.make, selectedGarageVehicle.model].filter(Boolean).join(" ") || "Vehicle";
      setSelectedGarageVehicle(null);
      await query.refetch();
      toastSuccess(`${label} has been removed from your garage.`, "Vehicle removed");
    } catch (err) {
      console.error("Remove garage vehicle error:", err);
      toastError("Could not remove vehicle.");
    } finally {
      setIsRemovingVehicle(false);
    }
  };

  const garageCount = data?.garageVehicles?.length ?? 0;
  const activeListingsList = (data?.listings ?? []).filter((car) => car.status !== "sold" && car.status !== "archived");
  const listingsCount = activeListingsList.length;
  const bookingsCount = data?.bookings?.length ?? 0;

  return (
    <ScreenContainer contentStyle={styles.screen}>
      <CustomerTopBar title="Overview" />

      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.content}
        refreshControl={
          <RefreshControl
            refreshing={query.isRefetching}
            onRefresh={() => void query.refetch()}
            tintColor={theme.primary}
            colors={[theme.primary]}
          />
        }
      >
        {/* LIGHT/SURFACE CLEAN HERO CARD MATCHING THEME */}
        <View style={[styles.heroCard, { backgroundColor: theme.surface, borderColor: theme.border }]}>
          <View style={styles.heroHeader}>
            <View style={[styles.appBadge, { backgroundColor: theme.primarySoft }]}>
              <Text style={[styles.appBadgeText, { color: theme.primary }]}>
                FENGXING ACCOUNT
              </Text>
            </View>

            <Text style={[styles.greeting, { color: theme.text }]}>
              Welcome back, {firstName} 👋
            </Text>

            <Text style={[styles.heroSub, { color: theme.textSecondary }]}>
              Your vehicles, bookings & listings at a glance.
            </Text>
          </View>

          {/* STATS SUMMARY PILLS */}
          <View style={styles.statsRow}>
            <View style={[styles.statPill, { backgroundColor: theme.surfaceSecondary, borderColor: theme.border }]}>
              <Ionicons name="car-outline" size={15} color={theme.primary} />
              <Text style={[styles.statText, { color: theme.text }]}>
                {garageCount} {garageCount === 1 ? "Vehicle" : "Vehicles"}
              </Text>
            </View>

            <View style={[styles.statPill, { backgroundColor: theme.surfaceSecondary, borderColor: theme.border }]}>
              <Ionicons name="car-sport-outline" size={15} color={theme.primary} />
              <Text style={[styles.statText, { color: theme.text }]}>
                {listingsCount} {listingsCount === 1 ? "Listing" : "Listings"}
              </Text>
            </View>

            <View style={[styles.statPill, { backgroundColor: theme.surfaceSecondary, borderColor: theme.border }]}>
              <Ionicons name="calendar-outline" size={15} color={theme.primary} />
              <Text style={[styles.statText, { color: theme.text }]}>
                {bookingsCount} {bookingsCount === 1 ? "Booking" : "Bookings"}
              </Text>
            </View>
          </View>

          {/* HERO ACTIONS */}
          <View style={styles.heroActionsRow}>
            <AppButton
              title="+ Add vehicle"
              variant="secondary"
              onPress={() => router.push("/(customer)/(tabs)/garage?openAddVehicle=true")}
            />

            <AppButton
              title="Sell a car"
              onPress={() => router.push("/(customer)/sell-my-car")}
            />
          </View>
        </View>

        {/* QUICK WIDGETS 2x2 ROW GRID */}
        <View style={styles.quickGrid}>
          <CustomerQuickAction
            icon="car-sport"
            title="Sell a car"
            subtitle="Create and manage a listing"
            accentColor={theme.primary}
            badgeBg={theme.primarySoft}
            onPress={() => router.push("/(customer)/sell-my-car")}
          />

          <CustomerQuickAction
            icon="build"
            title="Book a service"
            subtitle="Mobile car care at your location"
            accentColor={theme.info}
            badgeBg={theme.infoSoft}
            onPress={() => router.push("/(customer)/mobile-services")}
          />

          <CustomerQuickAction
            icon="shield-checkmark"
            title="Request inspection"
            subtitle="Arrange a vehicle inspection"
            accentColor={theme.success}
            badgeBg={theme.successSoft}
            onPress={() => router.push("/(customer)/vehicle-inspection")}
          />

          <CustomerQuickAction
            icon="sparkles"
            title="Browse cars"
            subtitle="Search the marketplace"
            accentColor="#8B5CF6"
            badgeBg="#F3E8FF"
            onPress={() => router.push("/(customer)/buy-cars")}
          />
        </View>

        {query.isLoading || query.isError ? (
          <CustomerListState
            loading={query.isLoading}
            error={query.isError}
            empty={false}
            emptyTitle=""
            emptyMessage=""
            onRetry={() => void query.refetch()}
          />
        ) : (
          <>
            <View style={styles.section}>
              <CustomerSectionHeader
                title="My Garage"
                subtitle="Your saved vehicle hub."
                actionLabel="View all"
                onAction={() => router.push("/(customer)/(tabs)/garage")}
              />

              {data && data.garageVehicles.length > 0 ? (
                <CustomerVehicleCard
                  vehicle={data.garageVehicles[0]}
                  onBookService={() => router.push("/(customer)/mobile-services")}
                  onCompatibleParts={() => router.push("/(customer)/parts")}
                  onMore={() => setSelectedGarageVehicle(data.garageVehicles[0])}
                />
              ) : (
                <CustomerListState
                  empty
                  emptyTitle="No garage vehicles yet"
                  emptyMessage="Vehicles you add to your garage will appear here."
                />
              )}
            </View>

            <View style={styles.section}>
              <CustomerSectionHeader
                title="My listings"
                subtitle="Cars you have listed on Fengxing."
                actionLabel="View all"
                onAction={() => router.push("/(customer)/(tabs)/my-cars")}
              />

              {data && activeListingsList.length > 0 ? (
                <CustomerListingCard
                  car={activeListingsList[0]}
                  onView={() =>
                    router.push({
                      pathname: "/(customer)/car/[carId]",
                      params: { carId: data.listings[0].id },
                    })
                  }
                  onEdit={() =>
                    router.push({
                      pathname: "/(customer)/sell-my-car",
                      params: { editCarId: data.listings[0].id },
                    })
                  }
                  onMore={() => setSelectedSoldCarId(data.listings[0].id)}
                />
              ) : (
                <CustomerListState
                  empty
                  emptyTitle="No listings yet"
                  emptyMessage="Cars you list on Fengxing will appear here."
                />
              )}
            </View>

            <View style={styles.section}>
              <CustomerSectionHeader
                title="Upcoming bookings"
                subtitle="Your mobile car care appointments."
                actionLabel="View all"
                onAction={() => router.push("/(customer)/(tabs)/bookings")}
              />

              {data && data.bookings.length > 0 ? (
                <CustomerBookingCard
                  booking={data.bookings[0]}
                  onViewDetails={() =>
                    router.push({
                      pathname: "/(customer)/booking/[bookingId]",
                      params: { bookingId: data.bookings[0].id },
                    })
                  }
                />
              ) : (
                <CustomerListState
                  empty
                  emptyTitle="No bookings yet"
                  emptyMessage="Your mobile service bookings will appear here."
                />
              )}
            </View>

            <View style={styles.section}>
              <CustomerSectionHeader
                title="Vehicle inspections"
                subtitle="Requests and inspection reports."
                actionLabel="View all"
                onAction={() => router.push("/(customer)/(tabs)/inspections")}
              />

              {data && data.inspections.length > 0 ? (
                <CustomerInspectionCard
                  inspection={data.inspections[0]}
                  onViewRequest={() =>
                    router.push({
                      pathname: "/(customer)/inspection/[inspectionId]",
                      params: { inspectionId: data.inspections[0].id },
                    })
                  }
                />
              ) : (
                <CustomerListState
                  empty
                  emptyTitle="No active inspections"
                  emptyMessage="Request a vehicle inspection when you need one."
                />
              )}
            </View>
          </>
        )}
      </ScrollView>

      {/* MARK AS SOLD MODAL */}
      <AppModal
        visible={Boolean(selectedSoldCarId)}
        title="Mark car as sold?"
        message="Are you sure you want to mark this car as sold? It will no longer appear as an active marketplace listing."
        confirmText="Mark Sold"
        onConfirm={handleMarkSold}
        onClose={() => {
          if (!isMarkingSold) setSelectedSoldCarId(null);
        }}
        loading={isMarkingSold}
        destructive
      />

      {/* REMOVE GARAGE VEHICLE MODAL */}
      <AppModal
        visible={Boolean(selectedGarageVehicle)}
        title="Remove vehicle?"
        message={`Are you sure you want to remove ${selectedGarageVehicle ? [selectedGarageVehicle.year, selectedGarageVehicle.make, selectedGarageVehicle.model].filter(Boolean).join(" ") : "this vehicle"} from your garage?`}
        confirmText="Remove vehicle"
        onConfirm={handleRemoveVehicle}
        onClose={() => {
          if (!isRemovingVehicle) setSelectedGarageVehicle(null);
        }}
        loading={isRemovingVehicle}
        destructive
      />
    </ScreenContainer>
  );
}

const styles = StyleSheet.create({
  screen: { paddingHorizontal: 0 },
  content: {
    paddingHorizontal: spacing.xl,
    paddingTop: spacing.lg,
    paddingBottom: spacing.xxxl,
    gap: spacing.section,
  },
  heroCard: {
    borderWidth: 1,
    borderRadius: radius.xl,
    padding: spacing.xl,
    gap: spacing.lg,
  },
  heroHeader: {
    gap: spacing.xs,
  },
  appBadge: {
    alignSelf: "flex-start",
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: radius.pill,
    marginBottom: 4,
  },
  appBadgeText: {
    fontSize: 9.5,
    fontWeight: fontWeight.bold,
    letterSpacing: 1.2,
  },
  greeting: {
    fontSize: 28,
    lineHeight: 34,
    fontWeight: fontWeight.bold,
    letterSpacing: -0.6,
  },
  heroSub: {
    fontSize: fontSize.sm,
    lineHeight: 21,
  },
  statsRow: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: spacing.sm,
  },
  statPill: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    borderWidth: 1,
    paddingHorizontal: 12,
    paddingVertical: 7,
    borderRadius: radius.pill,
  },
  statText: {
    fontSize: fontSize.xs,
    fontWeight: fontWeight.bold,
  },
  heroActionsRow: {
    gap: spacing.sm,
    marginTop: spacing.xs,
  },
  quickGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
    justifyContent: "space-between",
    gap: spacing.md,
  },
  section: {
    gap: spacing.lg,
  },
});
