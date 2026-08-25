import { Ionicons } from "@expo/vector-icons";
import { useQueryClient } from "@tanstack/react-query";
import { Image } from "expo-image";
import * as ImagePicker from "expo-image-picker";
import { router, useLocalSearchParams } from "expo-router";
import { useEffect, useMemo, useState } from "react";
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

import CustomerTopBar from "@/components/customer/CustomerTopBar";
import CustomerDatePickerField from "@/components/customer/form/CustomerDatePickerField";
import SellCarField from "@/components/customer/sell/SellCarField";
import SellCarSectionHeader from "@/components/customer/sell/SellCarSectionHeader";
import SellCarSelect from "@/components/customer/sell/SellCarSelect";
import AppModal from "@/components/ui/AppModal";
import ScreenContainer from "@/components/ui/ScreenContainer";
import KeyboardScreenContainer from "@/components/ui/KeyboardScreenContainer";
import { fontSize, fontWeight, radius, spacing } from "@/constants/theme";
import { useAuth } from "@/features/auth/use-auth";
import type {
  SellCarDraftForm,
  SellCarFuelType,
  SellCarTransmission,
  SellCarUlez,
} from "@/features/customer/sell-car/types";
import { toastError, toastSuccess } from "@/features/toast/toast-store";
import { useAppTheme } from "@/hooks/use-app-theme";
import { useInvalidFieldScroll } from "@/hooks/use-invalid-field-scroll";
import {
  createSellCarDraft,
  deleteCarListingPhoto,
  fetchCarDraftDetail,
  fetchCarListingPhotos,
  submitCarForReview,
  updateCarDraft,
  uploadCarListingPhoto,
  type CarListingPhoto,
} from "@/services/customer/sell-car.service";

type OpenSelect = "fuel" | "transmission" | "serviceHistory" | "ulez" | null;

const initialForm: SellCarDraftForm = {
  make: "",
  model: "",
  variant: "",
  year: "",
  price: "",
  mileage: "",
  fuelType: "",
  transmission: "",
  bodyType: "",
  engineSize: "",
  colour: "",
  registration: "",
  city: "",
  postcode: "",
  motExpiry: "",
  serviceHistory: "Not stated",
  ulez: "not_stated",
  description: "",
};

const fuelOptions: Array<{ label: string; value: SellCarFuelType }> = [
  { label: "Petrol", value: "petrol" },
  { label: "Diesel", value: "diesel" },
  { label: "Hybrid", value: "hybrid" },
  { label: "Electric", value: "electric" },
];

const transmissionOptions: Array<{ label: string; value: SellCarTransmission }> = [
  { label: "Manual", value: "manual" },
  { label: "Automatic", value: "automatic" },
];

const serviceHistoryOptions = [
  { label: "Not stated", value: "Not stated" },
  { label: "Full service history", value: "Full service history" },
  { label: "Partial service history", value: "Partial service history" },
  { label: "No service history", value: "No service history" },
];

const ulezOptions: Array<{ label: string; value: SellCarUlez }> = [
  { label: "Not stated", value: "not_stated" },
  { label: "Compliant", value: "compliant" },
  { label: "Not compliant", value: "not_compliant" },
];

type SellValidationKey =
  | "make"
  | "model"
  | "year"
  | "price"
  | "mileage"
  | "fuelType"
  | "transmission"
  | "city"
  | "postcode";

function validateForm(form: SellCarDraftForm) {
  const required: Array<[SellValidationKey, string]> = [
    ["make", "Make"],
    ["model", "Model"],
    ["year", "Year"],
    ["price", "Price"],
    ["mileage", "Mileage"],
  ];

  for (const [key, label] of required) {
    const value = form[key];
    if (typeof value === "string" && !value.trim()) {
      return { key, message: `${label} is required.` };
    }
  }

  if (!form.fuelType) return { key: "fuelType" as SellValidationKey, message: "Choose a fuel type." };
  if (!form.transmission) return { key: "transmission" as SellValidationKey, message: "Choose a transmission." };
  if (!form.city.trim()) return { key: "city" as SellValidationKey, message: "City is required." };
  if (!form.postcode.trim()) return { key: "postcode" as SellValidationKey, message: "Postcode is required." };

  const year = Number(form.year);
  const currentYear = new Date().getFullYear();
  if (!Number.isInteger(year) || year < 1900 || year > currentYear + 1) {
    return { key: "year" as SellValidationKey, message: "Enter a valid vehicle year." };
  }

  const price = Number(form.price.replace(/,/g, ""));
  if (!Number.isFinite(price) || price <= 0) {
    return { key: "price" as SellValidationKey, message: "Enter a valid price." };
  }

  const mileage = Number(form.mileage.replace(/,/g, ""));
  if (!Number.isFinite(mileage) || mileage < 0) {
    return { key: "mileage" as SellValidationKey, message: "Enter a valid mileage." };
  }

  return null;
}

export default function SellMyCarScreen() {
  const theme = useAppTheme();
  const { session } = useAuth();
  const queryClient = useQueryClient();

  const params = useLocalSearchParams<{ editCarId?: string }>();
  const editCarId = typeof params.editCarId === "string" ? params.editCarId : null;

  const [step, setStep] = useState<1 | 2 | 3>(1);
  const [createdCarId, setCreatedCarId] = useState<string | null>(editCarId);
  const [carLabel, setCarLabel] = useState<string>("");
  const [carStatus, setCarStatus] = useState<string>("draft");

  const [form, setForm] = useState<SellCarDraftForm>(initialForm);
  const [openSelect, setOpenSelect] = useState<OpenSelect>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [isSaving, setIsSaving] = useState(false);
  const [isSubmittingReview, setIsSubmittingReview] = useState(false);

  const [photos, setPhotos] = useState<CarListingPhoto[]>([]);
  const [isUploadingPhoto, setIsUploadingPhoto] = useState(false);
  const [pickerModalVisible, setPickerModalVisible] = useState(false);

  const [invalidField, setInvalidField] = useState<SellValidationKey | null>(null);
  const { scrollRef, bindField, onScroll, scrollToField } = useInvalidFieldScroll<SellValidationKey>();

  const userId = session?.user.id;
  const canSubmit = Boolean(userId) && !isSaving;

  useEffect(() => {
    if (!editCarId || !userId) return;

    async function loadDraft() {
      try {
        setIsSaving(true);
        const { form: fetchedForm } = await fetchCarDraftDetail(editCarId!, userId!);
        setForm(fetchedForm);

        const label = [fetchedForm.year, fetchedForm.make, fetchedForm.model].filter(Boolean).join(" ");
        setCarLabel(label || "Vehicle");
        setCreatedCarId(editCarId);
        if (raw?.status) setCarStatus(raw.status);

        const loadedPhotos = await fetchCarListingPhotos(editCarId!);
        setPhotos(loadedPhotos);
      } catch (err) {
        console.error("Failed to load draft:", err);
        toastError("Could not load car draft details.");
      } finally {
        setIsSaving(false);
      }
    }

    void loadDraft();
  }, [editCarId, userId]);

  const update = <K extends keyof SellCarDraftForm>(key: K, value: SellCarDraftForm[K]) => {
    setForm((current) => ({ ...current, [key]: value }));
    if (invalidField === key) {
      if (typeof value === "string" ? value.trim() : value) {
        setInvalidField(null);
        setErrorMessage(null);
      }
    }
  };

  const descriptionCount = useMemo(() => form.description.length, [form.description]);

  const saveDraftAndProceed = async () => {
    if (!userId) {
      setErrorMessage("You need to be signed in to save a listing.");
      return;
    }

    const validationError = validateForm(form);
    if (validationError) {
      setErrorMessage(validationError.message);
      setInvalidField(validationError.key);
      setOpenSelect(null);
      Keyboard.dismiss();
      setTimeout(() => scrollToField(validationError.key), 120);
      return;
    }

    setInvalidField(null);
    setIsSaving(true);
    setErrorMessage(null);

    try {
      let carId = createdCarId;
      const label = [form.year, form.make, form.model, form.variant].filter(Boolean).join(" ");

      if (carId) {
        await updateCarDraft(carId, userId, form);
      } else {
        carId = await createSellCarDraft(userId, form);
      }

      setCreatedCarId(carId);
      setCarLabel(label || "Vehicle");

      await queryClient.invalidateQueries({
        queryKey: ["customer-dashboard", userId],
      });

      const loadedPhotos = await fetchCarListingPhotos(carId);
      setPhotos(loadedPhotos);

      setStep(2);
    } catch (error) {
      const message = error instanceof Error ? error.message : "Could not save the draft.";
      setErrorMessage(message);
    } finally {
      setIsSaving(false);
    }
  };

  const chooseAndUploadPhoto = async (source: "camera" | "library") => {
    if (!createdCarId || !userId || isUploadingPhoto) return;

    try {
      if (source === "camera") {
        const perm = await ImagePicker.requestCameraPermissionsAsync();
        if (!perm.granted) {
          toastError("Allow camera access to capture vehicle photos.", "Camera permission");
          return;
        }
      } else {
        const perm = await ImagePicker.requestMediaLibraryPermissionsAsync();
        if (!perm.granted) {
          toastError("Allow photo access to select vehicle photos.", "Photo permission");
          return;
        }
      }

      const result =
        source === "camera"
          ? await ImagePicker.launchCameraAsync({
              mediaTypes: ['images'],
              quality: 0.8,
              allowsEditing: false,
            })
          : await ImagePicker.launchImageLibraryAsync({
              mediaTypes: ['images'],
              quality: 0.8,
              allowsMultipleSelection: true,
              selectionLimit: Math.max(1, 12 - photos.length),
            });

      if (result.canceled || result.assets.length === 0) return;

      setIsUploadingPhoto(true);

      for (let i = 0; i < result.assets.length; i++) {
        const asset = result.assets[i];
        const isPrimary = photos.length === 0 && i === 0;

        await uploadCarListingPhoto({
          userId,
          carId: createdCarId,
          uri: asset.uri,
          fileName: asset.fileName,
          mimeType: asset.mimeType,
          sortOrder: photos.length + i,
          isPrimary,
        });
      }

      const updated = await fetchCarListingPhotos(createdCarId);
      setPhotos(updated);
      toastSuccess(`${result.assets.length} photo(s) uploaded successfully.`);
    } catch (err) {
      console.error("Upload car photo failed:", err);
      toastError("Photo upload failed. Check network connection.");
    } finally {
      setIsUploadingPhoto(false);
      setPickerModalVisible(false);
    }
  };

  const handleDeletePhoto = async (photo: CarListingPhoto) => {
    if (!createdCarId) return;
    try {
      setIsUploadingPhoto(true);
      await deleteCarListingPhoto(photo.id, photo.storagePath);
      const updated = await fetchCarListingPhotos(createdCarId);
      setPhotos(updated);
      toastSuccess("Photo removed permanently.");
    } catch (err) {
      console.error("Delete photo failed:", err);
      toastError("Could not delete photo.");
    } finally {
      setIsUploadingPhoto(false);
    }
  };

  const handleSubmitForReview = async () => {
    if (!createdCarId || !userId || isSubmittingReview) return;

    // MANDATORY PHOTO CHECK: Block 0-photo listings
    if (photos.length === 0) {
      toastError(
        "Please upload at least 1 photo of your car before submitting for review.",
        "Photo Required"
      );
      setStep(2);
      return;
    }

    setIsSubmittingReview(true);
    try {
      await submitCarForReview(createdCarId, userId);

      await queryClient.invalidateQueries({
        queryKey: ["customer-dashboard", userId],
      });

      toastSuccess(
        "Your listing has been submitted to Fengxing for review.",
        "Listing Submitted",
      );

      router.replace("/(customer)/(tabs)/my-cars");
    } catch (err) {
      console.error("Submit review failed:", err);
      toastError("Could not submit listing for review.");
    } finally {
      setIsSubmittingReview(false);
    }
  };

  const primaryPhoto = photos[0] ?? null;

  return (
    <ScreenContainer contentStyle={styles.screen}>
      <CustomerTopBar title="Sell My Car" showBack />

      <KeyboardScreenContainer
        contentContainerStyle={[styles.content, { flexGrow: 1 }]}
        bottomPadding={160}
        scrollRef={scrollRef}
        onScroll={onScroll}
      >
          {/* STEPPER HEADER */}
          <View style={styles.stepperRow}>
            <Pressable
              disabled={step === 1}
              onPress={() => setStep(1)}
              style={[
                styles.stepBadge,
                step === 1 ? styles.stepBadgeActive : styles.stepBadgeDone,
                { backgroundColor: step === 1 ? theme.primarySoft : theme.successSoft },
              ]}
            >
              <Text
                style={[
                  styles.stepBadgeText,
                  { color: step === 1 ? theme.primary : theme.success },
                ]}
              >
                {step > 1 ? "✓ Vehicle details" : "1 Vehicle details (Current)"}
              </Text>
            </Pressable>

            <Pressable
              disabled={step < 2}
              onPress={() => setStep(2)}
              style={[
                styles.stepBadge,
                step === 2 ? styles.stepBadgeActive : step > 2 ? styles.stepBadgeDone : styles.stepBadgePending,
                { backgroundColor: step === 2 ? theme.primarySoft : step > 2 ? theme.successSoft : theme.surfaceMuted },
              ]}
            >
              <Text
                style={[
                  styles.stepBadgeText,
                  { color: step === 2 ? theme.primary : step > 2 ? theme.success : theme.textMuted },
                ]}
              >
                {step > 2 ? "✓ Photos" : step === 2 ? "(2) Photos (Current)" : "2 Photos"}
              </Text>
            </Pressable>

            <View
              style={[
                styles.stepBadge,
                step === 3 ? styles.stepBadgeActive : styles.stepBadgePending,
                { backgroundColor: step === 3 ? theme.primarySoft : theme.surfaceMuted },
              ]}
            >
              <Text
                style={[
                  styles.stepBadgeText,
                  { color: step === 3 ? theme.primary : theme.textMuted },
                ]}
              >
                {step === 3 ? "(3) Review & submit (Current)" : "3 Review & submit"}
              </Text>
            </View>
          </View>

          {/* STEP 1: VEHICLE DETAILS FORM */}
          {step === 1 ? (
            <>
              <View style={[styles.hero, { backgroundColor: theme.nav }]}>
                <Text style={[styles.heroEyebrow, { color: theme.primary }]}>
                  SELL YOUR CAR
                </Text>
                <Text style={[styles.heroTitle, { color: theme.navText }]}>
                  {carLabel || "Create a standout listing"}
                </Text>

                <Text style={[styles.heroSubtitle, { color: theme.navMuted }]}>
                  {createdCarId ? "Update the information buyers will see." : "Start with the essentials. Save your draft now, then add photos."}
                </Text>

                <View style={styles.heroPoints}>
                  <View style={styles.heroPoint}>
                    <Ionicons name="checkmark-circle-outline" size={18} color="#6EE7D8" />
                    <Text style={styles.heroPointText}>Free to list</Text>
                  </View>
                  <View style={styles.heroPoint}>
                    <Ionicons name="time-outline" size={18} color="#6EE7D8" />
                    <Text style={styles.heroPointText}>Save and continue later</Text>
                  </View>
                </View>
              </View>

              {/* STEP 1 SECTION HEADER WITH BACK TO PHOTOS LINK BELOW THE BLUE HERO CARD */}
              <View style={styles.step1SectionHeaderRow}>
                <View style={{ flex: 1 }}>
                  <Text style={[styles.stepEyebrow, { color: theme.primary }]}>STEP 1 OF 3</Text>
                  <Text style={[styles.photosTitle, { color: theme.text }]}>Vehicle details</Text>
                  <Text style={[styles.photosSubtitle, { color: theme.textSecondary }]}>
                    Update the information buyers will see.
                  </Text>
                </View>

                {createdCarId ? (
                  <Pressable
                    onPress={() => setStep(2)}
                    style={({ pressed }) => [styles.backToPhotosButton, pressed && styles.pressed]}
                  >
                    <Text style={[styles.backToPhotosText, { color: theme.primary }]}>
                      Back to photos →
                    </Text>
                  </Pressable>
                ) : null}
              </View>

              <View style={styles.section}>
                <SellCarSectionHeader
                  step="01"
                  title="Vehicle identity"
                  subtitle="The basics buyers search for."
                  icon="car-outline"
                />

                <View style={styles.fields}>
                  <SellCarField
                    label="Make"
                    fieldRef={bindField("make")}
                    invalid={invalidField === "make"}
                    required
                    value={form.make}
                    onChangeText={(v) => update("make", v)}
                    placeholder="e.g. BMW"
                    autoCapitalize="words"
                  />
                  <SellCarField
                    label="Model"
                    fieldRef={bindField("model")}
                    invalid={invalidField === "model"}
                    required
                    value={form.model}
                    onChangeText={(v) => update("model", v)}
                    placeholder="e.g. 3 Series"
                    autoCapitalize="words"
                  />
                  <SellCarField
                    label="Variant"
                    value={form.variant}
                    onChangeText={(v) => update("variant", v)}
                    placeholder="e.g. M Sport"
                    autoCapitalize="words"
                  />
                  <SellCarField
                    label="Year"
                    fieldRef={bindField("year")}
                    invalid={invalidField === "year"}
                    required
                    value={form.year}
                    onChangeText={(v) => update("year", v)}
                    placeholder="e.g. 2021"
                    keyboardType="number-pad"
                  />
                </View>
              </View>

              <View style={[styles.divider, { backgroundColor: theme.border }]} />

              <View style={styles.section}>
                <SellCarSectionHeader
                  step="02"
                  title="Price and specification"
                  subtitle="Accurate details build buyer trust."
                  icon="options-outline"
                />

                <View style={styles.fields}>
                  <SellCarField
                    label="Price (£)"
                    fieldRef={bindField("price")}
                    invalid={invalidField === "price"}
                    required
                    value={form.price}
                    onChangeText={(v) => update("price", v)}
                    placeholder="e.g. 18500"
                    keyboardType="number-pad"
                    icon="cash-outline"
                  />
                  <SellCarField
                    label="Mileage"
                    fieldRef={bindField("mileage")}
                    invalid={invalidField === "mileage"}
                    required
                    value={form.mileage}
                    onChangeText={(v) => update("mileage", v)}
                    placeholder="e.g. 42000"
                    keyboardType="number-pad"
                    icon="speedometer-outline"
                  />
                  <SellCarSelect
                    label="Fuel type"
                    fieldRef={bindField("fuelType")}
                    invalid={invalidField === "fuelType"}
                    required
                    value={form.fuelType}
                    placeholder="Choose fuel type"
                    options={fuelOptions}
                    expanded={openSelect === "fuel"}
                    onToggle={() => setOpenSelect((c) => (c === "fuel" ? null : "fuel"))}
                    onSelect={(v) => {
                      update("fuelType", v);
                      setOpenSelect(null);
                    }}
                  />
                  <SellCarSelect
                    label="Transmission"
                    fieldRef={bindField("transmission")}
                    invalid={invalidField === "transmission"}
                    required
                    value={form.transmission}
                    placeholder="Choose transmission"
                    options={transmissionOptions}
                    expanded={openSelect === "transmission"}
                    onToggle={() => setOpenSelect((c) => (c === "transmission" ? null : "transmission"))}
                    onSelect={(v) => {
                      update("transmission", v);
                      setOpenSelect(null);
                    }}
                  />
                  <SellCarField
                    label="Body type"
                    value={form.bodyType}
                    onChangeText={(v) => update("bodyType", v)}
                    placeholder="e.g. SUV"
                    autoCapitalize="words"
                  />
                  <SellCarField
                    label="Engine size (L)"
                    value={form.engineSize}
                    onChangeText={(v) => update("engineSize", v)}
                    placeholder="e.g. 2.0"
                    keyboardType="decimal-pad"
                  />
                  <SellCarField
                    label="Colour"
                    value={form.colour}
                    onChangeText={(v) => update("colour", v)}
                    placeholder="e.g. Black"
                    autoCapitalize="words"
                  />
                  <SellCarField
                    label="Registration"
                    value={form.registration}
                    onChangeText={(v) => update("registration", v.toUpperCase())}
                    placeholder="e.g. AB12 CDE"
                    autoCapitalize="characters"
                    icon="card-outline"
                  />
                </View>
              </View>

              <View style={[styles.divider, { backgroundColor: theme.border }]} />

              <View style={styles.section}>
                <SellCarSectionHeader
                  step="03"
                  title="Location"
                  subtitle="This helps local buyers find your car."
                  icon="location-outline"
                />

                <View style={styles.fields}>
                  <SellCarField
                    label="City"
                    fieldRef={bindField("city")}
                    invalid={invalidField === "city"}
                    required
                    value={form.city}
                    onChangeText={(v) => update("city", v)}
                    placeholder="e.g. London"
                    autoCapitalize="words"
                  />
                  <SellCarField
                    label="Postcode"
                    fieldRef={bindField("postcode")}
                    invalid={invalidField === "postcode"}
                    required
                    value={form.postcode}
                    onChangeText={(v) => update("postcode", v.toUpperCase())}
                    placeholder="e.g. SW1A 1AA"
                    autoCapitalize="characters"
                  />
                </View>
              </View>

              <View style={[styles.divider, { backgroundColor: theme.border }]} />

              <View style={styles.section}>
                <SellCarSectionHeader
                  step="04"
                  title="Vehicle history"
                  subtitle="Share the details buyers ask about."
                  icon="receipt-outline"
                />

                <View style={styles.fields}>
                  <CustomerDatePickerField
                    label="MOT expiry"
                    value={form.motExpiry}
                    onChange={(v) => update("motExpiry", v)}
                    placeholder="DD/MM/YYYY"
                    allowClear
                  />
                  <SellCarSelect
                    label="Service history"
                    value={form.serviceHistory}
                    placeholder="Not stated"
                    options={serviceHistoryOptions}
                    expanded={openSelect === "serviceHistory"}
                    onToggle={() => setOpenSelect((c) => (c === "serviceHistory" ? null : "serviceHistory"))}
                    onSelect={(v) => {
                      update("serviceHistory", v);
                      setOpenSelect(null);
                    }}
                  />
                  <SellCarSelect
                    label="ULEZ (seller stated)"
                    value={form.ulez}
                    placeholder="Not stated"
                    options={ulezOptions}
                    expanded={openSelect === "ulez"}
                    onToggle={() => setOpenSelect((c) => (c === "ulez" ? null : "ulez"))}
                    onSelect={(v) => {
                      update("ulez", v);
                      setOpenSelect(null);
                    }}
                  />
                </View>
              </View>

              <View style={[styles.divider, { backgroundColor: theme.border }]} />

              <View style={styles.descriptionSection}>
                <View style={styles.descriptionTitleRow}>
                  <View style={styles.descriptionCopy}>
                    <Text style={[styles.descriptionTitle, { color: theme.text }]}>
                      Describe your car
                    </Text>
                    <Text style={[styles.descriptionSubtitle, { color: theme.textSecondary }]}>
                      Mention condition, standout features and any known issues.
                    </Text>
                  </View>
                  <Text style={[styles.count, { color: theme.textMuted }]}>
                    {descriptionCount}/1200
                  </Text>
                </View>

                <SellCarField
                  label="Description"
                  value={form.description}
                  onChangeText={(v) => update("description", v)}
                  placeholder="Tell buyers what makes this car a good choice..."
                  multiline
                  maxLength={1200}
                  icon="chatbox-ellipses-outline"
                />
              </View>

              {errorMessage ? (
                <View
                  style={[
                    styles.errorStrip,
                    { borderLeftColor: theme.danger, backgroundColor: theme.dangerSoft },
                  ]}
                >
                  <Ionicons name="alert-circle-outline" size={20} color={theme.danger} />
                  <Text style={[styles.errorText, { color: theme.danger }]}>
                    {errorMessage}
                  </Text>
                </View>
              ) : null}

              <View style={[styles.finalDivider, { backgroundColor: theme.border }]} />

              <View style={styles.footer}>
                <Pressable
                  accessibilityRole="button"
                  disabled={!canSubmit}
                  onPress={() => void saveDraftAndProceed()}
                  style={({ pressed }) => [
                    styles.saveButton,
                    { backgroundColor: theme.primary },
                    !canSubmit && styles.disabled,
                    pressed && canSubmit && styles.pressed,
                  ]}
                >
                  {isSaving ? (
                    <ActivityIndicator size="small" color="#FFFFFF" />
                  ) : (
                    <>
                      <Text style={styles.saveButtonText}>
                        {createdCarId ? "Save changes & go to photos" : "Save draft and add photos"}
                      </Text>
                      <Ionicons name="arrow-forward" size={19} color="#FFFFFF" />
                    </>
                  )}
                </Pressable>
              </View>
            </>
          ) : step === 2 ? (
            /* STEP 2: ADD PHOTOS VIEW */
            <View style={styles.photosStepWrap}>
              <View style={[styles.draftSavedBanner, { backgroundColor: theme.successSoft, borderColor: theme.success }]}>
                <Ionicons name="checkmark-circle" size={22} color={theme.success} />
                <View style={styles.draftSavedCopy}>
                  <Text style={[styles.draftSavedTitle, { color: theme.success }]}>
                    Draft saved
                  </Text>
                  <Text style={[styles.draftSavedText, { color: theme.text }]}>
                    Now add photos of your {carLabel} to continue.
                  </Text>
                </View>
              </View>

              <Pressable
                accessibilityRole="button"
                onPress={() => setStep(1)}
                style={({ pressed }) => [styles.editDetailsLink, pressed && styles.pressed]}
              >
                <Ionicons name="create-outline" size={18} color={theme.primary} />
                <Text style={[styles.editDetailsText, { color: theme.primary }]}>
                  Edit vehicle details
                </Text>
              </Pressable>

              <View style={styles.photosHeaderRow}>
                <View style={styles.photosHeaderCopy}>
                  <Text style={[styles.stepEyebrow, { color: theme.primary }]}>
                    STEP 2 OF 3
                  </Text>
                  <Text style={[styles.photosTitle, { color: theme.text }]}>
                    Add photos
                  </Text>
                  <Text style={[styles.photosSubtitle, { color: theme.textSecondary }]}>
                    {photos.length} / 12 uploaded. Your first photo is used as the main listing image.
                  </Text>
                </View>

                <Pressable
                  accessibilityRole="button"
                  disabled={isUploadingPhoto}
                  onPress={() => setPickerModalVisible(true)}
                  style={({ pressed }) => [
                    styles.uploadButton,
                    { backgroundColor: theme.action },
                    pressed && !isUploadingPhoto && styles.pressed,
                    isUploadingPhoto && styles.disabled,
                  ]}
                >
                  {isUploadingPhoto ? (
                    <ActivityIndicator size="small" color="#FFFFFF" />
                  ) : (
                    <>
                      <Ionicons name="cloud-upload-outline" size={18} color="#FFFFFF" />
                      <Text style={styles.uploadButtonText}>Upload photos</Text>
                    </>
                  )}
                </Pressable>
              </View>

              <View style={[styles.guidanceBox, { backgroundColor: theme.warningSoft, borderColor: theme.warning }]}>
                <Text style={[styles.guidanceTitle, { color: theme.warning }]}>
                  Photo guidance
                </Text>
                <Text style={[styles.guidanceText, { color: theme.textSecondary }]}>
                  Add clear exterior, interior, dashboard and tyre photos. Use good daylight, avoid screenshots, and make your strongest exterior image the primary photo.
                </Text>
              </View>

              {photos.length === 0 ? (
                <View style={[styles.emptyPhotosBox, { borderColor: theme.border, backgroundColor: theme.surface }]}>
                  <Ionicons name="images-outline" size={36} color={theme.textMuted} />
                  <Text style={[styles.emptyPhotosTitle, { color: theme.text }]}>
                    No photos uploaded yet
                  </Text>
                  <Text style={[styles.emptyPhotosText, { color: theme.textSecondary }]}>
                    Add at least one photo before you can submit this listing for review.
                  </Text>
                </View>
              ) : (
                <View style={styles.photosGrid}>
                  {photos.map((photo, index) => (
                    <View
                      key={photo.id}
                      style={[styles.photoCard, { borderColor: theme.border, backgroundColor: theme.surface }]}
                    >
                      {photo.signedUrl ? (
                        <Image source={{ uri: photo.signedUrl }} style={styles.photoImage} contentFit="cover" />
                      ) : (
                        <View style={[styles.photoFallback, { backgroundColor: theme.surfaceSecondary }]}>
                          <Ionicons name="image-outline" size={32} color={theme.textMuted} />
                        </View>
                      )}

                      {index === 0 ? (
                        <View style={[styles.mainBadge, { backgroundColor: theme.success }]}>
                          <Text style={styles.mainBadgeText}>Main photo</Text>
                        </View>
                      ) : null}

                      {/* TOP RIGHT CROSS (X) DELETE BUTTON */}
                      <Pressable
                        accessibilityRole="button"
                        accessibilityLabel="Delete photo"
                        disabled={isUploadingPhoto}
                        onPress={() => void handleDeletePhoto(photo)}
                        style={({ pressed }) => [
                          styles.crossDeleteButton,
                          pressed && styles.pressed,
                        ]}
                      >
                        <Ionicons name="close-circle" size={24} color={theme.danger} />
                      </Pressable>
                    </View>
                  ))}
                </View>
              )}

              <Pressable
                accessibilityRole="button"
                onPress={() => setStep(3)}
                style={({ pressed }) => [
                  styles.finishButton,
                  { backgroundColor: theme.primary },
                  pressed && styles.pressed,
                ]}
              >
                <Text style={styles.finishButtonText}>Review listing →</Text>
              </Pressable>
            </View>
          ) : (
            /* STEP 3: REVIEW & SUBMIT VIEW */
            <View style={styles.reviewStepWrap}>
              <View style={styles.reviewHeaderRow}>
                <View style={styles.reviewHeaderCopy}>
                  <Text style={[styles.stepEyebrow, { color: theme.primary }]}>
                    STEP 3 OF 3
                  </Text>
                  <Text style={[styles.photosTitle, { color: theme.text }]}>
                    Review your listing
                  </Text>
                  <Text style={[styles.photosSubtitle, { color: theme.textSecondary }]}>
                    Check the important details before submitting to Fengxing.
                  </Text>
                </View>

                <Pressable
                  accessibilityRole="button"
                  onPress={() => setStep(2)}
                  style={({ pressed }) => [styles.editPhotosButton, pressed && styles.pressed]}
                >
                  <Ionicons name="images-outline" size={17} color={theme.primary} />
                  <Text style={[styles.editPhotosText, { color: theme.primary }]}>
                    Edit photos
                  </Text>
                </Pressable>
              </View>

              <View style={[styles.summaryCard, { backgroundColor: theme.surface, borderColor: theme.border }]}>
                <View style={styles.summaryCardMain}>
                  {primaryPhoto?.signedUrl ? (
                    <Image source={{ uri: primaryPhoto.signedUrl }} style={styles.summaryImage} contentFit="cover" />
                  ) : (
                    <View style={[styles.summaryImageFallback, { backgroundColor: theme.surfaceSecondary }]}>
                      <Ionicons name="car-sport-outline" size={42} color={theme.textMuted} />
                    </View>
                  )}

                  <View style={styles.summaryGrid}>
                    <View style={styles.summaryItem}>
                      <Text style={[styles.summaryLabel, { color: theme.textMuted }]}>Vehicle</Text>
                      <Text style={[styles.summaryValue, { color: theme.text }]}>{carLabel}</Text>
                    </View>

                    <View style={styles.summaryItem}>
                      <Text style={[styles.summaryLabel, { color: theme.textMuted }]}>Price</Text>
                      <Text style={[styles.summaryValue, { color: theme.text }]}>£{Number(form.price || 0).toLocaleString("en-GB")}</Text>
                    </View>

                    <View style={styles.summaryItem}>
                      <Text style={[styles.summaryLabel, { color: theme.textMuted }]}>Mileage</Text>
                      <Text style={[styles.summaryValue, { color: theme.text }]}>{Number(form.mileage || 0).toLocaleString("en-GB")} miles</Text>
                    </View>

                    <View style={styles.summaryItem}>
                      <Text style={[styles.summaryLabel, { color: theme.textMuted }]}>Photos</Text>
                      <Text style={[styles.summaryValue, { color: theme.text }]}>{photos.length} uploaded</Text>
                    </View>

                    <View style={styles.summaryItem}>
                      <Text style={[styles.summaryLabel, { color: theme.textMuted }]}>Location</Text>
                      <Text style={[styles.summaryValue, { color: theme.text }]}>{[form.city, form.postcode].filter(Boolean).join(", ")}</Text>
                    </View>

                    <View style={styles.summaryItem}>
                      <Text style={[styles.summaryLabel, { color: theme.textMuted }]}>Status</Text>
                      <Text style={[styles.summaryValue, { color: theme.primary }]}>Draft</Text>
                    </View>
                  </View>
                </View>

                <View style={[styles.divider, { backgroundColor: theme.border }]} />

                <View style={styles.reviewFooterRow}>
                  <Pressable
                    accessibilityRole="button"
                    onPress={() => setStep(1)}
                    style={({ pressed }) => [styles.editDetailsLink, pressed && styles.pressed]}
                  >
                    <Ionicons name="create-outline" size={18} color={theme.primary} />
                    <Text style={[styles.editDetailsText, { color: theme.primary }]}>
                      Edit vehicle details
                    </Text>
                  </Pressable>

                  <Pressable
                    accessibilityRole="button"
                    disabled={isSubmittingReview}
                    onPress={() => void handleSubmitForReview()}
                    style={({ pressed }) => [
                      styles.submitReviewButton,
                      { backgroundColor: theme.action },
                      pressed && !isSubmittingReview && styles.pressed,
                      isSubmittingReview && styles.disabled,
                    ]}
                  >
                    {isSubmittingReview ? (
                      <ActivityIndicator size="small" color="#FFFFFF" />
                    ) : (
                      <Text style={styles.submitReviewButtonText}>Submit for review</Text>
                    )}
                  </Pressable>
                </View>
              </View>
            </View>
          )}
        </KeyboardScreenContainer>

      <AppModal
        visible={pickerModalVisible}
        title="Add photo"
        message="Choose where to select your vehicle photo from."
        onClose={() => setPickerModalVisible(false)}
      >
        <View style={styles.modalButtons}>
          <Pressable
            accessibilityRole="button"
            onPress={() => void chooseAndUploadPhoto("camera")}
            style={({ pressed }) => [
              styles.modalOptionButton,
              { backgroundColor: theme.surfaceSecondary, borderColor: theme.border },
              pressed && styles.pressed,
            ]}
          >
            <Ionicons name="camera-outline" size={20} color={theme.primary} />
            <Text style={[styles.modalOptionText, { color: theme.text }]}>Take Photo with Camera</Text>
          </Pressable>

          <Pressable
            accessibilityRole="button"
            onPress={() => void chooseAndUploadPhoto("library")}
            style={({ pressed }) => [
              styles.modalOptionButton,
              { backgroundColor: theme.surfaceSecondary, borderColor: theme.border },
              pressed && styles.pressed,
            ]}
          >
            <Ionicons name="images-outline" size={20} color={theme.primary} />
            <Text style={[styles.modalOptionText, { color: theme.text }]}>Choose from Photo Library</Text>
          </Pressable>
        </View>
      </AppModal>
    </ScreenContainer>
  );
}

const styles = StyleSheet.create({
  screen: { paddingHorizontal: 0 },
  flex: { flex: 1 },
  content: { paddingBottom: spacing.xxxl },

  stepperRow: {
    flexDirection: "row",
    gap: spacing.xs,
    paddingHorizontal: spacing.lg,
    paddingTop: spacing.lg,
  },
  stepBadge: {
    flex: 1,
    paddingVertical: 8,
    paddingHorizontal: 6,
    borderRadius: radius.md,
    alignItems: "center",
    justifyContent: "center",
  },
  stepBadgeActive: {},
  stepBadgeDone: {},
  stepBadgePending: {},
  stepBadgeText: {
    fontSize: 10,
    fontWeight: fontWeight.bold,
  },

  hero: {
    marginHorizontal: spacing.lg,
    marginTop: spacing.md,
    paddingHorizontal: spacing.xl,
    paddingTop: spacing.xxl,
    paddingBottom: spacing.xxl,
    borderRadius: radius.xl,
    gap: spacing.md,
  },
  heroEyebrow: { fontSize: fontSize.xs, fontWeight: fontWeight.bold, letterSpacing: 1.6 },
  heroTitle: { fontSize: 30, lineHeight: 36, fontWeight: fontWeight.bold, letterSpacing: -0.8 },
  heroSubtitle: { fontSize: fontSize.sm, lineHeight: 21 },
  heroPoints: { marginTop: spacing.sm, gap: spacing.sm },
  heroPoint: { flexDirection: "row", alignItems: "center", gap: spacing.sm },
  heroPointText: { color: "#FFFFFF", fontSize: fontSize.sm, fontWeight: fontWeight.semibold },

  step1SectionHeaderRow: {
    flexDirection: "row",
    alignItems: "flex-end",
    justifyContent: "space-between",
    paddingHorizontal: spacing.xl,
    paddingTop: spacing.xl,
  },
  backToPhotosButton: {
    paddingVertical: 4,
    paddingHorizontal: 8,
  },
  backToPhotosText: {
    fontSize: fontSize.xs,
    fontWeight: fontWeight.bold,
  },

  section: { paddingHorizontal: spacing.xl, paddingTop: spacing.xl, gap: spacing.xl },
  fields: { gap: spacing.md },
  divider: { height: StyleSheet.hairlineWidth, marginHorizontal: spacing.xl, marginVertical: spacing.xxl },

  descriptionSection: { paddingHorizontal: spacing.xl, gap: spacing.lg },
  descriptionTitleRow: { flexDirection: "row", alignItems: "flex-start", gap: spacing.md },
  descriptionCopy: { flex: 1, gap: 5 },
  descriptionTitle: { fontSize: fontSize.lg, fontWeight: fontWeight.bold },
  descriptionSubtitle: { fontSize: fontSize.sm, lineHeight: 21 },
  count: { fontSize: fontSize.xs },

  errorStrip: {
    marginHorizontal: spacing.xl,
    marginTop: spacing.xxl,
    minHeight: 54,
    flexDirection: "row",
    alignItems: "flex-start",
    gap: spacing.sm,
    borderLeftWidth: 3,
    padding: spacing.md,
    borderRadius: radius.sm,
  },
  errorText: { flex: 1, fontSize: fontSize.sm, lineHeight: 20, fontWeight: fontWeight.semibold },
  finalDivider: { height: StyleSheet.hairlineWidth, marginHorizontal: spacing.xl, marginTop: spacing.xxl },
  footer: { paddingHorizontal: spacing.xl, paddingTop: spacing.xl },

  saveButton: {
    minHeight: 54,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: spacing.sm,
    borderRadius: 16,
    paddingHorizontal: spacing.lg,
  },
  saveButtonText: { color: "#FFFFFF", fontSize: fontSize.md, fontWeight: fontWeight.bold },

  // STEP 2 PHOTOS STYLES
  photosStepWrap: {
    paddingHorizontal: spacing.xl,
    paddingTop: spacing.lg,
    gap: spacing.xl,
  },
  draftSavedBanner: {
    flexDirection: "row",
    alignItems: "center",
    gap: spacing.md,
    borderWidth: 1,
    borderRadius: radius.lg,
    padding: spacing.lg,
  },
  draftSavedCopy: { flex: 1, gap: 3 },
  draftSavedTitle: { fontSize: fontSize.md, fontWeight: fontWeight.bold },
  draftSavedText: { fontSize: fontSize.sm, lineHeight: 20 },

  editDetailsLink: {
    flexDirection: "row",
    alignItems: "center",
    gap: spacing.xs,
    alignSelf: "flex-start",
  },
  editDetailsText: { fontSize: fontSize.sm, fontWeight: fontWeight.bold },

  photosHeaderRow: {
    flexDirection: "column",
    gap: spacing.md,
  },
  photosHeaderCopy: { gap: 4 },
  stepEyebrow: { fontSize: 11, fontWeight: fontWeight.bold, letterSpacing: 1 },
  photosTitle: { fontSize: 28, fontWeight: fontWeight.bold },
  photosSubtitle: { fontSize: fontSize.sm, lineHeight: 21 },

  uploadButton: {
    minHeight: 48,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: spacing.sm,
    borderRadius: radius.md,
    paddingHorizontal: spacing.lg,
    alignSelf: "flex-start",
  },
  uploadButtonText: { color: "#FFFFFF", fontSize: fontSize.sm, fontWeight: fontWeight.bold },

  guidanceBox: {
    borderWidth: 1,
    borderRadius: radius.lg,
    padding: spacing.lg,
    gap: spacing.xs,
  },
  guidanceTitle: { fontSize: fontSize.sm, fontWeight: fontWeight.bold },
  guidanceText: { fontSize: fontSize.xs, lineHeight: 19 },

  emptyPhotosBox: {
    minHeight: 180,
    borderWidth: 1,
    borderStyle: "dashed",
    borderRadius: radius.xl,
    alignItems: "center",
    justifyContent: "center",
    gap: spacing.sm,
    padding: spacing.xl,
  },
  emptyPhotosTitle: { fontSize: fontSize.md, fontWeight: fontWeight.bold },
  emptyPhotosText: { fontSize: fontSize.sm, textAlign: "center", lineHeight: 20 },

  photosGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: spacing.md,
  },
  photoCard: {
    width: "47.5%",
    borderWidth: 1,
    borderRadius: radius.lg,
    overflow: "hidden",
    position: "relative",
  },
  photoImage: { width: "100%", aspectRatio: 4 / 3 },
  photoFallback: { width: "100%", aspectRatio: 4 / 3, alignItems: "center", justifyContent: "center" },

  mainBadge: {
    position: "absolute",
    top: spacing.xs,
    left: spacing.xs,
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: radius.pill,
    zIndex: 2,
  },
  mainBadgeText: { color: "#FFFFFF", fontSize: 9, fontWeight: fontWeight.bold },

  crossDeleteButton: {
    position: "absolute",
    top: 4,
    right: 4,
    zIndex: 10,
    backgroundColor: "#FFFFFF",
    borderRadius: 12,
  },

  finishButton: {
    minHeight: 54,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: spacing.sm,
    borderRadius: 16,
    paddingHorizontal: spacing.lg,
    marginTop: spacing.md,
  },
  finishButtonText: { color: "#FFFFFF", fontSize: fontSize.md, fontWeight: fontWeight.bold },

  // STEP 3 REVIEW STYLES
  reviewStepWrap: {
    paddingHorizontal: spacing.xl,
    paddingTop: spacing.lg,
    gap: spacing.xl,
  },
  reviewHeaderRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "flex-start",
  },
  reviewHeaderCopy: { flex: 1, gap: 4 },
  editPhotosButton: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
    paddingVertical: 6,
    paddingHorizontal: 10,
  },
  editPhotosText: { fontSize: fontSize.xs, fontWeight: fontWeight.bold },

  summaryCard: {
    borderWidth: 1,
    borderRadius: radius.xl,
    padding: spacing.lg,
    gap: spacing.lg,
  },
  summaryCardMain: {
    flexDirection: "column",
    gap: spacing.lg,
  },
  summaryImage: {
    width: "100%",
    aspectRatio: 16 / 9,
    borderRadius: radius.lg,
  },
  summaryImageFallback: {
    width: "100%",
    aspectRatio: 16 / 9,
    borderRadius: radius.lg,
    alignItems: "center",
    justifyContent: "center",
  },
  summaryGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: spacing.md,
  },
  summaryItem: {
    width: "47%",
    gap: 2,
  },
  summaryLabel: { fontSize: 11, fontWeight: fontWeight.bold },
  summaryValue: { fontSize: fontSize.sm, fontWeight: fontWeight.bold },

  reviewFooterRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    gap: spacing.md,
  },
  submitReviewButton: {
    minHeight: 48,
    paddingHorizontal: spacing.xl,
    alignItems: "center",
    justifyContent: "center",
    borderRadius: radius.md,
  },
  submitReviewButtonText: { color: "#FFFFFF", fontSize: fontSize.sm, fontWeight: fontWeight.bold },

  modalButtons: { gap: spacing.md, paddingTop: spacing.md },
  modalOptionButton: {
    minHeight: 50,
    flexDirection: "row",
    alignItems: "center",
    gap: spacing.md,
    borderWidth: 1,
    borderRadius: radius.md,
    paddingHorizontal: spacing.lg,
  },
  modalOptionText: { fontSize: fontSize.sm, fontWeight: fontWeight.bold },

  disabled: { opacity: 0.55 },
  pressed: { opacity: 0.75 },
});
