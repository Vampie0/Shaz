import { Ionicons } from "@expo/vector-icons";
import { useQueryClient } from "@tanstack/react-query";
import { router } from "expo-router";
import { useState } from "react";
import {
  ActivityIndicator,
  Keyboard,
  KeyboardAvoidingView,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from "react-native";

import CustomerTopBar from "@/components/customer/CustomerTopBar";
import CustomerDatePickerField from "@/components/customer/form/CustomerDatePickerField";
import CustomerTimePickerField from "@/components/customer/form/CustomerTimePickerField";
import ScreenContainer from "@/components/ui/ScreenContainer";
import KeyboardScreenContainer from "@/components/ui/KeyboardScreenContainer";
import { fontSize, fontWeight, radius, spacing } from "@/constants/theme";
import { useAuth } from "@/features/auth/use-auth";
import { toastSuccess } from "@/features/toast/toast-store";
import { useAppTheme } from "@/hooks/use-app-theme";
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

export default function VehicleInspectionScreen() {
  const theme = useAppTheme();
  const { session } = useAuth();
  const queryClient = useQueryClient();

  const [form, setForm] = useState<InspectionForm>(initialForm);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const update = <K extends keyof InspectionForm>(
    key: K,
    value: InspectionForm[K],
  ) => {
    setForm((current) => ({ ...current, [key]: value }));
    if (errorMessage) setErrorMessage(null);
  };

  const handleRequestInspection = async () => {
    const customerId = session?.user.id;
    if (!customerId) {
      setErrorMessage("You need to be signed in to request an inspection.");
      return;
    }

    if (!form.registration.trim()) {
      setErrorMessage("Vehicle registration is required.");
      return;
    }

    // Explicit Year Validation if user typed a year
    if (form.year.trim()) {
      const yearNum = Number(form.year.trim());
      const currentYear = new Date().getFullYear();
      if (!Number.isInteger(yearNum) || yearNum < 1900 || yearNum > currentYear + 1) {
        setErrorMessage(`Please enter a valid 4-digit year between 1900 and ${currentYear + 1}.`);
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
    if (!form.postcode.trim()) {
      setErrorMessage("Postcode is required.");
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
        "Request Submitted"
      );

      setForm(initialForm);
      router.replace("/(customer)/(tabs)/inspections");
    } catch (err) {
      console.error("Inspection request error:", err);
      setErrorMessage(
        err instanceof Error ? err.message : "Could not request inspection. Please try again."
      );
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <ScreenContainer contentStyle={styles.screen}>
      <CustomerTopBar title="Vehicle Inspection" showBack />

      <KeyboardScreenContainer
        contentContainerStyle={[styles.content, { flexGrow: 1 }]}
        bottomPadding={160}
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
              An inspector visits the vehicle in person and produces a condition report. This is not DVLA certification, MOT certification, or ownership certification.
            </Text>

            {/* CHECKMARK BULLETS */}
            <View style={styles.bulletGrid}>
              <View style={styles.bulletItem}>
                <Ionicons name="checkmark-circle-outline" size={20} color={theme.success} />
                <Text style={[styles.bulletText, { color: theme.text }]}>
                  Physical vehicle inspection
                </Text>
              </View>

              <View style={styles.bulletItem}>
                <Ionicons name="checkmark-circle-outline" size={20} color={theme.success} />
                <Text style={[styles.bulletText, { color: theme.text }]}>
                  Condition assessment
                </Text>
              </View>

              <View style={styles.bulletItem}>
                <Ionicons name="checkmark-circle-outline" size={20} color={theme.success} />
                <Text style={[styles.bulletText, { color: theme.text }]}>
                  Photo evidence
                </Text>
              </View>

              <View style={styles.bulletItem}>
                <Ionicons name="checkmark-circle-outline" size={20} color={theme.success} />
                <Text style={[styles.bulletText, { color: theme.text }]}>
                  Detailed inspection report
                </Text>
              </View>
            </View>
          </View>

          <View style={[styles.divider, { backgroundColor: theme.border }]} />

          {/* FORM SECTION */}
          <View style={styles.formSection}>
            <View style={styles.formHeader}>
              <Text style={[styles.formTitle, { color: theme.text }]}>
                Request an inspection
              </Text>
              <Text style={[styles.formSubtitle, { color: theme.textSecondary }]}>
                Choose the inspection address and your preferred visit time.
              </Text>
            </View>

            <View style={styles.fields}>
              <InspectionField
                label="Vehicle registration *"
                value={form.registration}
                onChangeText={(v) => update("registration", v.toUpperCase())}
                placeholder="e.g. AB12 CDE"
                autoCapitalize="characters"
              />

              <InspectionField
                label="Make"
                value={form.make}
                onChangeText={(v) => update("make", v)}
                placeholder="e.g. BMW"
                autoCapitalize="words"
              />

              <InspectionField
                label="Model"
                value={form.model}
                onChangeText={(v) => update("model", v)}
                placeholder="e.g. 3 Series"
                autoCapitalize="words"
              />

              <InspectionField
                label="Year (if known)"
                value={form.year}
                onChangeText={(v) => update("year", v)}
                placeholder="e.g. 2022"
                keyboardType="number-pad"
              />

              <InspectionField
                label="Seller/contact name"
                value={form.contactName}
                onChangeText={(v) => update("contactName", v)}
                placeholder="Full name"
                autoCapitalize="words"
              />

              <InspectionField
                label="Seller/contact phone"
                value={form.contactPhone}
                onChangeText={(v) => update("contactPhone", v)}
                placeholder="Phone number"
                keyboardType="phone-pad"
              />

              <InspectionField
                label="Inspection address *"
                value={form.address}
                onChangeText={(v) => update("address", v)}
                placeholder="Street address"
                autoCapitalize="words"
              />

              <InspectionField
                label="City *"
                value={form.city}
                onChangeText={(v) => update("city", v)}
                placeholder="e.g. London"
                autoCapitalize="words"
              />

              <InspectionField
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

              <InspectionField
                label="Notes (optional)"
                value={form.notes}
                onChangeText={(v) => update("notes", v)}
                placeholder="Any special instructions or observations..."
                multiline
              />
            </View>

            {errorMessage ? (
              <View style={[styles.errorStrip, { backgroundColor: theme.dangerSoft, borderLeftColor: theme.danger }]}>
                <Ionicons name="alert-circle-outline" size={20} color={theme.danger} />
                <Text style={[styles.errorText, { color: theme.danger }]}>
                  {errorMessage}
                </Text>
              </View>
            ) : null}

            <Pressable
              accessibilityRole="button"
              disabled={isSubmitting}
              onPress={() => void handleRequestInspection()}
              style={({ pressed }) => [
                styles.submitButton,
                { backgroundColor: theme.primary },
                isSubmitting && styles.disabled,
                pressed && !isSubmitting && styles.pressed,
              ]}
            >
              {isSubmitting ? (
                <ActivityIndicator size="small" color="#FFFFFF" />
              ) : (
                <Text style={styles.submitButtonText}>Request inspection</Text>
              )}
            </Pressable>
          </View>
        </KeyboardScreenContainer>
    </ScreenContainer>
  );
}

function InspectionField({
  label,
  value,
  onChangeText,
  placeholder,
  keyboardType,
  autoCapitalize = "sentences",
  multiline = false,
}: {
  label: string;
  value: string;
  onChangeText: (v: string) => void;
  placeholder: string;
  keyboardType?: any;
  autoCapitalize?: any;
  multiline?: boolean;
}) {
  const theme = useAppTheme();

  return (
    <View style={styles.fieldWrap}>
      <Text style={[styles.fieldLabel, { color: theme.textSecondary }]}>
        {label}
      </Text>

      <View
        style={[
          styles.inputControl,
          multiline && styles.multilineControl,
          {
            backgroundColor: theme.surface,
            borderColor: theme.border,
          },
        ]}
      >
        <TextInput
          value={value}
          onChangeText={onChangeText}
          placeholder={placeholder}
          placeholderTextColor={theme.textMuted}
          keyboardType={keyboardType}
          autoCapitalize={autoCapitalize}
          multiline={multiline}
          textAlignVertical={multiline ? "top" : "center"}
          style={[
            styles.input,
            multiline && styles.multilineInput,
            { color: theme.text },
          ]}
        />
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  screen: { paddingHorizontal: 0 },
  flex: { flex: 1 },
  content: { paddingBottom: spacing.xxxl },

  hero: {
    paddingHorizontal: spacing.xl,
    paddingTop: spacing.xxl,
    gap: spacing.md,
  },
  eyebrow: { fontSize: fontSize.xs, fontWeight: fontWeight.bold, letterSpacing: 1.4 },
  title: { fontSize: 30, lineHeight: 36, fontWeight: fontWeight.bold, letterSpacing: -0.7 },
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
    marginVertical: spacing.xxl,
  },

  formSection: {
    paddingHorizontal: spacing.xl,
    gap: spacing.xl,
  },
  formHeader: {
    gap: 4,
  },
  formTitle: {
    fontSize: fontSize.xxl,
    fontWeight: fontWeight.bold,
  },
  formSubtitle: {
    fontSize: fontSize.sm,
    lineHeight: 20,
  },

  fields: {
    gap: spacing.md,
  },
  fieldWrap: {
    gap: 7,
  },
  fieldLabel: {
    fontSize: fontSize.xs,
    fontWeight: fontWeight.bold,
  },
  inputControl: {
    minHeight: 52,
    flexDirection: "row",
    alignItems: "center",
    borderWidth: 1,
    borderRadius: radius.lg,
    paddingHorizontal: spacing.md,
  },
  multilineControl: {
    minHeight: 120,
    alignItems: "flex-start",
    paddingTop: spacing.sm,
  },
  input: {
    flex: 1,
    minHeight: 48,
    fontSize: fontSize.md,
  },
  multilineInput: {
    minHeight: 100,
    paddingTop: 8,
    lineHeight: 22,
  },

  scheduleRow: {
    flexDirection: "row",
    gap: spacing.md,
  },

  errorStrip: {
    minHeight: 54,
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

  submitButton: {
    minHeight: 54,
    alignItems: "center",
    justifyContent: "center",
    borderRadius: 16,
    marginTop: spacing.md,
  },
  submitButtonText: {
    color: "#FFFFFF",
    fontSize: fontSize.md,
    fontWeight: fontWeight.bold,
  },

  disabled: {
    opacity: 0.6,
  },
  pressed: {
    opacity: 0.75,
  },
});
