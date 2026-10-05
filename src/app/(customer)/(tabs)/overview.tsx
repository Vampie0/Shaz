import { useState } from "react";
import {
  Platform,
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
import AppLoadingOverlay from "@/components/ui/AppLoadingOverlay";
import AppModal from "@/components/ui/AppModal";
import ScreenContainer from "@/components/ui/ScreenContainer";
import { fontSize, fontWeight, radius, spacing } from "@/constants/theme";
import { useAuth } from "@/features/auth/use-auth";
import { useCustomerDashboard } from "@/features/customer/use-customer-dashboard";
import { toastError, toastSuccess } from "@/features/toast/toast-store";
import { useAppTheme } from "@/hooks/use-app-theme";
import { useSingleNavigation } from "@/hooks/use-single-navigation";
import { markCarAsSold } from "@/services/customer/sell-car.service";
import { supabase } from "@/services/supabase/client";
import type { CustomerGarageVehicle } from "@/types/customer";

export default function CustomerOverviewScreen() {
  const theme = useAppTheme();
  const { profile, session } = useAuth();
  const { navigate } = useSingleNavigation();

  const query = useCustomerDashboard(session?.user.id);
  const data = query.data;

  const firstName =
    profile?.full_name?.trim().split(/\s+/)[0] || profile?.full_name || "there";

  const [selectedSoldCarId, setSelectedSoldCarId] = useState<string | null>(
    null,
  );
  const [isMarkingSold, setIsMarkingSold] = useState(false);
  const [selectedGarageVehicle, setSelectedGarageVehicle] =
    useState<CustomerGarageVehicle | null>(null);
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
      const label =
        [selectedGarageVehicle.make, selectedGarageVehicle.model]
          .filter(Boolean)
          .join(" ") || "Vehicle";
      setSelectedGarageVehicle(null);
      await query.refetch();
      toastSuccess(
        `${label} has been removed from your garage.`,
        "Vehicle removed",
      );
    } catch (err) {
      console.error("Remove garage vehicle error:", err);
      toastError("Could not remove vehicle.");
    } finally {
      setIsRemovingVehicle(false);
    }
  };

  const activeListingsList = (data?.listings ?? []).filter(
    (car) => car.status !== "sold" && car.status !== "archived",
  );

  const bookingsCount = data?.bookings?.length ?? 0;
  const inspectionsCount = data?.inspections?.length ?? 0;

  return (
    <ScreenContainer contentStyle={styles.screen}>
      <CustomerTopBar title="Overview" showMenu />

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
        {/* --- 1. HERO CARD (Clean, Professional Bordered Layout - No Rainbow Pills) --- */}
        <View
          style={[
            styles.heroCard,
            {
              backgroundColor: theme.surface,
              borderColor: theme.border,
              ...Platform.select({
                ios: {
                  shadowColor: theme.overlay,
                  shadowOffset: { width: 0, height: 4 },
                  shadowOpacity: 0.04,
                  shadowRadius: 10,
                },
                android: {
                  elevation: 2,
                },
              }),
            },
          ]}
        >
          <View style={styles.heroInner}>
            <View style={styles.heroHeader}>
              <Text style={[styles.greeting, { color: theme.text }]}>
                Welcome back, {firstName} 👋
              </Text>
              <Text style={[styles.heroSub, { color: theme.textSecondary }]}>
                Need a mobile service or vehicle inspection?
              </Text>
            </View>

            <View style={styles.statsRow}>
              <View
                style={[
                  styles.statCard,
                  {
                    backgroundColor: theme.surface,
                    borderColor: theme.border,
                  },
                ]}
              >
                <View style={styles.statTextWrap}>
                  <Text style={[styles.statValue, { color: theme.text }]}>
                    {bookingsCount}
                  </Text>
                  <Text
                    style={[styles.statLabel, { color: theme.textSecondary }]}
                  >
                    Bookings
                  </Text>
                </View>
              </View>

              <View
                style={[
                  styles.statCard,
                  {
                    backgroundColor: theme.surface,
                    borderColor: theme.border,
                  },
                ]}
              >
                <View style={styles.statTextWrap}>
                  <Text style={[styles.statValue, { color: theme.text }]}>
                    {inspectionsCount}
                  </Text>
                  <Text
                    style={[styles.statLabel, { color: theme.textSecondary }]}
                  >
                    Inspections
                  </Text>
                </View>
              </View>
            </View>

            <View style={styles.heroActionsRow}>
              <AppButton
                title="Book a Service"
                onPress={() => navigate("/(customer)/mobile-services")}
                style={{ flex: 1 }}
              />
              <AppButton
                title="Request Inspection"
                variant="secondary"
                onPress={() => navigate("/(customer)/vehicle-inspection")}
                style={{ flex: 1 }}
              />
            </View>
          </View>
        </View>

        {/* --- 2. QUICK ACTIONS --- */}
        <View style={styles.quickGrid}>
          <CustomerQuickAction
            icon="build"
            title="Mobile Service"
            subtitle="Car care at your door"
            accentColor={theme.primary}
            badgeBg={theme.surfaceSecondary}
            onPress={() => navigate("/(customer)/mobile-services")}
          />
          <CustomerQuickAction
            icon="shield-checkmark"
            title="Verification"
            subtitle="Request physical check"
            accentColor={theme.primary}
            badgeBg={theme.surfaceSecondary}
            onPress={() => navigate("/(customer)/vehicle-inspection")}
          />
          <CustomerQuickAction
            icon="car"
            title="My Garage"
            subtitle="Your saved vehicles"
            accentColor={theme.primary}
            badgeBg={theme.surfaceSecondary}
            onPress={() => navigate("/(customer)/(tabs)/garage")}
          />
          <CustomerQuickAction
            icon="car-sport"
            title="Sell My Car"
            subtitle="List car for sale"
            accentColor={theme.primary}
            badgeBg={theme.surfaceSecondary}
            onPress={() => navigate("/(customer)/sell-my-car")}
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
            {/* --- 3. MOBILE BOOKINGS --- */}
            <View style={styles.section}>
              <CustomerSectionHeader
                title="Mobile Bookings"
                subtitle="Your car care appointments."
                actionLabel="View all"
                onAction={() => navigate("/(customer)/(tabs)/bookings")}
              />
              {data && data.bookings.length > 0 ? (
                <View style={styles.listGap}>
                  {data.bookings.slice(0, 3).map((item) => (
                    <CustomerBookingCard
                      key={item.id}
                      booking={item}
                      onViewDetails={() =>
                        navigate("/(customer)/booking/[bookingId]", {
                          bookingId: item.id,
                        })
                      }
                    />
                  ))}
                </View>
              ) : (
                <CustomerListState
                  empty
                  emptyTitle="No active bookings"
                  emptyMessage="Book your first mobile service today."
                />
              )}
            </View>

            {/* --- 4. VEHICLE INSPECTIONS --- */}
            <View style={styles.section}>
              <CustomerSectionHeader
                title="Vehicle Inspections"
                subtitle="Tracking your verification requests."
                actionLabel="View all"
                onAction={() => navigate("/(customer)/(tabs)/inspections")}
              />
              {data && data.inspections.length > 0 ? (
                <View style={styles.listGap}>
                  {data.inspections.slice(0, 3).map((item) => (
                    <CustomerInspectionCard
                      key={item.id}
                      inspection={item}
                      onViewRequest={() =>
                        navigate("/(customer)/inspection/[inspectionId]", {
                          inspectionId: item.id,
                        })
                      }
                    />
                  ))}
                </View>
              ) : (
                <CustomerListState
                  empty
                  emptyTitle="No inspections"
                  emptyMessage="Request a verification report for any car."
                />
              )}
            </View>

            {/* --- 5. MY GARAGE --- */}
            <View style={styles.section}>
              <CustomerSectionHeader
                title="My Garage"
                subtitle="Quick access to your vehicles."
                actionLabel="View all"
                onAction={() => navigate("/(customer)/(tabs)/garage")}
              />
              {data && data.garageVehicles.length > 0 ? (
                <View style={styles.listGap}>
                  {data.garageVehicles.slice(0, 3).map((item) => (
                    <CustomerVehicleCard
                      key={item.id}
                      vehicle={item}
                      onBookService={() =>
                        navigate("/(customer)/mobile-services")
                      }
                      onCompatibleParts={() =>
                        navigate("/(customer)/parts", {
                          vehicleId: item.id,
                        })
                      }
                      onMore={() => setSelectedGarageVehicle(item)}
                    />
                  ))}
                </View>
              ) : (
                <CustomerListState
                  empty
                  emptyTitle="Garage is empty"
                  emptyMessage="Add a vehicle using its registration."
                />
              )}
            </View>

            {/* --- 6. MARKETPLACE LISTINGS --- */}
            <View style={styles.section}>
              <CustomerSectionHeader
                title="Marketplace Listings"
                subtitle="Cars you have listed for sale."
                actionLabel="Manage"
                onAction={() => navigate("/(customer)/(tabs)/my-cars")}
              />
              {activeListingsList.length > 0 ? (
                <View style={styles.listGap}>
                  {activeListingsList.slice(0, 3).map((item) => {
                    const isActive = item.status === "active";
                    const isVerified = item.isVerified;
                    const canEdit =
                      item.status === "draft" ||
                      item.status === "rejected" ||
                      item.status === "active";

                    return (
                      <CustomerListingCard
                        key={item.id}
                        car={item}
                        onView={
                          isActive
                            ? () =>
                                navigate("/(customer)/car/[carId]", {
                                  carId: item.id,
                                })
                            : undefined
                        }
                        onEdit={
                          canEdit
                            ? () =>
                                navigate("/(customer)/sell-my-car", {
                                  editCarId: item.id,
                                })
                            : undefined
                        }
                        onRequestInspection={
                          isActive && !isVerified
                            ? () =>
                                navigate("/(customer)/vehicle-inspection", {
                                  carId: item.id,
                                  registration: item.registration || "",
                                  make: item.make || "",
                                  model: item.model || "",
                                  year: item.year ? String(item.year) : "",
                                })
                            : undefined
                        }
                        onMore={() => setSelectedSoldCarId(item.id)}
                      />
                    );
                  })}
                </View>
              ) : (
                <CustomerListState
                  empty
                  emptyTitle="No listings"
                  emptyMessage="List your car on our marketplace for free."
                />
              )}
            </View>
          </>
        )}
      </ScrollView>

      {/* --- MODALS --- */}
      <AppModal
        visible={Boolean(selectedSoldCarId)}
        title="Mark car as sold?"
        message="Are you sure you want to mark this car as sold?"
        confirmText="Mark Sold"
        onConfirm={handleMarkSold}
        onClose={() => !isMarkingSold && setSelectedSoldCarId(null)}
        destructive
      />

      <AppModal
        visible={Boolean(selectedGarageVehicle)}
        title="Remove vehicle?"
        message={`Are you sure you want to remove this vehicle from your garage?`}
        confirmText="Remove vehicle"
        onConfirm={handleRemoveVehicle}
        onClose={() => !isRemovingVehicle && setSelectedGarageVehicle(null)}
        destructive
      />

      <AppLoadingOverlay
        visible={isMarkingSold || isRemovingVehicle}
        message={
          isMarkingSold ? "Marking car as sold..." : "Removing vehicle..."
        }
      />
    </ScreenContainer>
  );
}

const styles = StyleSheet.create({
  screen: {
    paddingHorizontal: 0,
  },
  content: {
    paddingHorizontal: spacing.xl,
    paddingTop: spacing.lg,
    paddingBottom: spacing.xxxl,
    gap: spacing.section + 4,
  },

  heroCard: {
    borderWidth: 1,
    borderRadius: radius.xl,
    overflow: "hidden",
  },
  heroInner: {
    paddingHorizontal: spacing.xl,
    paddingTop: spacing.lg + 2,
    paddingBottom: spacing.xl,
    gap: spacing.lg,
  },
  heroHeader: {
    gap: 6,
  },
  greeting: {
    fontSize: 24,
    lineHeight: 30,
    fontWeight: fontWeight.bold,
    letterSpacing: -0.4,
  },
  heroSub: {
    fontSize: fontSize.sm,
    lineHeight: 20,
    opacity: 0.8,
  },

  statsRow: {
    flexDirection: "row",
    gap: spacing.sm,
  },
  statCard: {
    flex: 1,
    borderWidth: 1,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.md,
    borderRadius: radius.lg,
    alignItems: "center",
    justifyContent: "center",
    gap: 2,
  },
  statTextWrap: {
    alignItems: "center",
    justifyContent: "center",
  },
  statValue: {
    fontSize: 20,
    fontWeight: fontWeight.bold,
  },
  statLabel: {
    fontSize: 12,
    fontWeight: fontWeight.semibold,
  },

  heroActionsRow: {
    flexDirection: "row",
    gap: spacing.sm,
    marginTop: 2,
  },

  quickGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
    justifyContent: "space-between",
    gap: spacing.md,
  },

  section: {
    gap: spacing.md + 2,
  },
  listGap: {
    gap: spacing.md,
  },
});
