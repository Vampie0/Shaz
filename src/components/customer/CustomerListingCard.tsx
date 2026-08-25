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
}: CustomerListingCardProps) {
  const theme = useAppTheme();

  const title = [car.year, car.make, car.model, car.variant]
    .filter(Boolean)
    .join(" ");

  const isSold = car.status === "sold";
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
        <View style={styles.badgeRow}>
          {car.registration ? (
            <View
              style={[
                styles.plate,
                {
                  backgroundColor: theme.surfaceSecondary,
                  borderColor: theme.inputBorder,
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
                  : "neutral"
            }
          />
        </View>

        <Text
          numberOfLines={compact ? 2 : 3}
          style={[styles.title, { color: theme.text }]}
        >
          {title}
        </Text>

        <View style={styles.metaWrap}>
          <Text style={[styles.price, { color: theme.text }]}>
            {formatMoney(car.price)}
          </Text>

          {formatMileage(car.mileage) ? (
            <Text style={[styles.meta, { color: theme.textSecondary }]}>
              {formatMileage(car.mileage)}
            </Text>
          ) : null}

          {car.city ? (
            <Text style={[styles.meta, { color: theme.textSecondary }]}>
              {car.city}
            </Text>
          ) : null}
        </View>

        {car.isVerified ? (
          <View style={styles.verified}>
            <Ionicons name="checkmark-circle" size={16} color={theme.success} />
            <Text style={[styles.verifiedText, { color: theme.success }]}>
              Fengxing Verified
            </Text>
          </View>
        ) : null}

        {showActions ? (
          <>
            <View style={[styles.divider, { backgroundColor: theme.border }]} />

            <View style={styles.actions}>
              {onView ? (
                <Pressable
                  accessibilityRole="button"
                  onPress={onView}
                  style={({ pressed }) => [
                    styles.action,
                    { backgroundColor: theme.surfaceSecondary },
                    pressed && styles.pressed,
                  ]}
                >
                  <Ionicons name="eye-outline" size={16} color={theme.text} />
                  <Text style={[styles.actionText, { color: theme.text }]}>
                    View
                  </Text>
                </Pressable>
              ) : null}

              {onEdit ? (
                <Pressable
                  accessibilityRole="button"
                  onPress={onEdit}
                  style={({ pressed }) => [
                    styles.action,
                    { backgroundColor: theme.primarySoft },
                    pressed && styles.pressed,
                  ]}
                >
                  <Ionicons name="create-outline" size={16} color={theme.primary} />
                  <Text style={[styles.actionText, { color: theme.primary }]}>
                    Edit
                  </Text>
                </Pressable>
              ) : null}

              {onMore ? (
                <Pressable
                  accessibilityRole="button"
                  accessibilityLabel="More listing actions"
                  onPress={onMore}
                  style={({ pressed }) => [
                    styles.moreAction,
                    { backgroundColor: theme.surfaceSecondary },
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
    elevation: 3,
    shadowColor: "#000000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 8,
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
    gap: spacing.md,
  },

  badgeRow: {
    minHeight: 28,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    gap: spacing.md,
  },

  plate: {
    alignSelf: "flex-start",
    paddingHorizontal: 9,
    paddingVertical: 4,
    borderRadius: radius.sm,
    borderWidth: 1,
  },

  plateText: {
    fontSize: 11,
    fontWeight: "800",
    letterSpacing: 1.2,
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
    gap: spacing.md,
  },

  price: {
    fontSize: fontSize.md,
    fontWeight: fontWeight.bold,
  },

  meta: {
    fontSize: fontSize.xs,
  },

  verified: {
    flexDirection: "row",
    alignItems: "center",
    gap: 5,
  },

  verifiedText: {
    fontSize: fontSize.xs,
    fontWeight: fontWeight.bold,
  },

  divider: {
    height: StyleSheet.hairlineWidth,
  },

  actions: {
    flexDirection: "row",
    alignItems: "center",
    gap: spacing.sm,
  },

  action: {
    minHeight: 38,
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 6,
    borderRadius: radius.md,
  },

  actionText: {
    fontSize: fontSize.xs,
    fontWeight: fontWeight.bold,
  },

  moreAction: {
    width: 38,
    height: 38,
    borderRadius: radius.md,
    alignItems: "center",
    justifyContent: "center",
  },

  pressed: {
    opacity: 0.65,
  },
});
