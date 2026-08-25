import { Ionicons } from "@expo/vector-icons";
import { useQueryClient } from "@tanstack/react-query";
import { router, useFocusEffect, useLocalSearchParams } from "expo-router";
import { useCallback, useMemo, useState } from "react";
import {
  ActivityIndicator,
  Keyboard,
  KeyboardAvoidingView,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from "react-native";

import CustomerFlowTopBar from "@/components/customer/CustomerFlowTopBar";
import CustomerDatePickerField from "@/components/customer/form/CustomerDatePickerField";
import CustomerTimePickerField from "@/components/customer/form/CustomerTimePickerField";
import ServiceBookingField from "@/components/customer/services/ServiceBookingField";
import ScreenContainer from "@/components/ui/ScreenContainer";
import KeyboardScreenContainer from "@/components/ui/KeyboardScreenContainer";
import { fontSize, fontWeight, radius, spacing } from "@/constants/theme";
import { useAuth } from "@/features/auth/use-auth";
import { useCustomerMobileServices } from "@/features/customer/use-customer-mobile-services";
import { toastSuccess } from "@/features/toast/toast-store";
import { useAppTheme } from "@/hooks/use-app-theme";
import { useInvalidFieldScroll } from "@/hooks/use-invalid-field-scroll";
import { createCustomerServiceBooking } from "@/services/customer/customer-service-booking.service";

type BookingForm = {
  carMake: string;
  carModel: string;
  carRegistration: string;
  postcode: string;
  addressLine1: string;
  addressLine2: string;
  city: string;
  preferredDate: string;
  preferredTime: string;
  notes: string;
};

const initialForm: BookingForm = {
  carMake: "",
  carModel: "",
  carRegistration: "",
  postcode: "",
  addressLine1: "",
  addressLine2: "",
  city: "",
  preferredDate: "",
  preferredTime: "",
  notes: "",
};

function formatPrice(value: number) {
  return (
    "£" +
    value.toLocaleString("en-GB", {
      maximumFractionDigits: 0,
    })
  );
}

type BookingValidationKey =
  | "carMake"
  | "carModel"
  | "postcode"
  | "addressLine1"
  | "city"
  | "preferredDate"
  | "preferredTime";

function validDateInput(value: string) {
  const match = value.trim().match(/^(\d{2})\/(\d{2})\/(\d{4})$/);
  if (!match) return false;
  const day = Number(match[1]);
  const month = Number(match[2]);
  const year = Number(match[3]);
  const date = new Date(year, month - 1, day, 12, 0, 0, 0);
  return (
    date.getFullYear() === year &&
    date.getMonth() === month - 1 &&
    date.getDate() === day
  );
}

function validateForm(form: BookingForm) {
  const required: Array<[BookingValidationKey, string]> = [
    ["carMake", "Vehicle make"],
    ["carModel", "Vehicle model"],
    ["postcode", "Postcode"],
    ["addressLine1", "Address line 1"],
    ["city", "City"],
    ["preferredDate", "Preferred date"],
    ["preferredTime", "Preferred time"],
  ];

  for (const [key, label] of required) {
    if (!form[key].trim()) {
      return { key, message: `${label} is required.` };
    }
  }

  if (!validDateInput(form.preferredDate)) {
    return { key: "preferredDate" as BookingValidationKey, message: "Choose a valid preferred date." };
  }

  if (!/^([01]\d|2[0-3]):[0-5]\d$/.test(form.preferredTime)) {
    return { key: "preferredTime" as BookingValidationKey, message: "Choose a valid preferred time." };
  }

  return null;
}

export default function BookServiceScreen() {
  const theme = useAppTheme();
  const params = useLocalSearchParams<{ serviceId?: string }>();
  const serviceId = typeof params.serviceId === "string" ? params.serviceId : "";

  const { session } = useAuth();
  const queryClient = useQueryClient();
  const servicesQuery = useCustomerMobileServices();

  const service = useMemo(
    () => servicesQuery.data?.find((item) => item.id === serviceId) ?? null,
    [servicesQuery.data, serviceId]
  );

  const [form, setForm] = useState<BookingForm>(initialForm);
  const [invalidField, setInvalidField] = useState<BookingValidationKey | null>(null);
  const { scrollRef, bindField, onScroll, scrollToField } = useInvalidFieldScroll<BookingValidationKey>();

  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  // RESET FORM WHENEVER SCREEN COMES INTO FOCUS OR NEW SERVICE OPENED
  useFocusEffect(
    useCallback(() => {
      setForm(initialForm);
      setInvalidField(null);
      setErrorMessage(null);
    }, [serviceId])
  );

  const update = <K extends keyof BookingForm>(key: K, value: BookingForm[K]) => {
    setForm((current) => ({ ...current, [key]: value }));
    if (invalidField === key) {
      if (typeof value === "string" ? value.trim() : value) {
        setInvalidField(null);
        setErrorMessage(null);
      }
    }
  };

  const requestBooking = async () => {
    const customerId = session?.user.id;
    if (!customerId) {
      setErrorMessage("You need to be signed in to request a booking.");
      return;
    }

    if (!service) {
      setErrorMessage("This service is no longer available.");
      return;
    }

    const validationError = validateForm(form);
    if (validationError) {
      setErrorMessage(validationError.message);
      setInvalidField(validationError.key);
      Keyboard.dismiss();
      setTimeout(() => scrollToField(validationError.key), 120);
      return;
    }

    setInvalidField(null);
    setIsSubmitting(true);
    setErrorMessage(null);

    try {
      await createCustomerServiceBooking({
        customerId,
        serviceTypeId: service.id,
        carMake: form.carMake,
        carModel: form.carModel,
        carRegistration: form.carRegistration,
        postcode: form.postcode,
        addressLine1: form.addressLine1,
        addressLine2: form.addressLine2,
        city: form.city,
        preferredDate: form.preferredDate,
        preferredTime: form.preferredTime,
        notes: form.notes,
      });

      await queryClient.invalidateQueries({
        queryKey: ["customer-dashboard", customerId],
      });

      toastSuccess(
        "Booking requested. Your preferred time will be confirmed by the team.",
        "Booking Requested"
      );

      // CLEAR FORM BEFORE NAVIGATING AWAY
      setForm(initialForm);

      router.replace("/(customer)/(tabs)/bookings");
    } catch (error) {
      setErrorMessage(
        error instanceof Error ? error.message : "Could not request the booking."
      );
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <ScreenContainer contentStyle={styles.screen}>
      <CustomerFlowTopBar title="Book Service" />

      <KeyboardScreenContainer
        contentContainerStyle={[styles.content, { flexGrow: 1 }]}
        bottomPadding={160}
        scrollRef={scrollRef}
        onScroll={onScroll}
      >
          {servicesQuery.isLoading ? (
            <View style={styles.loadingState}>
              <ActivityIndicator color={theme.primary} />
              <Text style={[styles.loadingText, { color: theme.textSecondary }]}>
                Loading service…
              </Text>
            </View>
          ) : null}

          {!servicesQuery.isLoading && !service ? (
            <View style={styles.loadingState}>
              <Ionicons name="alert-circle-outline" size={28} color={theme.primary} />
              <Text style={[styles.missingTitle, { color: theme.text }]}>
                Service unavailable
              </Text>
              <Text style={[styles.loadingText, { color: theme.textSecondary }]}>
                Go back to Mobile Services and choose an available service.
              </Text>
            </View>
          ) : null}

          {service ? (
            <>
              {/* HERO SECTION MATCHING WEBSITE SCREENSHOT */}
              <View style={styles.hero}>
                <Text style={[styles.eyebrow, { color: theme.primary }]}>
                  MOBILE SERVICE BOOKING
                </Text>

                <Text style={[styles.title, { color: theme.text }]}>
                  Book {service.name}
                </Text>

                <Text style={[styles.subtitle, { color: theme.textSecondary }]}>
                  Choose your preferred visit time. We will confirm the final appointment after reviewing the request.
                </Text>
              </View>

              {/* SERVICE SUMMARY BANNER (RED BORDER, SOFT PINK/RED BG) */}
              <View
                style={[
                  styles.serviceSummary,
                  {
                    backgroundColor: theme.dangerSoft,
                    borderColor: theme.danger,
                  },
                ]}
              >
                <Text style={[styles.summaryTitle, { color: theme.text }]}>
                  {service.name}
                </Text>
                <Text style={[styles.summaryText, { color: theme.textSecondary }]}>
                  From {formatPrice(service.basePrice)}. Your preferred time is confirmed by our team.
                </Text>
              </View>

              <View style={[styles.divider, { backgroundColor: theme.border }]} />

              {/* VEHICLE DETAILS SECTION */}
              <View style={styles.section}>
                <Text style={[styles.sectionTitle, { color: theme.text }]}>
                  Vehicle details
                </Text>

                <View style={styles.fields}>
                  <ServiceBookingField
                    label="Vehicle make"
                    fieldRef={bindField("carMake")}
                    invalid={invalidField === "carMake"}
                    required
                    value={form.carMake}
                    onChangeText={(v) => update("carMake", v)}
                    placeholder="e.g. BMW"
                    autoCapitalize="words"
                    icon="car-sport-outline"
                  />

                  <ServiceBookingField
                    label="Vehicle model"
                    fieldRef={bindField("carModel")}
                    invalid={invalidField === "carModel"}
                    required
                    value={form.carModel}
                    onChangeText={(v) => update("carModel", v)}
                    placeholder="e.g. 3 Series"
                    autoCapitalize="words"
                  />

                  <ServiceBookingField
                    label="Registration"
                    optional
                    value={form.carRegistration}
                    onChangeText={(v) => update("carRegistration", v.toUpperCase())}
                    placeholder="e.g. AB12 CDE"
                    autoCapitalize="characters"
                    icon="card-outline"
                  />
                </View>
              </View>

              <View style={[styles.divider, { backgroundColor: theme.border }]} />

              {/* LOCATION SECTION */}
              <View style={styles.section}>
                <Text style={[styles.sectionTitle, { color: theme.text }]}>
                  Location
                </Text>

                <View style={styles.fields}>
                  <ServiceBookingField
                    label="Postcode"
                    fieldRef={bindField("postcode")}
                    invalid={invalidField === "postcode"}
                    required
                    value={form.postcode}
                    onChangeText={(v) => update("postcode", v.toUpperCase())}
                    placeholder="e.g. SW1A 1AA"
                    autoCapitalize="characters"
                    icon="navigate-outline"
                  />

                  <ServiceBookingField
                    label="Address line 1"
                    fieldRef={bindField("addressLine1")}
                    invalid={invalidField === "addressLine1"}
                    required
                    value={form.addressLine1}
                    onChangeText={(v) => update("addressLine1", v)}
                    placeholder="House number and street"
                    autoCapitalize="words"
                  />

                  <ServiceBookingField
                    label="Address line 2 (optional)"
                    optional
                    value={form.addressLine2}
                    onChangeText={(v) => update("addressLine2", v)}
                    placeholder="Apartment, building, area"
                    autoCapitalize="words"
                  />

                  <ServiceBookingField
                    label="City"
                    fieldRef={bindField("city")}
                    invalid={invalidField === "city"}
                    required
                    value={form.city}
                    onChangeText={(v) => update("city", v)}
                    placeholder="e.g. London"
                    autoCapitalize="words"
                  />
                </View>
              </View>

              <View style={[styles.divider, { backgroundColor: theme.border }]} />

              {/* PREFERRED SCHEDULE SECTION */}
              <View style={styles.section}>
                <Text style={[styles.sectionTitle, { color: theme.text }]}>
                  Preferred schedule
                </Text>

                <View style={styles.scheduleRow}>
                  <CustomerDatePickerField
                    label="Preferred date"
                    fieldRef={bindField("preferredDate")}
                    invalid={invalidField === "preferredDate"}
                    required
                    value={form.preferredDate}
                    onChange={(v) => update("preferredDate", v)}
                    placeholder="DD/MM/YYYY"
                    minimumDate={new Date()}
                  />

                  <CustomerTimePickerField
                    label="Preferred time"
                    fieldRef={bindField("preferredTime")}
                    invalid={invalidField === "preferredTime"}
                    required
                    value={form.preferredTime}
                    onChange={(v) => update("preferredTime", v)}
                    placeholder="HH:MM"
                  />
                </View>

                <ServiceBookingField
                  label="Additional notes (optional)"
                  optional
                  value={form.notes}
                  onChangeText={(v) => update("notes", v)}
                  placeholder="Any specific requirements or information for the worker…"
                  multiline
                  maxLength={800}
                  icon="chatbox-ellipses-outline"
                />
              </View>

              {errorMessage ? (
                <View
                  style={[
                    styles.errorStrip,
                    { backgroundColor: theme.dangerSoft, borderLeftColor: theme.danger },
                  ]}
                >
                  <Ionicons name="alert-circle-outline" size={20} color={theme.danger} />
                  <Text style={[styles.errorText, { color: theme.danger }]}>
                    {errorMessage}
                  </Text>
                </View>
              ) : null}

              <View style={[styles.divider, { backgroundColor: theme.border }]} />

              {/* SUBMIT BUTTON */}
              <View style={styles.footer}>
                <Pressable
                  accessibilityRole="button"
                  disabled={isSubmitting}
                  onPress={() => void requestBooking()}
                  style={({ pressed }) => [
                    styles.submitButton,
                    { backgroundColor: theme.action },
                    isSubmitting && styles.disabled,
                    pressed && !isSubmitting && styles.pressed,
                  ]}
                >
                  {isSubmitting ? (
                    <ActivityIndicator size="small" color="#FFFFFF" />
                  ) : (
                    <Text style={styles.submitText}>Request booking</Text>
                  )}
                </Pressable>
              </View>
            </>
          ) : null}
        </KeyboardScreenContainer>
    </ScreenContainer>
  );
}

const styles = StyleSheet.create({
  screen: { paddingHorizontal: 0 },
  flex: { flex: 1 },
  content: {
    paddingHorizontal: spacing.xl,
    paddingTop: spacing.xxl,
    paddingBottom: spacing.xxxl,
  },

  loadingState: {
    minHeight: 320,
    alignItems: "center",
    justifyContent: "center",
    gap: spacing.sm,
    paddingHorizontal: spacing.xl,
  },
  loadingText: { fontSize: fontSize.sm, lineHeight: 21, textAlign: "center" },
  missingTitle: { fontSize: fontSize.lg, fontWeight: fontWeight.bold },

  hero: { gap: spacing.md },
  eyebrow: { fontSize: fontSize.xs, fontWeight: fontWeight.bold, letterSpacing: 1.4 },
  title: { fontSize: 30, lineHeight: 36, fontWeight: fontWeight.bold, letterSpacing: -0.7 },
  subtitle: { fontSize: fontSize.sm, lineHeight: 22 },

  serviceSummary: {
    marginTop: spacing.xl,
    borderWidth: 1,
    borderRadius: radius.lg,
    padding: spacing.lg,
    gap: 6,
  },
  summaryTitle: { fontSize: fontSize.lg, fontWeight: fontWeight.bold },
  summaryText: { fontSize: fontSize.sm, lineHeight: 21 },

  divider: {
    height: StyleSheet.hairlineWidth,
    marginVertical: spacing.xxl,
  },

  section: { gap: spacing.lg },
  sectionTitle: { fontSize: fontSize.xl, fontWeight: fontWeight.bold },
  fields: { gap: spacing.md },
  scheduleRow: { flexDirection: "row", gap: spacing.md },

  errorStrip: {
    minHeight: 54,
    marginTop: spacing.xl,
    flexDirection: "row",
    alignItems: "flex-start",
    gap: spacing.sm,
    borderLeftWidth: 3,
    borderRadius: 8,
    padding: spacing.md,
  },
  errorText: { flex: 1, fontSize: fontSize.sm, lineHeight: 20, fontWeight: fontWeight.semibold },

  footer: { gap: spacing.lg },
  submitButton: {
    minHeight: 54,
    alignItems: "center",
    justifyContent: "center",
    borderRadius: 16,
  },
  submitText: { color: "#FFFFFF", fontSize: fontSize.md, fontWeight: fontWeight.bold },

  disabled: { opacity: 0.6 },
  pressed: { opacity: 0.76, transform: [{ scale: 0.992 }] },
});
