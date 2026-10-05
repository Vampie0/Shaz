// File: src/components/customer/CustomerInspectionCard.tsx

import { Ionicons } from "@expo/vector-icons";
import { Pressable, StyleSheet, Text, View } from "react-native";

import CustomerStatusBadge from "@/components/customer/CustomerStatusBadge";
import { fontSize, fontWeight, radius, spacing } from "@/constants/theme";
import { useAppTheme } from "@/hooks/use-app-theme";
import type { CustomerInspection } from "@/types/customer";

type CustomerInspectionCardProps = {
  inspection: CustomerInspection;
  compact?: boolean;
  onViewRequest?: () => void;
};

function titleCase(value: string) {
  return value
    .replaceAll("_", " ")
    .replace(/\b\w/g, (letter) => letter.toUpperCase());
}

function inspectionTypeLabel(value: string) {
  switch (value) {
    case "seller_pre_inspection":
      return "Seller pre-inspection";
    case "buyer_inspection":
      return "Buyer inspection";
    default:
      return titleCase(value);
  }
}

// SENIOR'S EXACT STATUS LABELS & TONES (dashboard/verifications/page.tsx)
function statusMeta(status: string) {
  switch (status) {
    case "pending":
      return { label: "Inspection pending", tone: "warning" as const };
    case "confirmed":
      return { label: "Confirmed", tone: "success" as const };
    case "assigned":
      return { label: "Inspector assigned", tone: "info" as const };
    case "inspection_scheduled":
      return { label: "Scheduled", tone: "info" as const };
    case "inspection_in_progress":
      return { label: "Inspection in progress", tone: "info" as const };
    case "report_submitted":
      return { label: "Report ready", tone: "info" as const };
    case "completed":
      return { label: "Inspected by Shaz", tone: "success" as const };
    case "cancelled":
      return { label: "Cancelled", tone: "neutral" as const };
    default:
      return { label: titleCase(status), tone: "neutral" as const };
  }
}

function formatDate(preferredDate: string | null, scheduledFor: string | null) {
  const source = scheduledFor ?? preferredDate;
  if (!source) return null;
  const date = new Date(scheduledFor ? source : source + "T00:00:00");
  if (Number.isNaN(date.getTime())) return source;
  return new Intl.DateTimeFormat("en-GB", {
    day: "numeric",
    month: "short",
    year: "numeric",
  }).format(date);
}

export default function CustomerInspectionCard({
  inspection,
  compact = false,
  onViewRequest,
}: CustomerInspectionCardProps) {
  const theme = useAppTheme();
  const status = statusMeta(inspection.status);

  const vehicle = [inspection.year, inspection.make, inspection.model]
    .filter(Boolean)
    .join(" ");

  const date = formatDate(inspection.preferredDate, inspection.scheduledFor);

  return (
    <Pressable
      accessibilityRole="button"
      disabled={!onViewRequest}
      onPress={onViewRequest}
      style={({ pressed }) => [
        styles.card,
        {
          backgroundColor: theme.surface,
          borderColor: theme.border,
        },
        pressed && onViewRequest && styles.pressed,
      ]}
    >
      <View style={styles.header}>
        <View style={styles.copy}>
          <Text style={[styles.eyebrow, { color: theme.primary }]}>
            {inspectionTypeLabel(inspection.inspectionType).toUpperCase()}
          </Text>

          <Text style={[styles.vehicle, { color: theme.text }]}>
            {vehicle || "Vehicle inspection"}
          </Text>

          <View style={styles.metaRow}>
            {inspection.registration ? (
              <View style={styles.metaItem}>
                <Ionicons
                  name="car-outline"
                  size={14}
                  color={theme.textMuted}
                />
                <Text style={[styles.meta, { color: theme.textSecondary }]}>
                  {inspection.registration}
                </Text>
              </View>
            ) : null}

            {date ? (
              <View style={styles.metaItem}>
                <Ionicons
                  name="calendar-outline"
                  size={14}
                  color={theme.textMuted}
                />
                <Text style={[styles.meta, { color: theme.textSecondary }]}>
                  {date}
                </Text>
              </View>
            ) : null}
          </View>
        </View>

        <CustomerStatusBadge label={status.label} tone={status.tone} />
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
    shadowColor: "#000000",
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
  copy: {
    flex: 1,
    gap: 4,
  },
  eyebrow: {
    fontSize: 10,
    fontWeight: fontWeight.bold,
    letterSpacing: 1,
  },
  vehicle: {
    fontSize: fontSize.md,
    fontWeight: fontWeight.bold,
  },
  metaRow: {
    flexDirection: "row",
    flexWrap: "wrap",
    alignItems: "center",
    gap: spacing.md,
    marginTop: 2,
  },
  metaItem: {
    flexDirection: "row",
    alignItems: "center",
    gap: 5,
  },
  meta: {
    fontSize: fontSize.xs,
  },
  pressed: {
    opacity: 0.72,
    transform: [{ scale: 0.99 }],
  },
});
