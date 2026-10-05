import { Ionicons } from "@expo/vector-icons";
import { useQueryClient } from "@tanstack/react-query";
import { useLocalSearchParams } from "expo-router";
import { useEffect, useRef, useState } from "react";
import { Keyboard, StyleSheet, Text, View } from "react-native";

import CustomerTopBar from "@/components/customer/CustomerTopBar";
import CustomerDatePickerField from "@/components/customer/form/CustomerDatePickerField";
import CustomerTimePickerField from "@/components/customer/form/CustomerTimePickerField";
import AppButton from "@/components/ui/AppButton";
import AppInput from "@/components/ui/AppInput";
import AppLoadingOverlay from "@/components/ui/AppLoadingOverlay";
import KeyboardScreenContainer from "@/components/ui/KeyboardScreenContainer";
import ScreenContainer from "@/components/ui/ScreenContainer";
import { fontSize, fontWeight, radius, spacing } from "@/constants/theme";
import { useAuth } from "@/features/auth/use-auth";
import { toastSuccess } from "@/features/toast/toast-store";
import { useAppTheme } from "@/hooks/use-app-theme";
import { useSingleNavigation } from "@/hooks/use-single-navigation";
import { createCustomerInspectionRequest } from "@/services/customer/customer-inspection-detail.service";

type InspectionForm = {
  registration: string;
  make: string;
  model: string;
  year: string;
  contactName: string;
  contactPhone: string;
  address: string;
  city: string;
  postcode: string;
  preferredDate: string;
  preferredTime: string;
  notes: string;
};

const initialForm: InspectionForm = {
  registration: "",
  make: "",
  model: "",
  year: "",
  contactName: "",
  contactPhone: "",
  address: "",
  city: "",
  postcode: "",
  preferredDate: "",
  preferredTime: "",
  notes: "",
};

const postcodeRegex = /^[A-Z]{1,2}\d[A-Z\d]?\s?\d[A-Z]{2}$/i;

export default function VehicleInspectionScreen() {
  const theme = useAppTheme();
  const { profile, session } = useAuth();
  const queryClient = useQueryClient();
  const scrollRef = useRef<any>(null);
  const { navigate } = useSingleNavigation();

  const params = useLocalSearchParams<{
    carId?: string;
    registration?: string;
    make?: string;
    model?: string;
    year?: string;
  }>();

  const isLinkedCar = Boolean(params.carId);

  const [form, setForm] = useState<InspectionForm>(() => ({
    ...initialForm,
    registration: params.registration || "",
    make: params.make || "",
    model: params.model || "",
    year: params.year || "",
  }));

  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  useEffect(() => {
    if (params.registration) {
      setForm((curr) => ({
        ...curr,
        registration: params.registration || curr.registration,
        make: params.make || curr.make,
        model: params.model || curr.model,
        year: params.year || curr.year,
      }));
    }
  }, [params.registration, params.make, params.model, params.year]);

  useEffect(() => {
    if (profile?.full_name && !form.contactName) {
      setForm((curr) => ({ ...curr, contactName: profile.full_name || "" }));
    }
    if (profile?.phone && !form.contactPhone) {
      setForm((curr) => ({ ...curr, contactPhone: profile.phone || "" }));
    }
  }, [profile]);

  const update = <K extends keyof InspectionForm>(
    key: K,
    value: InspectionForm[K],
  ) => {
    setForm((current) => ({ ...current, [key]: value }));
    if (errorMessage) setErrorMessage(null);
  };

  // SMART SCROLL TO BOTTOM (Jab aakhri field focus ho to button ko sath upar lao)
  const handleScrollToBottom = () => {
    setTimeout(() => {
      const scroller = scrollRef.current;
      if (scroller) {
        if (typeof scroller.scrollToEnd === "function") {
          scroller.scrollToEnd({ animated: true });
        } else if (typeof scroller.scrollToPosition === "function") {
          scroller.scrollToPosition(0, 99999, true);
        }
      }
    }, 120);
  };

  const handleRequestInspection = async () => {
    const customerId = session?.user.id;
    if (!customerId) {
      setErrorMessage("You need to be signed in to request an inspection.");
      return;
    }

    if (!isLinkedCar) {
      if (!form.registration.trim()) {
        setErrorMessage("Vehicle registration is required.");
        return;
      }
      if (!form.make.trim()) {
        setErrorMessage("Vehicle make is required.");
        return;
      }
      if (!form.model.trim()) {
        setErrorMessage("Vehicle model is required.");
        return;
      }
      if (!form.contactName.trim()) {
        setErrorMessage("Seller/contact name is required.");
        return;
      }
      if (!form.contactPhone.trim()) {
        setErrorMessage("Seller/contact phone is required.");
        return;
      }
    }

    if (!form.address.trim()) {
      setErrorMessage("Inspection address is required.");
      return;
    }
    if (!form.city.trim()) {
      setErrorMessage("City is required.");
      return;
    }
    if (!form.postcode.trim() || !postcodeRegex.test(form.postcode.trim())) {
      setErrorMessage("Please enter a valid UK postcode (e.g. SW1A 1AA).");
      return;
    }
    if (!form.preferredDate.trim()) {
      setErrorMessage("Preferred date is required.");
      return;
    }
    if (!form.preferredTime.trim()) {
      setErrorMessage("Preferred time is required.");
      return;
    }

    Keyboard.dismiss();
    setIsSubmitting(true);
    setErrorMessage(null);

    try {
      await createCustomerInspectionRequest({
        customerId,
        carId: params.carId || null,
        registration: form.registration,
        make: form.make,
        model: form.model,
        year: form.year,
        contactName: form.contactName,
        contactPhone: form.contactPhone,
        address: form.address,
        city: form.city,
        postcode: form.postcode,
        preferredDate: form.preferredDate,
        preferredTime: form.preferredTime,
        notes: form.notes,
      });

      await queryClient.invalidateQueries({
        queryKey: ["customer-dashboard", customerId],
      });

      toastSuccess(
        "Vehicle inspection requested successfully!",
        "Request Submitted",
      );

      setForm(initialForm);
      navigate("/(customer)/(tabs)/inspections");
    } catch (err: any) {
      console.error("Inspection request error:", err);
      setErrorMessage(
        err instanceof Error
          ? err.message
          : "Could not request inspection. Please try again.",
      );
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <ScreenContainer contentStyle={styles.screen}>
      <CustomerTopBar title="Vehicle Inspection" showMenu />

      <KeyboardScreenContainer
        scrollRef={scrollRef}
        bottomPadding={280}
        contentContainerStyle={styles.scrollContent}
      >
        {/* HERO SECTION */}
        <View style={styles.hero}>
          <Text style={[styles.eyebrow, { color: theme.primary }]}>
            VEHICLE INSPECTION
          </Text>

          <Text style={[styles.title, { color: theme.text }]}>
            Request a physical vehicle inspection
          </Text>

          <Text style={[styles.subtitle, { color: theme.textSecondary }]}>
            An inspector visits the vehicle in person and produces a condition
            report. This is not DVLA certification, MOT certification, or
            ownership certification.
          </Text>

          {/* CHECKLIST */}
          <View style={styles.bulletGrid}>
            <View style={styles.bulletItem}>
              <Ionicons
                name="checkmark-circle-outline"
                size={18}
                color={theme.success}
              />
              <Text style={[styles.bulletText, { color: theme.text }]}>
                Physical vehicle inspection
              </Text>
            </View>

            <View style={styles.bulletItem}>
              <Ionicons
                name="checkmark-circle-outline"
                size={18}
                color={theme.success}
              />
              <Text style={[styles.bulletText, { color: theme.text }]}>
                Condition assessment
              </Text>
            </View>

            <View style={styles.bulletItem}>
              <Ionicons
                name="checkmark-circle-outline"
                size={18}
                color={theme.success}
              />
              <Text style={[styles.bulletText, { color: theme.text }]}>
                Photo evidence
              </Text>
            </View>

            <View style={styles.bulletItem}>
              <Ionicons
                name="checkmark-circle-outline"
                size={18}
                color={theme.success}
              />
              <Text style={[styles.bulletText, { color: theme.text }]}>
                Detailed inspection report
              </Text>
            </View>
          </View>
        </View>

        <View style={[styles.divider, { backgroundColor: theme.border }]} />

        {/* LINKED VEHICLE PREVIEW */}
        {isLinkedCar ? (
          <View
            style={[
              styles.previewCard,
              {
                backgroundColor: theme.surface,
                borderColor: theme.border,
              },
            ]}
          >
            <View style={styles.previewTop}>
              <View
                style={[
                  styles.previewIconBox,
                  { backgroundColor: theme.surfaceSecondary },
                ]}
              >
                <Ionicons
                  name="car-sport-outline"
                  size={24}
                  color={theme.primary}
                />
              </View>

              <View style={styles.previewCopy}>
                <Text style={[styles.previewEyebrow, { color: theme.primary }]}>
                  VEHICLE TO INSPECT
                </Text>
                <Text style={[styles.previewTitle, { color: theme.text }]}>
                  {[form.year, form.make, form.model]
                    .filter(Boolean)
                    .join(" ") || "Selected Vehicle"}
                </Text>
                {form.registration ? (
                  <Text
                    style={[
                      styles.previewSubtitle,
                      { color: theme.textSecondary },
                    ]}
                  >
                    Registration: {form.registration}
                  </Text>
                ) : null}
              </View>
            </View>
          </View>
        ) : null}

        {/* FORM SECTION */}
        <View style={styles.formSection}>
          <View style={styles.formHeader}>
            <Text style={[styles.formTitle, { color: theme.text }]}>
              {isLinkedCar
                ? "Request Shaz Inspection"
                : "Request an inspection"}
            </Text>
            <Text style={[styles.formSubtitle, { color: theme.textSecondary }]}>
              {isLinkedCar
                ? "Choose the inspection address and preferred visit time for your vehicle."
                : "Choose the inspection address and your preferred visit time."}
            </Text>
          </View>

          <View style={styles.fields}>
            {!isLinkedCar ? (
              <>
                <AppInput
                  label="Vehicle registration *"
                  value={form.registration}
                  onChangeText={(v) => update("registration", v.toUpperCase())}
                  placeholder="e.g. AB12 CDE"
                  autoCapitalize="characters"
                />

                <AppInput
                  label="Make *"
                  value={form.make}
                  onChangeText={(v) => update("make", v)}
                  placeholder="e.g. BMW"
                  autoCapitalize="words"
                />

                <AppInput
                  label="Model *"
                  value={form.model}
                  onChangeText={(v) => update("model", v)}
                  placeholder="e.g. 3 Series"
                  autoCapitalize="words"
                />

                <AppInput
                  label="Year (if known)"
                  value={form.year}
                  onChangeText={(v) => update("year", v)}
                  placeholder="e.g. 2022"
                  keyboardType="number-pad"
                />

                <AppInput
                  label="Seller/contact name *"
                  value={form.contactName}
                  onChangeText={(v) => update("contactName", v)}
                  placeholder="Full name"
                  autoCapitalize="words"
                />

                <AppInput
                  label="Seller/contact phone *"
                  value={form.contactPhone}
                  onChangeText={(v) => update("contactPhone", v)}
                  placeholder="Phone number"
                  keyboardType="phone-pad"
                />
              </>
            ) : null}

            <AppInput
              label="Inspection address *"
              value={form.address}
              onChangeText={(v) => update("address", v)}
              placeholder="Street address"
              autoCapitalize="words"
            />

            <AppInput
              label="City *"
              value={form.city}
              onChangeText={(v) => update("city", v)}
              placeholder="e.g. London"
              autoCapitalize="words"
            />

            <AppInput
              label="Postcode *"
              value={form.postcode}
              onChangeText={(v) => update("postcode", v.toUpperCase())}
              placeholder="e.g. SW1A 1AA"
              autoCapitalize="characters"
            />

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

            {/* AAKHRI FIELD (NOTES) - FOCUS HOTE HI AUTO-SCROLL TO BOTTOM */}
            <AppInput
              label="Notes (optional)"
              value={form.notes}
              onChangeText={(v) => update("notes", v)}
              placeholder="Any special instructions or observations..."
              multiline
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

          {/* SUBMIT BUTTON */}
          <View style={styles.actionArea}>
            <AppButton
              title={
                isLinkedCar ? "Request Shaz Inspection" : "Request inspection"
              }
              onPress={handleRequestInspection}
              loading={isSubmitting}
            />
          </View>
        </View>
      </KeyboardScreenContainer>

      {/* CUSTOM OVERLAY LOADER */}
      <AppLoadingOverlay
        visible={isSubmitting}
        message="Submitting inspection request..."
      />
    </ScreenContainer>
  );
}

const styles = StyleSheet.create({
  screen: { paddingHorizontal: 0 },
  scrollContent: {
    flexGrow: 1,
    paddingTop: spacing.lg,
  },
  hero: {
    paddingHorizontal: spacing.xl,
    gap: spacing.md,
  },
  eyebrow: {
    fontSize: fontSize.xs,
    fontWeight: fontWeight.bold,
    letterSpacing: 1.4,
  },
  title: {
    fontSize: 28,
    lineHeight: 34,
    fontWeight: fontWeight.bold,
    letterSpacing: -0.7,
  },
  subtitle: { fontSize: fontSize.sm, lineHeight: 22 },
  bulletGrid: {
    marginTop: spacing.sm,
    gap: spacing.sm,
  },
  bulletItem: {
    flexDirection: "row",
    alignItems: "center",
    gap: spacing.sm,
  },
  bulletText: {
    fontSize: fontSize.sm,
    fontWeight: fontWeight.semibold,
  },
  divider: {
    height: StyleSheet.hairlineWidth,
    marginHorizontal: spacing.xl,
    marginVertical: spacing.xl,
  },

  previewCard: {
    marginHorizontal: spacing.xl,
    marginBottom: spacing.xl,
    borderWidth: 1,
    borderRadius: radius.xl,
    padding: spacing.lg,
  },
  previewTop: {
    flexDirection: "row",
    alignItems: "center",
    gap: spacing.md,
  },
  previewIconBox: {
    width: 46,
    height: 46,
    borderRadius: radius.md,
    alignItems: "center",
    justifyContent: "center",
  },
  previewCopy: {
    flex: 1,
    gap: 3,
  },
  previewEyebrow: {
    fontSize: 10,
    fontWeight: fontWeight.bold,
    letterSpacing: 1,
  },
  previewTitle: {
    fontSize: fontSize.md,
    fontWeight: fontWeight.bold,
  },
  previewSubtitle: {
    fontSize: fontSize.xs,
  },

  formSection: {
    paddingHorizontal: spacing.xl,
    gap: spacing.xl,
  },
  formHeader: {
    gap: 4,
  },
  formTitle: {
    fontSize: fontSize.xl,
    fontWeight: fontWeight.bold,
  },
  formSubtitle: {
    fontSize: fontSize.sm,
    lineHeight: 20,
  },
  fields: {
    gap: spacing.md,
  },
  scheduleRow: {
    flexDirection: "row",
    gap: spacing.md,
  },
  notesInput: {
    minHeight: 88,
    paddingTop: 10,
    textAlignVertical: "top",
  },

  errorStrip: {
    minHeight: 52,
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
    marginTop: spacing.sm,
    marginBottom: spacing.md,
  },
});
