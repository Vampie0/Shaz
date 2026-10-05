import { Ionicons } from "@expo/vector-icons";
import { useQueryClient } from "@tanstack/react-query";
import { useFocusEffect, useLocalSearchParams } from "expo-router";
import { useCallback, useMemo, useRef, useState } from "react";
import { Keyboard, StyleSheet, Text, View } from "react-native";

import CustomerFlowTopBar from "@/components/customer/CustomerFlowTopBar";
import CustomerDatePickerField from "@/components/customer/form/CustomerDatePickerField";
import CustomerTimePickerField from "@/components/customer/form/CustomerTimePickerField";
import AppButton from "@/components/ui/AppButton";
import AppInput from "@/components/ui/AppInput";
import AppLoadingOverlay from "@/components/ui/AppLoadingOverlay";
import KeyboardScreenContainer from "@/components/ui/KeyboardScreenContainer";
import ScreenContainer from "@/components/ui/ScreenContainer";
import { fontSize, fontWeight, radius, spacing } from "@/constants/theme";
import { useAuth } from "@/features/auth/use-auth";
import { useCustomerMobileServices } from "@/features/customer/use-customer-mobile-services";
import { toastSuccess } from "@/features/toast/toast-store";
import { useAppTheme } from "@/hooks/use-app-theme";
import { useSingleNavigation } from "@/hooks/use-single-navigation";
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
  return "£" + value.toLocaleString("en-GB", { maximumFractionDigits: 0 });
}

const postcodeRegex = /^[A-Z]{1,2}\d[A-Z\d]?\s?\d[A-Z]{2}$/i;

export default function BookServiceScreen() {
  const theme = useAppTheme();
  const { navigate } = useSingleNavigation();
  const params = useLocalSearchParams<{ serviceId?: string }>();
  const serviceId =
    typeof params.serviceId === "string" ? params.serviceId : "";

  const { session } = useAuth();
  const queryClient = useQueryClient();
  const servicesQuery = useCustomerMobileServices();
  const scrollRef = useRef<any>(null);

  const service = useMemo(
    () => servicesQuery.data?.find((item) => item.id === serviceId) ?? null,
    [servicesQuery.data, serviceId],
  );

  const [form, setForm] = useState<BookingForm>(initialForm);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  useFocusEffect(
    useCallback(() => {
      setForm(initialForm);
      setErrorMessage(null);
    }, [serviceId]),
  );

  const update = <K extends keyof BookingForm>(
    key: K,
    value: BookingForm[K],
  ) => {
    setForm((current) => ({ ...current, [key]: value }));
    if (errorMessage) setErrorMessage(null);
  };

  const handleScrollToBottom = () => {
    setTimeout(() => {
      const scroller = scrollRef.current;
      if (!scroller) return;

      const responder =
        typeof scroller.getScrollResponder === "function"
          ? scroller.getScrollResponder()
          : scroller;

      if (responder && typeof responder.scrollToEnd === "function") {
        responder.scrollToEnd({ animated: true });
      } else if (typeof scroller.scrollToPosition === "function") {
        scroller.scrollToPosition(0, 99999, true);
      }
    }, 180);
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

    if (!form.carMake.trim())
      return setErrorMessage("Vehicle make is required.");
    if (!form.carModel.trim())
      return setErrorMessage("Vehicle model is required.");
    if (!form.postcode.trim() || !postcodeRegex.test(form.postcode.trim())) {
      return setErrorMessage(
        "Please enter a valid UK postcode (e.g. SW1A 1AA).",
      );
    }
    if (!form.addressLine1.trim())
      return setErrorMessage("Address line 1 is required.");
    if (!form.city.trim()) return setErrorMessage("City is required.");
    if (!form.preferredDate.trim())
      return setErrorMessage("Preferred date is required.");
    if (!form.preferredTime.trim())
      return setErrorMessage("Preferred time is required.");

    Keyboard.dismiss();
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
        "Booking requested. Your preferred time will be confirmed by our team.",
        "Booking Requested",
      );

      setForm(initialForm);
      navigate("/(customer)/(tabs)/bookings");
    } catch (error: any) {
      setErrorMessage(
        error instanceof Error
          ? error.message
          : "Could not request the booking.",
      );
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <ScreenContainer contentStyle={styles.screen}>
      <CustomerFlowTopBar title="Book Service" />

      <KeyboardScreenContainer
        scrollRef={scrollRef}
        bottomPadding={300}
        contentContainerStyle={styles.content}
      >
        {!servicesQuery.isLoading && !service ? (
          <View style={styles.state}>
            <Ionicons
              name="alert-circle-outline"
              size={32}
              color={theme.primary}
            />
            <Text style={[styles.stateTitle, { color: theme.text }]}>
              Service unavailable
            </Text>
            <Text style={[styles.stateText, { color: theme.textSecondary }]}>
              Go back to Mobile Services and choose an available service.
            </Text>
          </View>
        ) : null}

        {service ? (
          <>
            <View style={styles.hero}>
              <Text style={[styles.eyebrow, { color: theme.primary }]}>
                MOBILE SERVICE BOOKING
              </Text>
              <Text style={[styles.title, { color: theme.text }]}>
                Book {service.name}
              </Text>
              <Text style={[styles.subtitle, { color: theme.textSecondary }]}>
                Choose your preferred visit time. We will confirm the final
                appointment after reviewing the request.
              </Text>
            </View>

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
              <Text
                style={[styles.summaryText, { color: theme.textSecondary }]}
              >
                From {formatPrice(service.basePrice)}. Your preferred time is
                confirmed by our team.
              </Text>
            </View>

            <View style={[styles.divider, { backgroundColor: theme.border }]} />

            <View style={styles.formSection}>
              <Text style={[styles.formTitle, { color: theme.text }]}>
                Vehicle details
              </Text>
              <View style={styles.fields}>
                <AppInput
                  label="Vehicle make *"
                  value={form.carMake}
                  onChangeText={(v) => update("carMake", v)}
                  placeholder="e.g. BMW"
                  autoCapitalize="words"
                />
                <AppInput
                  label="Vehicle model *"
                  value={form.carModel}
                  onChangeText={(v) => update("carModel", v)}
                  placeholder="e.g. 3 Series"
                  autoCapitalize="words"
                />
                <AppInput
                  label="Registration (optional)"
                  value={form.carRegistration}
                  onChangeText={(v) =>
                    update("carRegistration", v.toUpperCase())
                  }
                  placeholder="e.g. AB12 CDE"
                  autoCapitalize="characters"
                />
              </View>
            </View>

            <View style={[styles.divider, { backgroundColor: theme.border }]} />

            <View style={styles.formSection}>
              <Text style={[styles.formTitle, { color: theme.text }]}>
                Location
              </Text>
              <View style={styles.fields}>
                <AppInput
                  label="Postcode *"
                  value={form.postcode}
                  onChangeText={(v) => update("postcode", v.toUpperCase())}
                  placeholder="e.g. SW1A 1AA"
                  autoCapitalize="characters"
                />
                <AppInput
                  label="Address line 1 *"
                  value={form.addressLine1}
                  onChangeText={(v) => update("addressLine1", v)}
                  placeholder="House number and street"
                  autoCapitalize="words"
                />
                <AppInput
                  label="Address line 2 (optional)"
                  value={form.addressLine2}
                  onChangeText={(v) => update("addressLine2", v)}
                  placeholder="Apartment, building, area"
                  autoCapitalize="words"
                />
                <AppInput
                  label="City *"
                  value={form.city}
                  onChangeText={(v) => update("city", v)}
                  placeholder="e.g. London"
                  autoCapitalize="words"
                />
              </View>
            </View>

            <View style={[styles.divider, { backgroundColor: theme.border }]} />

            <View style={styles.formSection}>
              <Text style={[styles.formTitle, { color: theme.text }]}>
                Preferred schedule
              </Text>
              <View style={styles.scheduleRow}>
                <CustomerDatePickerField
                  label="Preferred date *"
                  value={form.preferredDate}
                  onChange={(v) => update("preferredDate", v)}
                  placeholder="DD/MM/YYYY"
                  minimumDate={new Date()}
                />
                <CustomerTimePickerField
                  label="Preferred time *"
                  value={form.preferredTime}
                  onChange={(v) => update("preferredTime", v)}
                  placeholder="HH:MM"
                />
              </View>

              <AppInput
                label="Additional notes (optional)"
                value={form.notes}
                onChangeText={(v) => update("notes", v)}
                placeholder="Any specific requirements or information for the worker..."
                multiline
                scrollEnabled={false}
                numberOfLines={4}
                returnKeyType="done"
                blurOnSubmit={true}
                onSubmitEditing={Keyboard.dismiss}
                onFocus={handleScrollToBottom}
                style={styles.notesInput}
              />
            </View>

            {errorMessage ? (
              <View
                style={[
                  styles.errorStrip,
                  {
                    backgroundColor: theme.dangerSoft,
                    borderLeftColor: theme.danger,
                  },
                ]}
              >
                <Ionicons
                  name="alert-circle-outline"
                  size={20}
                  color={theme.danger}
                />
                <Text style={[styles.errorText, { color: theme.danger }]}>
                  {errorMessage}
                </Text>
              </View>
            ) : null}

            <View style={styles.actionArea}>
              <AppButton
                title="Request booking"
                onPress={requestBooking}
                loading={isSubmitting}
              />
            </View>
          </>
        ) : null}
      </KeyboardScreenContainer>

      <AppLoadingOverlay
        visible={isSubmitting || servicesQuery.isLoading}
        message={isSubmitting ? "Submitting booking..." : "Loading service…"}
      />
    </ScreenContainer>
  );
}

const styles = StyleSheet.create({
  screen: { paddingHorizontal: 0 },
  content: {
    paddingHorizontal: spacing.xl,
    paddingTop: spacing.xxl,
    paddingBottom: spacing.lg,
  },
  state: {
    flex: 1,
    minHeight: 320,
    alignItems: "center",
    justifyContent: "center",
    gap: spacing.sm,
  },
  stateTitle: { fontSize: fontSize.lg, fontWeight: fontWeight.bold },
  stateText: { fontSize: fontSize.sm, textAlign: "center" },
  hero: { gap: spacing.md },
  eyebrow: {
    fontSize: fontSize.xs,
    fontWeight: fontWeight.bold,
    letterSpacing: 1.4,
  },
  title: {
    fontSize: 30,
    lineHeight: 36,
    fontWeight: fontWeight.bold,
    letterSpacing: -0.7,
  },
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
  formSection: { gap: spacing.xl },
  formTitle: { fontSize: fontSize.xl, fontWeight: fontWeight.bold },
  fields: { gap: spacing.md },
  scheduleRow: { flexDirection: "row", gap: spacing.md },
  notesInput: {
    minHeight: 88,
    paddingTop: 10,
    textAlignVertical: "top",
  },
  errorStrip: {
    minHeight: 52,
    marginTop: spacing.sm,
    flexDirection: "row",
    alignItems: "flex-start",
    gap: spacing.sm,
    borderLeftWidth: 3,
    borderRadius: 8,
    padding: spacing.md,
  },
  errorText: {
    flex: 1,
    fontSize: fontSize.sm,
    lineHeight: 20,
    fontWeight: fontWeight.semibold,
  },
  actionArea: {
    marginTop: spacing.xl,
    marginBottom: spacing.md,
  },
});
