// File: src/components/customer/CustomerBookingCard.tsx

import { Ionicons } from "@expo/vector-icons";
import { Pressable, StyleSheet, Text, View } from "react-native";

import CustomerStatusBadge from "@/components/customer/CustomerStatusBadge";
import { fontSize, fontWeight, radius, spacing } from "@/constants/theme";
import { useAppTheme } from "@/hooks/use-app-theme";
import type { CustomerBooking } from "@/types/customer";

type CustomerBookingCardProps = {
  booking: CustomerBooking;
  compact?: boolean;
  onViewDetails?: () => void;
};

function formatDate(value: string | null) {
  if (!value) return "Date to be confirmed";
  const date = new Date(value + "T00:00:00");
  if (Number.isNaN(date.getTime())) return value;
  return new Intl.DateTimeFormat("en-GB", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  }).format(date);
}

function formatTime(value: string | null) {
  if (!value) return null;
  return value.slice(0, 5);
}

function titleCase(value: string) {
  return value
    .replaceAll("_", " ")
    .replace(/\b\w/g, (letter) => letter.toUpperCase());
}

function statusMeta(status: string) {
  switch (status) {
    case "completed":
      return { label: "Completed", tone: "success" as const };
    case "cancelled":
      return { label: "Cancelled", tone: "neutral" as const };
    case "in_progress":
      return { label: "In progress", tone: "info" as const };
    case "on_the_way":
      return { label: "On the way", tone: "info" as const };
    case "assigned":
      return { label: "Assigned", tone: "info" as const };
    case "confirmed":
      return { label: "Confirmed", tone: "success" as const };
    case "pending":
      return { label: "Pending", tone: "warning" as const };
    default:
      return { label: titleCase(status), tone: "neutral" as const };
  }
}

export default function CustomerBookingCard({
  booking,
  compact = false,
  onViewDetails,
}: CustomerBookingCardProps) {
  const theme = useAppTheme();
  const status = statusMeta(booking.status);

  const vehicle = [booking.carMake, booking.carModel, booking.registration]
    .filter(Boolean)
    .join(" · ");

  const time = formatTime(booking.preferredTime);

  return (
    <Pressable
      accessibilityRole="button"
      disabled={!onViewDetails}
      onPress={onViewDetails}
      style={({ pressed }) => [
        styles.card,
        {
          backgroundColor: theme.surface,
          borderColor: theme.border,
          shadowColor: theme.overlay,
        },
        pressed && onViewDetails && styles.pressed,
      ]}
    >
      <View style={styles.header}>
        <View style={styles.headerCopy}>
          <Text style={[styles.service, { color: theme.text }]}>
            {booking.serviceName}
          </Text>

          {vehicle ? (
            <Text style={[styles.vehicle, { color: theme.textSecondary }]}>
              {vehicle}
            </Text>
          ) : null}
        </View>

        <View style={styles.headerRight}>
          <CustomerStatusBadge label={status.label} tone={status.tone} />
          {/* SENIOR'S WEB MATCH: QUOTED PRICE */}
          {booking.quotedPrice ? (
            <Text style={[styles.priceText, { color: theme.primary }]}>
              From £{Number(booking.quotedPrice).toLocaleString("en-GB")}
            </Text>
          ) : null}
        </View>
      </View>

      <View style={styles.infoList}>
        <View style={styles.infoRow}>
          <View
            style={[styles.iconBox, { backgroundColor: theme.primarySoft }]}
          >
            <Ionicons name="calendar-outline" size={15} color={theme.primary} />
          </View>

          <Text style={[styles.infoText, { color: theme.textSecondary }]}>
            {formatDate(booking.preferredDate)}
            {time ? " · " + time : ""}
          </Text>
        </View>

        {booking.address ? (
          <View style={styles.infoRow}>
            <View
              style={[
                styles.iconBox,
                { backgroundColor: theme.surfaceSecondary },
              ]}
            >
              <Ionicons
                name="location-outline"
                size={15}
                color={theme.textMuted}
              />
            </View>

            <Text
              numberOfLines={1}
              style={[styles.infoText, { color: theme.textSecondary }]}
            >
              {booking.address}
            </Text>
          </View>
        ) : null}
      </View>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  card: {
    borderWidth: 1,
    borderRadius: radius.xl,
    padding: spacing.lg,
    gap: spacing.md,
    elevation: 2,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.04,
    shadowRadius: 6,
  },
  header: {
    flexDirection: "row",
    alignItems: "flex-start",
    justifyContent: "space-between",
    gap: spacing.md,
  },
  headerCopy: {
    flex: 1,
    gap: 3,
  },
  headerRight: {
    alignItems: "flex-end",
    gap: 4,
  },
  service: {
    fontSize: fontSize.md,
    fontWeight: fontWeight.bold,
  },
  vehicle: {
    fontSize: fontSize.xs,
  },
  priceText: {
    fontSize: fontSize.xs + 0.5,
    fontWeight: fontWeight.bold,
  },
  infoList: {
    gap: 6,
  },
  infoRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: spacing.sm,
  },
  iconBox: {
    width: 26,
    height: 26,
    borderRadius: radius.sm,
    alignItems: "center",
    justifyContent: "center",
  },
  infoText: {
    flex: 1,
    fontSize: fontSize.xs,
  },
  pressed: {
    opacity: 0.72,
    transform: [{ scale: 0.99 }],
  },
});
