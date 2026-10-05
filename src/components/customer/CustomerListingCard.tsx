// File: src/components/customer/CustomerListingCard.tsx

import { Ionicons } from "@expo/vector-icons";
import { Image } from "expo-image";
import { Pressable, StyleSheet, Text, View } from "react-native";

import CustomerStatusBadge from "@/components/customer/CustomerStatusBadge";
import { fontSize, fontWeight, radius, spacing } from "@/constants/theme";
import { useAppTheme } from "@/hooks/use-app-theme";
import type { CustomerCar } from "@/types/customer";

type CustomerListingCardProps = {
  car: CustomerCar;
  compact?: boolean;
  onView?: () => void;
  onEdit?: () => void;
  onMore?: () => void;
  onRequestInspection?: () => void;
};

function titleCase(value: string) {
  return value
    .replaceAll("_", " ")
    .replace(/\b\w/g, (letter) => letter.toUpperCase());
}

function formatMoney(value: number | null) {
  if (value === null) return "Price on request";
  return "£" + value.toLocaleString("en-GB", { maximumFractionDigits: 0 });
}

function formatMileage(value: number | null) {
  if (value === null) return null;
  return value.toLocaleString("en-GB") + " miles";
}

export default function CustomerListingCard({
  car,
  compact = false,
  onView,
  onEdit,
  onMore,
  onRequestInspection,
}: CustomerListingCardProps) {
  const theme = useAppTheme();

  const title = [car.year, car.make, car.model, car.variant]
    .filter(Boolean)
    .join(" ");

  const isSold = car.status === "sold";
  const isActive = car.status === "active";
  const showActions = !compact && !isSold && (onView || onEdit || onMore);

  return (
    <View
      style={[
        styles.card,
        {
          backgroundColor: theme.surface,
          borderColor: theme.border,
        },
      ]}
    >
      {/* VEHICLE IMAGE */}
      <View style={styles.imageArea}>
        {car.imageUrl ? (
          <Image
            source={{ uri: car.imageUrl }}
            contentFit="cover"
            transition={200}
            style={[styles.image, compact && styles.imageCompact]}
          />
        ) : (
          <View
            style={[
              styles.imageFallback,
              compact && styles.imageCompact,
              { backgroundColor: theme.surfaceSecondary },
            ]}
          >
            <Ionicons
              name="car-sport-outline"
              size={compact ? 32 : 44}
              color={theme.textMuted}
            />
          </View>
        )}
      </View>

      <View style={styles.body}>
        {/* PLATE & STATUS */}
        <View style={styles.badgeRow}>
          {car.registration ? (
            <View
              style={[
                styles.plate,
                {
                  backgroundColor: theme.surfaceSecondary,
                  borderColor: theme.border,
                },
              ]}
            >
              <Text style={[styles.plateText, { color: theme.text }]}>
                {car.registration}
              </Text>
            </View>
          ) : (
            <View />
          )}

          <CustomerStatusBadge
            label={titleCase(car.status)}
            tone={
              car.status === "active"
                ? "success"
                : car.status === "rejected"
                  ? "danger"
                  : car.status === "pending"
                    ? "warning"
                    : "neutral"
            }
          />
        </View>

        {/* TITLE */}
        <Text numberOfLines={2} style={[styles.title, { color: theme.text }]}>
          {title}
        </Text>

        {/* PRICE, MILEAGE & CITY */}
        <View style={styles.metaWrap}>
          <Text style={[styles.price, { color: theme.text }]}>
            {formatMoney(car.price)}
          </Text>

          {formatMileage(car.mileage) ? (
            <View style={styles.metaItem}>
              <Text style={[styles.metaDot, { color: theme.border }]}>|</Text>
              <Text style={[styles.meta, { color: theme.textSecondary }]}>
                {formatMileage(car.mileage)}
              </Text>
            </View>
          ) : null}

          {car.city ? (
            <View style={styles.metaItem}>
              <Text style={[styles.metaDot, { color: theme.border }]}>|</Text>
              <Text style={[styles.meta, { color: theme.textSecondary }]}>
                {car.city}
              </Text>
            </View>
          ) : null}
        </View>

        {/* VERIFIED BY SHAZ OR INSPECTION BANNER */}
        {car.isVerified ? (
          <View style={styles.verifiedRow}>
            <Ionicons name="checkmark-circle" size={16} color={theme.success} />
            <Text style={[styles.verifiedText, { color: theme.success }]}>
              Verified by Shaz
            </Text>
          </View>
        ) : isActive && onRequestInspection ? (
          <Pressable
            accessibilityRole="button"
            onPress={onRequestInspection}
            style={({ pressed }) => [
              styles.inspectBanner,
              {
                backgroundColor: theme.surfaceSecondary,
                borderColor: theme.border,
              },
              pressed && styles.pressed,
            ]}
          >
            <Ionicons
              name="shield-checkmark-outline"
              size={17}
              color={theme.primary}
            />
            <Text
              numberOfLines={1}
              ellipsizeMode="tail"
              style={[styles.inspectBannerText, { color: theme.text }]}
            >
              Request vehicle inspection
            </Text>
            <Ionicons name="arrow-forward" size={14} color={theme.primary} />
          </Pressable>
        ) : null}

        {/* ACTIONS */}
        {showActions ? (
          <>
            <View style={[styles.divider, { backgroundColor: theme.border }]} />

            <View style={styles.actions}>
              {onView ? (
                <Pressable
                  accessibilityRole="button"
                  onPress={onView}
                  style={({ pressed }) => [
                    styles.actionBtn,
                    {
                      backgroundColor: theme.surface,
                      borderColor: theme.border,
                    },
                    pressed && styles.pressed,
                  ]}
                >
                  <Ionicons name="eye-outline" size={16} color={theme.text} />
                  <Text style={[styles.actionBtnText, { color: theme.text }]}>
                    View
                  </Text>
                </Pressable>
              ) : null}

              {onEdit ? (
                <Pressable
                  accessibilityRole="button"
                  onPress={onEdit}
                  style={({ pressed }) => [
                    styles.actionBtn,
                    {
                      backgroundColor: theme.surface,
                      borderColor: theme.border,
                    },
                    pressed && styles.pressed,
                  ]}
                >
                  <Ionicons
                    name="create-outline"
                    size={16}
                    color={theme.primary}
                  />
                  <Text
                    style={[styles.actionBtnText, { color: theme.primary }]}
                  >
                    Edit
                  </Text>
                </Pressable>
              ) : null}

              {onMore ? (
                <Pressable
                  accessibilityRole="button"
                  accessibilityLabel="More options"
                  onPress={onMore}
                  style={({ pressed }) => [
                    styles.moreBtn,
                    {
                      backgroundColor: theme.surface,
                      borderColor: theme.border,
                    },
                    pressed && styles.pressed,
                  ]}
                >
                  <Ionicons
                    name="ellipsis-horizontal"
                    size={18}
                    color={theme.textSecondary}
                  />
                </Pressable>
              ) : null}
            </View>
          </>
        ) : null}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    overflow: "hidden",
    borderWidth: 1,
    borderRadius: radius.xl,
    elevation: 2,
    shadowColor: "#000000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.04,
    shadowRadius: 6,
  },
  imageArea: {
    width: "100%",
  },
  image: {
    width: "100%",
    aspectRatio: 16 / 9,
  },
  imageCompact: {
    aspectRatio: 2.2,
  },
  imageFallback: {
    width: "100%",
    aspectRatio: 16 / 9,
    alignItems: "center",
    justifyContent: "center",
  },
  body: {
    padding: spacing.lg,
    gap: spacing.md - 2,
  },
  badgeRow: {
    minHeight: 26,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },
  plate: {
    alignSelf: "flex-start",
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: radius.sm,
    borderWidth: 1,
  },
  plateText: {
    fontSize: 11,
    fontWeight: "800",
    letterSpacing: 1.1,
  },
  title: {
    fontSize: fontSize.md,
    lineHeight: 22,
    fontWeight: fontWeight.bold,
  },
  metaWrap: {
    flexDirection: "row",
    flexWrap: "wrap",
    alignItems: "center",
    gap: spacing.xs,
  },
  metaItem: {
    flexDirection: "row",
    alignItems: "center",
    gap: spacing.xs,
  },
  price: {
    fontSize: fontSize.md,
    fontWeight: fontWeight.bold,
  },
  metaDot: {
    fontSize: fontSize.xs,
  },
  meta: {
    fontSize: fontSize.xs,
  },
  verifiedRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    marginTop: 2,
  },
  verifiedText: {
    fontSize: fontSize.xs,
    fontWeight: fontWeight.semibold,
  },

  inspectBanner: {
    flexDirection: "row",
    alignItems: "center",
    gap: spacing.sm,
    borderWidth: 1,
    borderRadius: radius.md,
    paddingHorizontal: spacing.md,
    paddingVertical: 9,
    marginTop: 2,
  },
  inspectBannerText: {
    flex: 1,
    fontSize: 12,
    fontWeight: fontWeight.semibold,
  },

  divider: {
    height: StyleSheet.hairlineWidth,
    marginVertical: 2,
  },

  actions: {
    flexDirection: "row",
    alignItems: "center",
    gap: spacing.sm,
  },
  actionBtn: {
    minHeight: 40,
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 6,
    borderWidth: 1,
    borderRadius: radius.md,
  },
  actionBtnText: {
    fontSize: fontSize.xs + 0.5,
    fontWeight: fontWeight.semibold,
  },
  moreBtn: {
    width: 40,
    height: 40,
    borderWidth: 1,
    borderRadius: radius.md,
    alignItems: "center",
    justifyContent: "center",
  },
  pressed: {
    opacity: 0.7,
  },
});
