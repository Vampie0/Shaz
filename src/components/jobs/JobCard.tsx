import {
  memo,
} from "react";
import {
  Pressable,
  StyleSheet,
  Text,
  View,
} from "react-native";

import JobStatusBadge from "@/components/jobs/JobStatusBadge";
import JobTypeBadge from "@/components/jobs/JobTypeBadge";
import {
  fontWeight,
} from "@/constants/theme";
import {
  formatJobDate,
  formatJobTime,
} from "@/features/jobs/job.helpers";
import { useAppTheme } from "@/hooks/use-app-theme";
import type {
  WorkerJob,
} from "@/types/job";

type JobCardProps = {
  job: WorkerJob;
  onPress: () => void;
  showDate?: boolean;
};

function JobCardComponent({
  job,
  onPress,
  showDate = false,
}: JobCardProps) {
  const theme = useAppTheme();

  const meta = [
    showDate
      ? formatJobDate(
          job.scheduledDate,
        )
      : null,

    formatJobTime(
      job.scheduledTime,
    ),

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
          backgroundColor:
            pressed
              ? theme.surfaceMuted
              : "transparent",
        },
      ]}
    >
      <View style={styles.topRow}>
        <JobTypeBadge
          kind={job.kind}
        />

        <JobStatusBadge
          status={job.status}
        />
      </View>

      <Text
        numberOfLines={1}
        style={[
          styles.vehicle,
          {
            color: theme.text,
          },
        ]}
      >
        {job.vehicleLabel}
      </Text>

      {job.registration ? (
        <Text
          style={[
            styles.registration,
            {
              color:
                theme.textSecondary,
            },
          ]}
        >
          {job.registration.toUpperCase()}
        </Text>
      ) : null}

      <View style={styles.bottomRow}>
        <View style={styles.metaArea}>
          <Text
            numberOfLines={1}
            style={[
              styles.meta,
              {
                color:
                  theme.textSecondary,
              },
            ]}
          >
            {meta}
          </Text>

          {job.address ? (
            <Text
              numberOfLines={1}
              style={[
                styles.address,
                {
                  color:
                    theme.textMuted,
                },
              ]}
            >
              {job.address}
            </Text>
          ) : null}
        </View>

        <Text
          style={[
            styles.chevron,
            {
              color: theme.primary,
            },
          ]}
        >
          ›
        </Text>
      </View>
    </Pressable>
  );
}

const styles =
  StyleSheet.create({
    row: {
      paddingVertical: 17,
      paddingHorizontal: 2,

      borderRadius: 10,
    },

    topRow: {
      flexDirection: "row",
      alignItems: "center",
      justifyContent:
        "space-between",

      gap: 12,

      marginBottom: 10,
    },

    vehicle: {
      fontSize: 18,
      lineHeight: 23,

      fontWeight:
        fontWeight.bold,

      letterSpacing: -0.25,
    },

    registration: {
      marginTop: 2,

      fontSize: 12,
      lineHeight: 17,

      fontWeight:
        fontWeight.semibold,

      letterSpacing: 0.7,
    },

    bottomRow: {
      marginTop: 11,

      flexDirection: "row",
      alignItems: "center",

      gap: 12,
    },

    metaArea: {
      flex: 1,
    },

    meta: {
      fontSize: 13,
      lineHeight: 18,

      fontWeight:
        fontWeight.medium,
    },

    address: {
      marginTop: 3,

      fontSize: 12,
      lineHeight: 17,
    },

    chevron: {
      fontSize: 28,
      lineHeight: 30,

      fontWeight:
        fontWeight.regular,
    },
  });

export default memo(
  JobCardComponent,
);

