import { Ionicons } from "@expo/vector-icons";
import { useFocusEffect, useLocalSearchParams } from "expo-router";
import { useCallback, useEffect, useState } from "react";
import {
  ActivityIndicator,
  FlatList,
  Keyboard,
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
import AppLoadingOverlay from "@/components/ui/AppLoadingOverlay";
import AppModal from "@/components/ui/AppModal";
import ScreenContainer from "@/components/ui/ScreenContainer";
import { fontSize, fontWeight, radius, spacing } from "@/constants/theme";
import { useAuth } from "@/features/auth/use-auth";
import { useCustomerDashboard } from "@/features/customer/use-customer-dashboard";
import { toastError, toastSuccess } from "@/features/toast/toast-store";
import { useAppTheme } from "@/hooks/use-app-theme";
import { useSingleNavigation } from "@/hooks/use-single-navigation";
import {
  fetchUkVehicleDetails,
  type UkVehicleLookupResult,
} from "@/services/customer/uk-vehicle-lookup.service";
import { supabase } from "@/services/supabase/client";
import type { CustomerGarageVehicle } from "@/types/customer";

export default function CustomerGarageScreen() {
  const theme = useAppTheme();
  const { session } = useAuth();
  const { navigate } = useSingleNavigation();
  const params = useLocalSearchParams<{ openAddVehicle?: string }>();

  const query = useCustomerDashboard(session?.user.id);
  const vehicles = query.data?.garageVehicles ?? [];

  const [selectedVehicle, setSelectedVehicle] =
    useState<CustomerGarageVehicle | null>(null);
  const [isRemoving, setIsRemoving] = useState(false);

  // ADD VEHICLE MODAL STATE (SENIOR'S 2-STEP LOOKUP & CONFIRM FLOW)
  const [addModalVisible, setAddModalVisible] = useState(false);
  const [registration, setRegistration] = useState("");
  const [foundVehicle, setFoundVehicle] =
    useState<UkVehicleLookupResult | null>(null);
  const [addError, setAddError] = useState<string | null>(null);
  const [isLookingUp, setIsLookingUp] = useState(false);
  const [isSavingVehicle, setIsSavingVehicle] = useState(false);

  useFocusEffect(
    useCallback(() => {
      void query.refetch();
    }, []),
  );

  useEffect(() => {
    if (params.openAddVehicle === "true") {
      setAddError(null);
      setRegistration("");
      setFoundVehicle(null);
      setAddModalVisible(true);
    }
  }, [params.openAddVehicle]);

  const handleOpenAddModal = () => {
    setAddError(null);
    setRegistration("");
    setFoundVehicle(null);
    setAddModalVisible(true);
  };

  // STEP 1: FIND VEHICLE (SENIOR'S lookupVehicleAction)
  const handleFindVehicle = async () => {
    const cleanReg = registration.replace(/[\s\-]/g, "").toUpperCase();
    setAddError(null);

    if (!cleanReg) {
      setAddError("Please enter your UK registration number.");
      return;
    }

    if (!session?.user.id) {
      setAddError("You must be signed in to add a vehicle.");
      return;
    }

    // Client duplicate check
    const isAlreadyAdded = vehicles.some(
      (v) => v.registration?.replace(/[\s\-]/g, "").toUpperCase() === cleanReg,
    );

    if (isAlreadyAdded) {
      setAddError(`Vehicle (${cleanReg}) is already in your garage.`);
      return;
    }

    Keyboard.dismiss();
    setIsLookingUp(true);

    try {
      // 1. Fetch details from RapidAPI
      const dvlaVehicle = await fetchUkVehicleDetails(cleanReg);

      // 2. Database duplicate check
      const { data: existingCheck } = await supabase
        .from("garage_vehicles")
        .select("id")
        .eq("customer_id", session.user.id)
        .eq("registration", cleanReg)
        .maybeSingle();

      if (existingCheck) {
        setAddError(`Vehicle (${cleanReg}) is already in your garage.`);
        setIsLookingUp(false);
        return;
      }

      // Show confirmation preview step
      setFoundVehicle(dvlaVehicle);
    } catch (err: any) {
      const msg =
        err instanceof Error
          ? err.message
          : "Could not find details for this vehicle. Please check the registration.";
      setAddError(msg);
    } finally {
      setIsLookingUp(false);
    }
  };

  // STEP 2: CONFIRM & SAVE VEHICLE (SENIOR'S addGarageVehicleAction)
  const handleConfirmAndSave = async () => {
    if (!foundVehicle || !session?.user.id) return;

    setIsSavingVehicle(true);
    setAddError(null);

    try {
      const { error } = await supabase.from("garage_vehicles").insert({
        customer_id: session.user.id,
        registration: foundVehicle.registration,
        make: foundVehicle.make,
        model: foundVehicle.model,
        year: foundVehicle.year,
        fuel_type: foundVehicle.fuelType,
        colour: foundVehicle.colour,
        engine_capacity_cc: foundVehicle.engineCapacityCc ?? null,
        mot_expiry: foundVehicle.motExpiry ?? null,
      });

      if (error) {
        if (error.code === "23505") {
          setAddError("This vehicle is already in your garage.");
          return;
        }
        throw error;
      }

      await query.refetch();

      toastSuccess(
        `${foundVehicle.year} ${foundVehicle.make} ${foundVehicle.model} added!`,
        "Vehicle Added",
      );

      setRegistration("");
      setFoundVehicle(null);
      setAddError(null);
      setAddModalVisible(false);
    } catch (err: any) {
      setAddError(
        err?.message ||
          "Failed to add vehicle to your garage. Please try again.",
      );
    } finally {
      setIsSavingVehicle(false);
    }
  };

  // REMOVE VEHICLE
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

      const label =
        [selectedVehicle.make, selectedVehicle.model]
          .filter(Boolean)
          .join(" ") || "Vehicle";
      setSelectedVehicle(null);
      await query.refetch();

      toastSuccess(
        `${label} has been removed from your garage.`,
        "Vehicle Removed",
      );
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
      <CustomerTopBar title="My Garage" showMenu />

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
              onAction={handleOpenAddModal}
            />
          </View>
        }
        ItemSeparatorComponent={() => <View style={styles.separator} />}
        renderItem={({ item }) => (
          <CustomerVehicleCard
            vehicle={item}
            onBookService={() => navigate("/(customer)/mobile-services")}
            onCompatibleParts={() =>
              navigate("/(customer)/parts", { vehicleId: item.id })
            }
            onMore={() => setSelectedVehicle(item)}
          />
        )}
        ListEmptyComponent={
          <CustomerListState
            loading={query.isLoading}
            error={query.isError}
            empty={!query.isLoading && !query.isError && vehicles.length === 0}
            emptyTitle="No vehicles in your garage yet"
            emptyMessage="Add your first vehicle to make future services and inspections quicker."
            onRetry={() => void query.refetch()}
          />
        }
      />

      {/* REMOVE VEHICLE MODAL */}
      <AppModal
        visible={Boolean(selectedVehicle)}
        title="Remove vehicle?"
        message={`Are you sure you want to remove ${
          selectedVehicle
            ? [
                selectedVehicle.year,
                selectedVehicle.make,
                selectedVehicle.model,
              ]
                .filter(Boolean)
                .join(" ")
            : "this vehicle"
        } from your garage?`}
        confirmText="Remove vehicle"
        onConfirm={handleRemoveVehicle}
        onClose={() => {
          if (!isRemoving) setSelectedVehicle(null);
        }}
        destructive
      />

      {/* ADD VEHICLE MODAL (SENIOR'S 2-STEP FLOW) */}
      <AppModal
        visible={addModalVisible}
        title={foundVehicle ? "Confirm vehicle" : "Add a new vehicle"}
        message={
          foundVehicle
            ? "Confirm vehicle details before saving to your garage."
            : "Enter your UK registration to find your vehicle."
        }
        onClose={() => {
          if (!isLookingUp && !isSavingVehicle) {
            setAddModalVisible(false);
            setFoundVehicle(null);
            setAddError(null);
          }
        }}
      >
        <ScrollView
          showsVerticalScrollIndicator={false}
          keyboardShouldPersistTaps="handled"
          contentContainerStyle={styles.modalScrollView}
        >
          {!foundVehicle ? (
            /* STEP 1: ENTER REGISTRATION FORM */
            <View style={styles.addVehicleForm}>
              <View
                style={[
                  styles.plateBox,
                  {
                    backgroundColor: theme.surfaceSecondary,
                    borderColor: addError ? theme.danger : theme.inputBorder,
                    borderWidth: addError ? 1.5 : 1,
                  },
                ]}
              >
                <View
                  style={[
                    styles.plateBand,
                    {
                      backgroundColor: addError ? theme.danger : theme.primary,
                    },
                  ]}
                >
                  <Text
                    style={[styles.plateBandText, { color: theme.navText }]}
                  >
                    UK
                  </Text>
                </View>
                <TextInput
                  value={registration}
                  onChangeText={(v) => {
                    setRegistration(v.toUpperCase());
                    if (addError) setAddError(null);
                  }}
                  placeholder="AB12 CDE"
                  placeholderTextColor={theme.textMuted}
                  autoCapitalize="characters"
                  maxLength={10}
                  style={[styles.plateInput, { color: theme.text }]}
                />
              </View>

              {addError ? (
                <View
                  style={[
                    styles.errorBox,
                    {
                      backgroundColor: theme.dangerSoft,
                      borderLeftColor: theme.danger,
                    },
                  ]}
                >
                  <Ionicons
                    name="alert-circle-outline"
                    size={18}
                    color={theme.danger}
                  />
                  <Text style={[styles.errorText, { color: theme.danger }]}>
                    {addError}
                  </Text>
                </View>
              ) : null}

              <Pressable
                accessibilityRole="button"
                disabled={isLookingUp || !registration.trim()}
                onPress={() => void handleFindVehicle()}
                style={({ pressed }) => [
                  styles.findVehicleButton,
                  { backgroundColor: theme.primary },
                  (!registration.trim() || isLookingUp) && styles.disabled,
                  pressed &&
                    registration.trim() &&
                    !isLookingUp &&
                    styles.pressed,
                ]}
              >
                {isLookingUp ? (
                  <ActivityIndicator size="small" color={theme.navText} />
                ) : (
                  <>
                    <Text
                      style={[
                        styles.findVehicleButtonText,
                        { color: theme.navText },
                      ]}
                    >
                      Find Vehicle
                    </Text>
                    <Ionicons name="search" size={17} color={theme.navText} />
                  </>
                )}
              </Pressable>
            </View>
          ) : (
            /* STEP 2: VEHICLE PREVIEW & CONFIRMATION (SENIOR WEB MATCH) */
            <View style={styles.previewContainer}>
              <View
                style={[
                  styles.vehiclePreviewCard,
                  {
                    backgroundColor: theme.surfaceSecondary,
                    borderColor: theme.border,
                  },
                ]}
              >
                <Text
                  style={[styles.previewVehicleTitle, { color: theme.text }]}
                >
                  {foundVehicle.make} {foundVehicle.model}
                </Text>
                <Text
                  style={[
                    styles.previewVehicleMeta,
                    { color: theme.textSecondary },
                  ]}
                >
                  {foundVehicle.year} · {foundVehicle.colour} ·{" "}
                  {foundVehicle.fuelType}
                </Text>
                {foundVehicle.motExpiry ? (
                  <Text style={[styles.previewMot, { color: theme.textMuted }]}>
                    MOT Expiry: {foundVehicle.motExpiry}
                  </Text>
                ) : null}
              </View>

              {addError ? (
                <View
                  style={[
                    styles.errorBox,
                    {
                      backgroundColor: theme.dangerSoft,
                      borderLeftColor: theme.danger,
                    },
                  ]}
                >
                  <Ionicons
                    name="alert-circle-outline"
                    size={18}
                    color={theme.danger}
                  />
                  <Text style={[styles.errorText, { color: theme.danger }]}>
                    {addError}
                  </Text>
                </View>
              ) : null}

              <View style={styles.confirmButtonsRow}>
                <Pressable
                  accessibilityRole="button"
                  disabled={isSavingVehicle}
                  onPress={() => {
                    setFoundVehicle(null);
                    setAddError(null);
                  }}
                  style={({ pressed }) => [
                    styles.backBtn,
                    {
                      backgroundColor: theme.surface,
                      borderColor: theme.border,
                    },
                    pressed && styles.pressed,
                  ]}
                >
                  <Text style={[styles.backBtnText, { color: theme.text }]}>
                    Back
                  </Text>
                </Pressable>

                <Pressable
                  accessibilityRole="button"
                  disabled={isSavingVehicle}
                  onPress={() => void handleConfirmAndSave()}
                  style={({ pressed }) => [
                    styles.confirmSaveBtn,
                    { backgroundColor: theme.primary },
                    isSavingVehicle && styles.disabled,
                    pressed && !isSavingVehicle && styles.pressed,
                  ]}
                >
                  {isSavingVehicle ? (
                    <ActivityIndicator size="small" color={theme.navText} />
                  ) : (
                    <Text
                      style={[
                        styles.confirmSaveBtnText,
                        { color: theme.navText },
                      ]}
                    >
                      Confirm & Save
                    </Text>
                  )}
                </Pressable>
              </View>
            </View>
          )}
        </ScrollView>
      </AppModal>

      {/* CUSTOM OVERLAY LOADER (LOOKUP, SAVE & REMOVE PAR ACTIVE HAI) */}
      <AppLoadingOverlay
        visible={isLookingUp || isSavingVehicle || isRemoving}
        message={
          isLookingUp
            ? "Looking up vehicle details..."
            : isSavingVehicle
              ? "Saving vehicle to garage..."
              : "Removing vehicle..."
        }
      />
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
  addVehicleForm: { gap: spacing.md },
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
  plateBandText: { fontSize: 10, fontWeight: "800" },
  plateInput: {
    flex: 1,
    paddingHorizontal: spacing.md,
    fontSize: 18,
    fontWeight: "800",
    letterSpacing: 2,
  },
  errorBox: {
    flexDirection: "row",
    alignItems: "center",
    gap: spacing.xs,
    padding: spacing.md,
    borderRadius: radius.sm,
    borderLeftWidth: 3,
  },
  errorText: {
    flex: 1,
    fontSize: fontSize.xs,
    fontWeight: fontWeight.semibold,
    lineHeight: 18,
  },
  findVehicleButton: {
    minHeight: 50,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: spacing.sm,
    borderRadius: radius.md,
    marginTop: spacing.xs,
  },
  findVehicleButtonText: {
    fontSize: fontSize.md,
    fontWeight: fontWeight.bold,
  },

  previewContainer: {
    gap: spacing.md,
  },
  vehiclePreviewCard: {
    padding: spacing.lg,
    borderRadius: radius.lg,
    borderWidth: 1,
    gap: 4,
  },
  previewVehicleTitle: {
    fontSize: fontSize.md + 1,
    fontWeight: fontWeight.bold,
  },
  previewVehicleMeta: {
    fontSize: fontSize.sm,
    textTransform: "capitalize",
  },
  previewMot: {
    fontSize: fontSize.xs,
    marginTop: 2,
  },
  confirmButtonsRow: {
    flexDirection: "row",
    gap: spacing.sm,
    marginTop: spacing.xs,
  },
  backBtn: {
    minHeight: 48,
    paddingHorizontal: spacing.xl,
    borderRadius: radius.md,
    borderWidth: 1,
    alignItems: "center",
    justifyContent: "center",
  },
  backBtnText: {
    fontSize: fontSize.sm,
    fontWeight: fontWeight.bold,
  },
  confirmSaveBtn: {
    flex: 1,
    minHeight: 48,
    borderRadius: radius.md,
    alignItems: "center",
    justifyContent: "center",
  },
  confirmSaveBtnText: {
    fontSize: fontSize.sm,
    fontWeight: fontWeight.bold,
  },

  disabled: { opacity: 0.5 },
  pressed: { opacity: 0.75 },
});
