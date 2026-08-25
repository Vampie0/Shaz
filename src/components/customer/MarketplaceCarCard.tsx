import { Ionicons } from "@expo/vector-icons";
import { Image } from "expo-image";
import { memo } from "react";
import { Pressable, StyleSheet, Text, View } from "react-native";

import { fontSize, fontWeight, radius, spacing } from "@/constants/theme";
import { useAppTheme } from "@/hooks/use-app-theme";
import type { MarketplaceCar } from "@/types/marketplace";

type MarketplaceCarCardProps = {
  car: MarketplaceCar;
  onPress: () => void;
};

function formatPrice(value: number) {
  return "£" + value.toLocaleString("en-GB", { maximumFractionDigits: 0 });
}

function formatMileage(value: number) {
  return value.toLocaleString("en-GB") + " miles";
}

function titleCase(value: string) {
  return value
    .replaceAll("_", " ")
    .replace(/\b\w/g, (letter) => letter.toUpperCase());
}

function MarketplaceCarCardComponent({ car, onPress }: MarketplaceCarCardProps) {
  const theme = useAppTheme();

  const title = [car.year, car.make, car.model, car.variant]
    .filter(Boolean)
    .join(" ");

  return (
    <Pressable
      accessibilityRole="button"
      onPress={onPress}
      style={({ pressed }) => [
        styles.card,
        {
          backgroundColor: theme.surface,
          borderColor: theme.border,
        },
        pressed && styles.pressed,
      ]}
    >
      <View style={styles.imageArea}>
        {car.imageUrl ? (
          <Image
            source={{ uri: car.imageUrl }}
            contentFit="cover"
            cachePolicy="memory-disk"
            transition={150}
            style={styles.image}
          />
        ) : (
          <View
            style={[
              styles.imageFallback,
              { backgroundColor: theme.surfaceSecondary },
            ]}
          >
            <Ionicons name="car-sport-outline" size={48} color={theme.textMuted} />
          </View>
        )}

        {car.isVerified ? (
          <View
            style={[
              styles.verified,
              { backgroundColor: theme.successSoft },
            ]}
          >
            <Ionicons name="checkmark-circle" size={14} color={theme.success} />
            <Text style={[styles.verifiedText, { color: theme.success }]}>
              Verified
            </Text>
          </View>
        ) : null}
      </View>

      <View style={styles.body}>
        <Text style={[styles.title, { color: theme.text }]}>
          {title}
        </Text>

        <Text style={[styles.price, { color: theme.text }]}>
          {formatPrice(car.price)}
        </Text>

        <View style={styles.specs}>
          <Text style={[styles.spec, { color: theme.textSecondary }]}>
            {formatMileage(car.mileage)}
          </Text>

          <View style={[styles.dot, { backgroundColor: theme.border }]} />

          <Text style={[styles.spec, { color: theme.textSecondary }]}>
            {titleCase(car.fuelType)}
          </Text>

          <View style={[styles.dot, { backgroundColor: theme.border }]} />

          <Text style={[styles.spec, { color: theme.textSecondary }]}>
            {titleCase(car.transmission)}
          </Text>
        </View>

        <View style={[styles.divider, { backgroundColor: theme.border }]} />

        <View style={styles.locationRow}>
          <Ionicons name="location-outline" size={16} color={theme.textMuted} />

          <Text numberOfLines={1} style={[styles.location, { color: theme.textSecondary }]}>
            {car.city}
          </Text>

          <Ionicons name="chevron-forward" size={16} color={theme.textMuted} />
        </View>
      </View>
    </Pressable>
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
    position: "relative",
    width: "100%",
    aspectRatio: 16 / 9,
  },
  image: {
    width: "100%",
    height: "100%",
  },
  imageFallback: {
    width: "100%",
    height: "100%",
    alignItems: "center",
    justifyContent: "center",
  },
  verified: {
    position: "absolute",
    top: spacing.md,
    left: spacing.md,
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: radius.pill,
  },
  verifiedText: {
    fontSize: 10,
    fontWeight: fontWeight.bold,
  },
  body: {
    padding: spacing.lg,
    gap: spacing.md,
  },
  title: {
    fontSize: fontSize.md,
    lineHeight: 22,
    fontWeight: fontWeight.bold,
  },
  price: {
    fontSize: 22,
    lineHeight: 28,
    fontWeight: fontWeight.bold,
    letterSpacing: -0.5,
  },
  specs: {
    flexDirection: "row",
    flexWrap: "wrap",
    alignItems: "center",
    gap: spacing.sm,
  },
  spec: {
    fontSize: fontSize.xs,
  },
  dot: {
    width: 4,
    height: 4,
    borderRadius: 2,
  },
  divider: {
    height: StyleSheet.hairlineWidth,
  },
  locationRow: {
    minHeight: 28,
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
  },
  location: {
    flex: 1,
    fontSize: fontSize.xs,
    fontWeight: fontWeight.semibold,
  },
  pressed: {
    opacity: 0.78,
    transform: [{ scale: 0.992 }],
  },
});

export default memo(MarketplaceCarCardComponent);
