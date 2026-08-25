import { Ionicons } from "@expo/vector-icons";
import { Pressable, StyleSheet, Text, View } from "react-native";

import { fontSize, fontWeight, radius, spacing } from "@/constants/theme";
import { useAppTheme } from "@/hooks/use-app-theme";
import type { CustomerGarageVehicle } from "@/types/customer";

type CustomerVehicleCardProps = {
  vehicle: CustomerGarageVehicle;
  compact?: boolean;
  onBookService?: () => void;
  onCompatibleParts?: () => void;
  onMore?: () => void;
};

export default function CustomerVehicleCard({
  vehicle,
  compact = false,
  onBookService,
  onCompatibleParts,
  onMore,
}: CustomerVehicleCardProps) {
  const theme = useAppTheme();

  const title = [vehicle.year, vehicle.make, vehicle.model, vehicle.variant]
    .filter(Boolean)
    .join(" ");

  const details = [vehicle.fuelType, vehicle.colour]
    .filter(Boolean)
    .join(" · ");

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
      <View style={styles.top}>
        <View
          style={[
            styles.iconWrap,
            { backgroundColor: theme.surfaceSecondary },
          ]}
        >
          <Ionicons name="car-outline" size={26} color={theme.primary} />
        </View>

        <View style={styles.copy}>
          <Text style={[styles.title, { color: theme.text }]}>
            {title}
          </Text>

          {details ? (
            <Text style={[styles.details, { color: theme.textSecondary }]}>
              {details}
            </Text>
          ) : null}
        </View>
      </View>

      {vehicle.registration ? (
        <View
          style={[
            styles.plate,
            {
              backgroundColor: theme.surfaceSecondary,
              borderColor: theme.inputBorder,
            },
          ]}
        >
          <View style={[styles.plateBand, { backgroundColor: theme.primary }]}>
            <Text style={styles.plateBandText}>UK</Text>
          </View>

          <Text style={[styles.plateText, { color: theme.text }]}>
            {vehicle.registration}
          </Text>
        </View>
      ) : null}

      {!compact && (onBookService || onCompatibleParts || onMore) ? (
        <>
          <View style={[styles.divider, { backgroundColor: theme.border }]} />

          <View style={styles.actions}>
            {onBookService ? (
              <Pressable
                accessibilityRole="button"
                onPress={onBookService}
                style={({ pressed }) => [
                  styles.action,
                  { backgroundColor: theme.surfaceSecondary },
                  pressed && styles.pressed,
                ]}
              >
                <Ionicons name="build-outline" size={16} color={theme.text} />
                <Text style={[styles.actionText, { color: theme.text }]}>
                  Book Service
                </Text>
              </Pressable>
            ) : null}

            {onCompatibleParts ? (
              <Pressable
                accessibilityRole="button"
                onPress={onCompatibleParts}
                style={({ pressed }) => [
                  styles.action,
                  { backgroundColor: theme.primarySoft },
                  pressed && styles.pressed,
                ]}
              >
                <Ionicons name="settings-outline" size={16} color={theme.primary} />
                <Text style={[styles.actionText, { color: theme.primary }]}>
                  Parts
                </Text>
              </Pressable>
            ) : null}

            {onMore ? (
              <Pressable
                accessibilityRole="button"
                accessibilityLabel="More vehicle actions"
                onPress={onMore}
                style={({ pressed }) => [
                  styles.more,
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
  );
}

const styles = StyleSheet.create({
  card: {
    borderWidth: 1,
    borderRadius: radius.xl,
    padding: spacing.lg,
    gap: spacing.lg,
    elevation: 3,
    shadowColor: "#000000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 8,
  },
  top: {
    flexDirection: "row",
    alignItems: "center",
    gap: spacing.md,
  },
  iconWrap: {
    width: 52,
    height: 52,
    borderRadius: radius.lg,
    alignItems: "center",
    justifyContent: "center",
  },
  copy: {
    flex: 1,
    gap: 4,
  },
  title: {
    fontSize: fontSize.md,
    lineHeight: 22,
    fontWeight: fontWeight.bold,
  },
  details: {
    fontSize: fontSize.xs,
    textTransform: "capitalize",
  },
  plate: {
    alignSelf: "flex-start",
    minHeight: 32,
    flexDirection: "row",
    overflow: "hidden",
    borderWidth: 1,
    borderRadius: radius.sm,
  },
  plateBand: {
    width: 28,
    alignItems: "center",
    justifyContent: "center",
  },
  plateBandText: {
    color: "#FFFFFF",
    fontSize: 9,
    fontWeight: "800",
  },
  plateText: {
    alignSelf: "center",
    paddingHorizontal: 10,
    fontSize: 13,
    fontWeight: "800",
    letterSpacing: 1.5,
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
  more: {
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
