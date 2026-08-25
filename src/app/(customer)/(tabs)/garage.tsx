import { Ionicons } from "@expo/vector-icons";
import { router, useFocusEffect, useLocalSearchParams } from "expo-router";
import { useCallback, useEffect, useState } from "react";
import {
  ActivityIndicator,
  FlatList,
  Pressable,
  RefreshControl,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from "react-native";

import CustomerListState from "@/components/customer/CustomerListState";
import CustomerPageHeader from "@/components/customer/CustomerPageHeader";
import CustomerTopBar from "@/components/customer/CustomerTopBar";
import CustomerVehicleCard from "@/components/customer/CustomerVehicleCard";
import AppModal from "@/components/ui/AppModal";
import ScreenContainer from "@/components/ui/ScreenContainer";
import { fontSize, fontWeight, radius, spacing } from "@/constants/theme";
import { useAuth } from "@/features/auth/use-auth";
import { useCustomerDashboard } from "@/features/customer/use-customer-dashboard";
import { toastError, toastSuccess } from "@/features/toast/toast-store";
import { useAppTheme } from "@/hooks/use-app-theme";
import { fetchUkVehicleDetails } from "@/services/customer/uk-vehicle-lookup.service";
import { supabase } from "@/services/supabase/client";
import type { CustomerGarageVehicle } from "@/types/customer";

export default function CustomerGarageScreen() {
  const theme = useAppTheme();
  const { session } = useAuth();
  const params = useLocalSearchParams<{ openAddVehicle?: string }>();

  const query = useCustomerDashboard(session?.user.id);
  const vehicles = query.data?.garageVehicles ?? [];

  const [selectedVehicle, setSelectedVehicle] = useState<CustomerGarageVehicle | null>(null);
  const [isRemoving, setIsRemoving] = useState(false);

  // ADD VEHICLE MODAL STATE (ONLY REGISTRATION)
  const [addModalVisible, setAddModalVisible] = useState(false);
  const [registration, setRegistration] = useState("");
  const [isAdding, setIsAdding] = useState(false);

  useFocusEffect(
    useCallback(() => {
      void query.refetch();
    }, [])
  );

  useEffect(() => {
    if (params.openAddVehicle === "true") {
      setAddModalVisible(true);
    }
  }, [params.openAddVehicle]);

  const handleAddVehicle = async () => {
    const cleanReg = registration.trim().toUpperCase();
    if (!cleanReg) {
      toastError("Please enter your UK registration number.", "Registration Required");
      return;
    }

    if (!session?.user.id) {
      toastError("You must be signed in to add a vehicle.", "Authentication Required");
      return;
    }

    setIsAdding(true);

    try {
      // 1. Fetch exact vehicle details from RapidAPI / UK DVLA API
      const dvlaVehicle = await fetchUkVehicleDetails(cleanReg);

      // 2. Insert into Supabase garage_vehicles
      const { error } = await supabase
        .from("garage_vehicles")
        .insert({
          customer_id: session.user.id,
          registration: cleanReg,
          make: dvlaVehicle.make,
          model: dvlaVehicle.model,
          year: dvlaVehicle.year,
          fuel_type: dvlaVehicle.fuelType,
          colour: dvlaVehicle.colour,
        });

      if (error) throw error;

      await query.refetch();

      toastSuccess(
        `${dvlaVehicle.year} ${dvlaVehicle.make} ${dvlaVehicle.model} (${cleanReg}) added!`,
        "Vehicle Added"
      );

      setRegistration("");
      setAddModalVisible(false);
    } catch (err) {
      // User input error: handle via Toast without Metro console.error stack trace
      const msg =
        err instanceof Error
          ? err.message
          : "No vehicle found for this registration. Please check and enter a valid UK registration number.";

      toastError(msg, "Vehicle Not Found");
    } finally {
      setIsAdding(false);
    }
  };

  const handleRemoveVehicle = async () => {
    if (!selectedVehicle || !session?.user.id) return;

    setIsRemoving(true);

    try {
      const { error } = await supabase
        .from("garage_vehicles")
        .delete()
        .eq("id", selectedVehicle.id)
        .eq("customer_id", session.user.id);

      if (error) throw error;

      const label = [selectedVehicle.make, selectedVehicle.model].filter(Boolean).join(" ") || "Vehicle";
      setSelectedVehicle(null);
      await query.refetch();

      toastSuccess(`${label} has been removed from your garage.`, "Vehicle Removed");
    } catch (err) {
      const msg =
        typeof err === "object" && err !== null && "message" in err
          ? String((err as any).message)
          : "We couldn't remove this vehicle. Please try again.";

      toastError(msg, "Remove Failed");
    } finally {
      setIsRemoving(false);
    }
  };

  return (
    <ScreenContainer contentStyle={styles.screen}>
      <CustomerTopBar title="My Garage" />

      <FlatList
        data={vehicles}
        keyExtractor={(item) => item.id}
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
        ListHeaderComponent={
          <View style={styles.header}>
            <CustomerPageHeader
              eyebrow="Vehicle hub"
              title="My Garage"
              subtitle="Manage your vehicles, services and inspections in one place."
              actionLabel="+ Add Vehicle"
              actionVariant="secondary"
              onAction={() => setAddModalVisible(true)}
            />
          </View>
        }
        ItemSeparatorComponent={() => <View style={styles.separator} />}
        renderItem={({ item }) => (
          <CustomerVehicleCard
            vehicle={item}
            onBookService={() => router.push("/(customer)/mobile-services")}
            onCompatibleParts={() => router.push("/(customer)/parts")}
            onMore={() => setSelectedVehicle(item)}
          />
        )}
        ListEmptyComponent={
          <CustomerListState
            loading={query.isLoading}
            error={query.isError}
            empty={!query.isLoading && !query.isError && vehicles.length === 0}
            emptyTitle="No vehicles in your garage"
            emptyMessage="Vehicles you add to your Fengxing garage will appear here."
            onRetry={() => void query.refetch()}
          />
        }
      />

      {/* REMOVE VEHICLE MODAL */}
      <AppModal
        visible={Boolean(selectedVehicle)}
        title="Remove vehicle?"
        message={`Are you sure you want to remove ${selectedVehicle ? [selectedVehicle.year, selectedVehicle.make, selectedVehicle.model].filter(Boolean).join(" ") : "this vehicle"} from your garage?`}
        confirmText="Remove vehicle"
        onConfirm={handleRemoveVehicle}
        onClose={() => {
          if (!isRemoving) setSelectedVehicle(null);
        }}
        loading={isRemoving}
        destructive
      />

      {/* ADD NEW VEHICLE MODAL (ONLY REGISTRATION INPUT, CLEAN NO CONSOLE LOG) */}
      <AppModal
        visible={addModalVisible}
        title="Add a new vehicle"
        message="Enter your UK registration to find and add your vehicle."
        onClose={() => setAddModalVisible(false)}
      >
        <ScrollView
          showsVerticalScrollIndicator={false}
          keyboardShouldPersistTaps="handled"
          contentContainerStyle={styles.modalScrollView}
        >
          <View style={styles.addVehicleForm}>
            {/* UK THEME LICENSE PLATE BOX */}
            <View
              style={[
                styles.plateBox,
                {
                  backgroundColor: theme.surfaceSecondary,
                  borderColor: theme.inputBorder,
                },
              ]}
            >
              <View
                style={[
                  styles.plateBand,
                  {
                    backgroundColor: theme.primary,
                  },
                ]}
              >
                <Text style={styles.plateBandText}>UK</Text>
              </View>
              <TextInput
                value={registration}
                onChangeText={(v) => setRegistration(v.toUpperCase())}
                placeholder="AB12 CDE"
                placeholderTextColor={theme.textMuted}
                autoCapitalize="characters"
                maxLength={10}
                style={[styles.plateInput, { color: theme.text }]}
              />
            </View>

            {/* ADD BUTTON */}
            <Pressable
              accessibilityRole="button"
              disabled={isAdding || !registration.trim()}
              onPress={() => void handleAddVehicle()}
              style={({ pressed }) => [
                styles.findVehicleButton,
                { backgroundColor: theme.primary },
                (!registration.trim() || isAdding) && styles.disabled,
                pressed && registration.trim() && !isAdding && styles.pressed,
              ]}
            >
              {isAdding ? (
                <ActivityIndicator size="small" color="#FFFFFF" />
              ) : (
                <>
                  <Text style={styles.findVehicleButtonText}>Find & Add Vehicle</Text>
                  <Ionicons name="arrow-forward" size={18} color="#FFFFFF" />
                </>
              )}
            </Pressable>
          </View>
        </ScrollView>
      </AppModal>
    </ScreenContainer>
  );
}

const styles = StyleSheet.create({
  screen: { paddingHorizontal: 0 },
  content: {
    flexGrow: 1,
    paddingHorizontal: spacing.xl,
    paddingTop: spacing.xxl,
    paddingBottom: spacing.xxxl,
  },
  header: { marginBottom: spacing.xxl },
  separator: { height: spacing.md },

  modalScrollView: {
    paddingVertical: spacing.xs,
  },
  addVehicleForm: { gap: spacing.lg },
  plateBox: {
    minHeight: 52,
    flexDirection: "row",
    overflow: "hidden",
    borderWidth: 1,
    borderRadius: radius.md,
  },
  plateBand: {
    width: 36,
    alignItems: "center",
    justifyContent: "center",
  },
  plateBandText: { color: "#FFFFFF", fontSize: 10, fontWeight: "800" },
  plateInput: {
    flex: 1,
    paddingHorizontal: spacing.md,
    fontSize: 18,
    fontWeight: "800",
    letterSpacing: 2,
  },
  findVehicleButton: {
    minHeight: 52,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: spacing.sm,
    borderRadius: radius.md,
  },
  findVehicleButtonText: { color: "#FFFFFF", fontSize: fontSize.md, fontWeight: fontWeight.bold },
  disabled: { opacity: 0.5 },
  pressed: { opacity: 0.75 },
});
