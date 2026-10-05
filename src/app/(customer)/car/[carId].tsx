import { Ionicons } from "@expo/vector-icons";
import { useLocalSearchParams } from "expo-router";
import { useEffect, useState } from "react";
import {
  ActivityIndicator,
  Image,
  Pressable,
  RefreshControl,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from "react-native";

import CustomerTopBar from "@/components/customer/CustomerTopBar";
import AppLoadingOverlay from "@/components/ui/AppLoadingOverlay";
import ScreenContainer from "@/components/ui/ScreenContainer";
import { fontSize, fontWeight, radius, spacing } from "@/constants/theme";
import { useAuth } from "@/features/auth/use-auth";
import { useMarketplaceCarDetail } from "@/features/customer/use-marketplace-car-detail";
import { useAppTheme } from "@/hooks/use-app-theme";
import { useSingleNavigation } from "@/hooks/use-single-navigation";
import { revealMarketplaceSellerContact } from "@/services/customer/marketplace-detail.service";

function titleCase(value: string) {
  return value
    .replaceAll("_", " ")
    .replace(/\b\w/g, (letter) => letter.toUpperCase());
}

function formatPrice(value: number) {
  return (
    "£" +
    value.toLocaleString("en-GB", {
      maximumFractionDigits: 0,
    })
  );
}

function formatMileage(value: number) {
  return value.toLocaleString("en-GB") + " miles";
}

function formatDate(value: string | null) {
  if (!value) {
    return "Not stated";
  }
  const date = new Date(value.includes("T") ? value : `${value}T00:00:00`);
  if (Number.isNaN(date.getTime())) {
    return value;
  }
  return date.toLocaleDateString("en-GB", {
    day: "numeric",
    month: "short",
    year: "numeric",
  });
}

export default function MarketplaceCarDetailScreen() {
  const theme = useAppTheme();
  const { session } = useAuth();
  const { navigate } = useSingleNavigation();

  const params = useLocalSearchParams<{ carId?: string }>();
  const carId = typeof params.carId === "string" ? params.carId : "";

  const [sellerContact, setSellerContact] = useState<{
    fullName: string;
    phone: string;
  } | null>(null);

  const [isRevealingContact, setIsRevealingContact] = useState(false);
  const [sellerContactError, setSellerContactError] = useState<string | null>(
    null,
  );

  useEffect(() => {
    setSellerContact(null);
    setSellerContactError(null);
  }, [carId]);

  const revealSellerContact = async () => {
    if (!carId || isRevealingContact) return;
    setIsRevealingContact(true);
    setSellerContactError(null);

    try {
      const contact = await revealMarketplaceSellerContact(carId);
      setSellerContact(contact);
    } catch (error) {
      setSellerContactError(
        error instanceof Error && error.message
          ? error.message
          : "Seller contact could not be revealed.",
      );
    } finally {
      setIsRevealingContact(false);
    }
  };

  const query = useMarketplaceCarDetail(carId);
  const car = query.data;

  const [selectedImageIndex, setSelectedImageIndex] = useState(0);

  useEffect(() => {
    setSelectedImageIndex(0);
  }, [carId]);

  if (query.isLoading) {
    return (
      <ScreenContainer contentStyle={styles.screen}>
        <CustomerTopBar title="Car Details" showBack />
        <AppLoadingOverlay visible message="Loading listing..." />
      </ScreenContainer>
    );
  }

  if (query.isError || !car) {
    return (
      <ScreenContainer contentStyle={styles.screen}>
        <CustomerTopBar title="Car Details" showBack />
        <View style={styles.state}>
          <Ionicons name="car-sport-outline" size={34} color={theme.primary} />
          <Text style={[styles.stateTitle, { color: theme.text }]}>
            Listing unavailable
          </Text>
          <Text style={[styles.stateText, { color: theme.textSecondary }]}>
            This car may no longer be active.
          </Text>
        </View>
      </ScreenContainer>
    );
  }

  const selectedImage = car.images[selectedImageIndex] ?? car.images[0] ?? null;
  const title = [car.year, car.make, car.model, car.variant]
    .filter(Boolean)
    .join(" ");
  const location = [car.city, car.postcode].filter(Boolean).join(", ");

  // SENIOR'S LOGIC MATCHING
  const isSold = car.status === "sold";
  const isOwner = session?.user?.id === car.sellerId;

  const specs = [
    { label: "Mileage", value: formatMileage(car.mileage) },
    { label: "Fuel", value: titleCase(car.fuelType) },
    { label: "Transmission", value: titleCase(car.transmission) },
    {
      label: "Engine size",
      value: car.engineSize !== null ? `${car.engineSize}L` : "Not stated",
    },
    {
      label: "Body type",
      value: car.bodyType ? titleCase(car.bodyType) : "Not stated",
    },
    { label: "Colour", value: car.colour || "Not stated" },
    { label: "MOT expiry", value: formatDate(car.motExpiry) },
    {
      label: "Service history",
      value: car.serviceHistory ? titleCase(car.serviceHistory) : "Not stated",
    },
    {
      label: "ULEZ status",
      value:
        car.ulezCompliant === null
          ? "Not stated"
          : car.ulezCompliant
            ? "Compliant"
            : "Not compliant",
    },
    { label: "Location", value: location },
  ];

  return (
    <ScreenContainer contentStyle={styles.screen}>
      <CustomerTopBar title="Car Details" showBack />

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
        {/* GALLERY */}
        {car.images.length ? (
          <View style={styles.gallery}>
            <Image
              source={{ uri: selectedImage! }}
              resizeMode="cover"
              style={styles.mainImage}
            />

            {car.images.length > 1 ? (
              <ScrollView
                horizontal
                showsHorizontalScrollIndicator={false}
                contentContainerStyle={styles.thumbnails}
              >
                {car.images.map((image, index) => (
                  <Pressable
                    key={`${image}-${index}`}
                    accessibilityRole="button"
                    onPress={() => setSelectedImageIndex(index)}
                    style={({ pressed }) => [
                      styles.thumbnailButton,
                      pressed && styles.pressed,
                    ]}
                  >
                    <Image
                      source={{ uri: image }}
                      resizeMode="cover"
                      style={[
                        styles.thumbnail,
                        {
                          borderColor:
                            index === selectedImageIndex
                              ? theme.primary
                              : theme.border,
                        },
                      ]}
                    />
                  </Pressable>
                ))}
              </ScrollView>
            ) : null}
          </View>
        ) : (
          <View
            style={[
              styles.imageFallback,
              { backgroundColor: theme.surfaceSecondary },
            ]}
          >
            <Ionicons
              name="car-sport-outline"
              size={52}
              color={theme.textMuted}
            />
          </View>
        )}

        {/* HERO DETAILS */}
        <View style={styles.hero}>
          {car.isVerified ? (
            <View
              style={[
                styles.verifiedLabel,
                { backgroundColor: theme.successSoft },
              ]}
            >
              <Ionicons
                name="shield-checkmark"
                size={16}
                color={theme.success}
              />
              <Text
                style={[styles.verifiedLabelText, { color: theme.success }]}
              >
                Inspected by Shaz
              </Text>
            </View>
          ) : null}

          <Text style={[styles.title, { color: theme.text }]}>{title}</Text>
          <Text style={[styles.price, { color: theme.primary }]}>
            {formatPrice(car.price)}
          </Text>

          <View style={styles.quickSpecs}>
            <Text style={[styles.quickSpec, { color: theme.textSecondary }]}>
              {formatMileage(car.mileage)}
            </Text>
            <Text style={[styles.dot, { color: theme.textMuted }]}>·</Text>
            <Text style={[styles.quickSpec, { color: theme.textSecondary }]}>
              {titleCase(car.fuelType)}
            </Text>
            <Text style={[styles.dot, { color: theme.textMuted }]}>·</Text>
            <Text style={[styles.quickSpec, { color: theme.textSecondary }]}>
              {titleCase(car.transmission)}
            </Text>
          </View>

          <View style={styles.locationRow}>
            <Ionicons
              name="location-outline"
              size={16}
              color={theme.textMuted}
            />
            <Text style={[styles.location, { color: theme.textSecondary }]}>
              {location}
            </Text>
          </View>

          {car.isVerified && car.verifiedAt ? (
            <Text style={[styles.inspectionDate, { color: theme.textMuted }]}>
              Inspection completed on {formatDate(car.verifiedAt)}
            </Text>
          ) : null}

          {/* ACTIONS (SENIOR WEB LOGIC: SOLD, OWNER, CONTACT, INSPECTION) */}
          <View
            style={[styles.actionsContainer, { borderTopColor: theme.border }]}
          >
            {isSold ? (
              <View
                style={[
                  styles.soldBanner,
                  {
                    backgroundColor: theme.surfaceSecondary,
                    borderColor: theme.border,
                  },
                ]}
              >
                <Text style={[styles.soldTitle, { color: theme.text }]}>
                  This vehicle has been sold
                </Text>
                <Text style={[styles.soldText, { color: theme.textSecondary }]}>
                  The seller has marked this listing as sold and it is no longer
                  available.
                </Text>
              </View>
            ) : (
              <>
                {/* SELLER CONTACT */}
                {!isOwner ? (
                  sellerContact ? (
                    <View
                      style={[
                        styles.contactCard,
                        { backgroundColor: theme.successSoft },
                      ]}
                    >
                      <Text
                        style={[styles.contactName, { color: theme.success }]}
                      >
                        {sellerContact.fullName}
                      </Text>
                      <Text
                        selectable
                        style={[styles.contactPhone, { color: theme.primary }]}
                      >
                        {sellerContact.phone}
                      </Text>
                    </View>
                  ) : (
                    <>
                      <Pressable
                        accessibilityRole="button"
                        disabled={isRevealingContact}
                        onPress={() => void revealSellerContact()}
                        style={({ pressed }) => [
                          styles.contactButton,
                          { backgroundColor: theme.primary },
                          (pressed || isRevealingContact) && styles.pressed,
                        ]}
                      >
                        {isRevealingContact ? (
                          <ActivityIndicator
                            size="small"
                            color={theme.navText}
                          />
                        ) : (
                          <Ionicons
                            name="call-outline"
                            size={18}
                            color={theme.navText}
                          />
                        )}
                        <Text
                          style={[
                            styles.contactButtonText,
                            { color: theme.navText },
                          ]}
                        >
                          {isRevealingContact
                            ? "Revealing…"
                            : "Reveal Seller Contact"}
                        </Text>
                      </Pressable>
                      {sellerContactError ? (
                        <Text
                          style={[styles.contactError, { color: theme.danger }]}
                        >
                          {sellerContactError}
                        </Text>
                      ) : null}
                    </>
                  )
                ) : null}

                {/* GET IT INSPECTED BUTTON */}
                {!car.isVerified ? (
                  <Pressable
                    accessibilityRole="button"
                    onPress={() =>
                      navigate("/(customer)/vehicle-inspection", {
                        carId: car.id,
                        registration: car.registration || "",
                        make: car.make || "",
                        model: car.model || "",
                        year: car.year ? String(car.year) : "",
                      })
                    }
                    style={({ pressed }) => [
                      styles.inspectButton,
                      { borderColor: theme.primary },
                      pressed && styles.pressed,
                    ]}
                  >
                    <Ionicons
                      name="shield-checkmark-outline"
                      size={18}
                      color={theme.primary}
                    />
                    <Text
                      style={[
                        styles.inspectButtonText,
                        { color: theme.primary },
                      ]}
                    >
                      {isOwner
                        ? "Request Shaz Inspection"
                        : "Get this car inspected"}
                    </Text>
                  </Pressable>
                ) : car.verifiedVerificationRequestId ? (
                  <Pressable
                    accessibilityRole="button"
                    onPress={() =>
                      navigate("/(customer)/inspection/[inspectionId]", {
                        inspectionId: car.verifiedVerificationRequestId!,
                      })
                    }
                    style={({ pressed }) => [
                      styles.inspectButton,
                      { borderColor: theme.border },
                      pressed && styles.pressed,
                    ]}
                  >
                    <Ionicons
                      name="document-text-outline"
                      size={18}
                      color={theme.text}
                    />
                    <Text
                      style={[styles.inspectButtonText, { color: theme.text }]}
                    >
                      View Inspection Report
                    </Text>
                  </Pressable>
                ) : null}
              </>
            )}
          </View>
        </View>

        <View style={[styles.divider, { backgroundColor: theme.border }]} />

        {/* DESCRIPTION */}
        <View style={styles.section}>
          <Text style={[styles.sectionTitle, { color: theme.text }]}>
            About this car
          </Text>
          <Text style={[styles.description, { color: theme.textSecondary }]}>
            {car.description}
          </Text>
        </View>

        <View style={[styles.divider, { backgroundColor: theme.border }]} />

        {/* SPECS */}
        <View style={styles.section}>
          <Text style={[styles.sectionTitle, { color: theme.text }]}>
            Vehicle specifications
          </Text>
          <View style={styles.specList}>
            {specs.map((spec) => (
              <View
                key={spec.label}
                style={[styles.specRow, { borderBottomColor: theme.border }]}
              >
                <Text
                  style={[styles.specLabel, { color: theme.textSecondary }]}
                >
                  {spec.label}
                </Text>
                <Text style={[styles.specValue, { color: theme.text }]}>
                  {spec.value}
                </Text>
              </View>
            ))}
          </View>
        </View>
      </ScrollView>

      <AppLoadingOverlay
        visible={isRevealingContact}
        message="Revealing seller contact..."
      />
    </ScreenContainer>
  );
}

const styles = StyleSheet.create({
  screen: { paddingHorizontal: 0 },
  content: { paddingBottom: spacing.xxxl },
  state: {
    flex: 1,
    minHeight: 320,
    alignItems: "center",
    justifyContent: "center",
    gap: spacing.sm,
    paddingHorizontal: spacing.xl,
  },
  stateTitle: { fontSize: fontSize.lg, fontWeight: fontWeight.bold },
  stateText: { fontSize: fontSize.sm, textAlign: "center" },

  gallery: { gap: spacing.sm },
  mainImage: { width: "100%", aspectRatio: 4 / 3 },
  thumbnails: { paddingHorizontal: spacing.xl, gap: spacing.sm },
  thumbnailButton: { borderRadius: radius.md },
  thumbnail: {
    width: 76,
    height: 58,
    borderWidth: 2,
    borderRadius: radius.md,
  },
  imageFallback: {
    width: "100%",
    aspectRatio: 4 / 3,
    alignItems: "center",
    justifyContent: "center",
  },

  hero: {
    paddingHorizontal: spacing.xl,
    paddingTop: spacing.xl,
    gap: spacing.sm,
  },
  verifiedLabel: {
    alignSelf: "flex-start",
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    paddingHorizontal: spacing.sm,
    paddingVertical: 4,
    borderRadius: radius.sm,
    marginBottom: 4,
  },
  verifiedLabelText: {
    fontSize: 10,
    fontWeight: fontWeight.bold,
    letterSpacing: 0.5,
  },
  title: {
    fontSize: 26,
    lineHeight: 32,
    fontWeight: fontWeight.bold,
    letterSpacing: -0.6,
  },
  price: {
    fontSize: 28,
    lineHeight: 34,
    fontWeight: fontWeight.bold,
    letterSpacing: -0.7,
    marginTop: 2,
  },
  quickSpecs: {
    flexDirection: "row",
    flexWrap: "wrap",
    alignItems: "center",
    gap: spacing.sm,
    marginTop: 4,
  },
  quickSpec: { fontSize: fontSize.sm },
  dot: { fontSize: fontSize.sm },
  locationRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
    marginTop: 2,
  },
  location: { flex: 1, fontSize: fontSize.sm },
  inspectionDate: { fontSize: fontSize.xs, marginTop: 4 },

  actionsContainer: {
    marginTop: spacing.md,
    gap: spacing.md,
    paddingTop: spacing.md,
    borderTopWidth: StyleSheet.hairlineWidth,
  },

  soldBanner: {
    padding: spacing.lg,
    borderRadius: radius.md,
    borderWidth: 1,
    alignItems: "center",
    gap: 4,
  },
  soldTitle: { fontSize: fontSize.md, fontWeight: fontWeight.bold },
  soldText: { fontSize: fontSize.sm, textAlign: "center", lineHeight: 20 },

  contactCard: {
    gap: spacing.sm,
    padding: spacing.md,
    borderRadius: radius.md,
  },
  contactName: { fontSize: fontSize.sm, fontWeight: fontWeight.bold },
  contactPhone: { fontSize: fontSize.lg, fontWeight: fontWeight.bold },
  contactError: { fontSize: fontSize.sm, marginTop: -4 },

  contactButton: {
    minHeight: 50,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: spacing.sm,
    borderRadius: radius.md,
  },
  contactButtonText: {
    fontSize: fontSize.sm,
    fontWeight: fontWeight.bold,
  },

  inspectButton: {
    minHeight: 50,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: spacing.sm,
    borderRadius: radius.md,
    borderWidth: 1,
  },
  inspectButtonText: { fontSize: fontSize.sm, fontWeight: fontWeight.bold },

  divider: {
    height: StyleSheet.hairlineWidth,
    marginHorizontal: spacing.xl,
    marginVertical: spacing.xl,
  },
  section: { paddingHorizontal: spacing.xl, gap: spacing.md },
  sectionTitle: { fontSize: fontSize.lg, fontWeight: fontWeight.bold },
  description: { fontSize: fontSize.md, lineHeight: 24 },

  specList: { gap: 0 },
  specRow: {
    minHeight: 48,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    borderBottomWidth: StyleSheet.hairlineWidth,
  },
  specLabel: { fontSize: fontSize.sm },
  specValue: {
    fontSize: fontSize.sm,
    fontWeight: fontWeight.semibold,
    textAlign: "right",
  },

  pressed: { opacity: 0.72, transform: [{ scale: 0.99 }] },
});
