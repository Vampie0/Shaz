import { Ionicons } from "@expo/vector-icons";
import { memo } from "react";
import { Pressable, StyleSheet, Text, View } from "react-native";

import JobStatusBadge from "@/components/jobs/JobStatusBadge";
import JobTypeBadge from "@/components/jobs/JobTypeBadge";
import { fontWeight } from "@/constants/theme";
import { formatJobDate, formatJobTime } from "@/features/jobs/job.helpers";
import { useAppTheme } from "@/hooks/use-app-theme";
import type { WorkerJob } from "@/types/job";

type JobCardProps = {
  job: WorkerJob;
  onPress: () => void;
  showDate?: boolean;
};

function JobCardComponent({ job, onPress, showDate = false }: JobCardProps) {
  const theme = useAppTheme();

  const meta = [
    showDate ? formatJobDate(job.scheduledDate) : null,
    formatJobTime(job.scheduledTime),
    job.postcode,
  ]
    .filter(Boolean)
    .join("  ·  ");

  return (
    <Pressable
      accessibilityRole="button"
      onPress={onPress}
      style={({ pressed }) => [
        styles.row,
        {
          backgroundColor: pressed ? theme.surfaceMuted : "transparent",
        },
      ]}
    >
      <View style={styles.topRow}>
        <JobTypeBadge kind={job.kind} label={job.jobTypeLabel} />
        <JobStatusBadge status={job.status} />
      </View>

      <Text numberOfLines={1} style={[styles.vehicle, { color: theme.text }]}>
        {job.vehicleLabel}
      </Text>

      <View style={styles.detailsRow}>
        {job.registration ? (
          <Text
            style={[
              styles.registration,
              {
                backgroundColor: theme.primary,
                color: theme.primaryText,
              },
            ]}
          >
            {job.registration.toUpperCase()}
          </Text>
        ) : null}

        <View style={styles.customerArea}>
          <Ionicons name="person-outline" size={14} color={theme.textMuted} />
          <Text
            numberOfLines={1}
            style={[styles.customerName, { color: theme.textSecondary }]}
          >
            {job.customerName || "Customer"}
          </Text>
        </View>
      </View>

      <View style={styles.bottomRow}>
        <View style={styles.metaArea}>
          <Text
            numberOfLines={1}
            style={[styles.meta, { color: theme.textSecondary }]}
          >
            {meta}
          </Text>

          {job.address ? (
            <View style={styles.addressRow}>
              <Ionicons
                name="location-outline"
                size={12}
                color={theme.textMuted}
              />
              <Text
                numberOfLines={1}
                style={[styles.address, { color: theme.textMuted }]}
              >
                {job.address}
              </Text>
            </View>
          ) : null}
        </View>

        <View
          style={[styles.arrowCircle, { backgroundColor: theme.primarySoft }]}
        >
          <Ionicons name="chevron-forward" size={18} color={theme.primary} />
        </View>
      </View>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  row: { paddingVertical: 18, paddingHorizontal: 4, borderRadius: 12 },
  topRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    gap: 12,
    marginBottom: 10,
  },
  vehicle: {
    fontSize: 19,
    lineHeight: 24,
    fontWeight: fontWeight.bold,
    letterSpacing: -0.4,
  },
  detailsRow: {
    flexDirection: "row",
    alignItems: "center",
    marginTop: 6,
    gap: 12,
  },
  registration: {
    fontSize: 11,
    fontWeight: fontWeight.bold,
    letterSpacing: 1,
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 4,
    overflow: "hidden",
  },
  customerArea: { flexDirection: "row", alignItems: "center", gap: 4, flex: 1 },
  customerName: { fontSize: 13, fontWeight: fontWeight.medium },
  bottomRow: {
    marginTop: 14,
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
  },
  metaArea: { flex: 1 },
  meta: { fontSize: 13, lineHeight: 18, fontWeight: fontWeight.semibold },
  addressRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
    marginTop: 4,
  },
  address: { fontSize: 12, lineHeight: 17, flex: 1 },
  arrowCircle: {
    width: 32,
    height: 32,
    borderRadius: 16,
    alignItems: "center",
    justifyContent: "center",
  },
});

export default memo(JobCardComponent);
