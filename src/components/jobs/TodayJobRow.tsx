import {
  memo,
} from "react";
import {
  ActivityIndicator,
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
  formatJobTime,
} from "@/features/jobs/job.helpers";
import { useAppTheme } from "@/hooks/use-app-theme";
import type {
  WorkerJob,
} from "@/types/job";

type Props = {
  job: WorkerJob;

  actionLabel?: string | null;
  actionLoading?: boolean;

  onOpen: () => void;
  onAction?: () => void;
};

function TodayJobRowComponent({
  job,
  actionLabel,
  actionLoading = false,
  onOpen,
  onAction,
}: Props) {
  const theme = useAppTheme();

  return (
    <View
      style={[
        styles.container,
        {
          borderBottomColor:
            theme.border,
        },
      ]}
    >
      <View style={styles.topRow}>
        <View style={styles.timeArea}>
          <Text
            style={[
              styles.time,
              {
                color: theme.text,
              },
            ]}
          >
            {formatJobTime(
              job.scheduledTime,
            )}
          </Text>

          <Text
            style={[
              styles.today,
              {
                color: theme.primary,
              },
            ]}
          >
            TODAY
          </Text>
        </View>

        <View style={styles.typeArea}>
          <JobTypeBadge
            kind={job.kind}
          />

          <JobStatusBadge
            status={job.status}
          />
        </View>
      </View>

      <View style={styles.main}>
        <View style={styles.vehicleArea}>
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

          <Text
            numberOfLines={1}
            style={[
              styles.location,
              {
                color:
                  theme.textSecondary,
              },
            ]}
          >
            {[
              job.city,
              job.postcode,
            ]
              .filter(Boolean)
              .join(" · ") ||
              job.address ||
              "Location not set"}
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
</View>

      <View style={styles.actions}>
        {actionLabel &&
        onAction ? (
          <Pressable
            accessibilityRole="button"
            disabled={actionLoading}
            onPress={onAction}
            style={({ pressed }) => [
              styles.primaryAction,
              {
                backgroundColor:
                  theme.action,
              },
              pressed &&
                !actionLoading && {
                  opacity: 0.78,
                },
              actionLoading && {
                opacity: 0.62,
              },
            ]}
          >
            {actionLoading ? (
              <ActivityIndicator
                size="small"
                color={theme.actionText}
              />
            ) : (
              <Text
                style={[
                  styles.primaryActionText,
                  { color: theme.actionText },
                ]}
              >
                {actionLabel}
              </Text>
            )}
          </Pressable>
        ) : (
          <View />
        )}

        <Pressable
          accessibilityRole="button"
          onPress={onOpen}
          style={({ pressed }) => [
            styles.viewAction,
            {
              borderColor:
                theme.border,
              backgroundColor:
                theme.surface,
            },
            pressed && {
              opacity: 0.65,
            },
          ]}
        >
          <Text
            style={[
              styles.viewActionText,
              {
                color: theme.text,
              },
            ]}
          >
            View job
          </Text>

          <Text
            style={[
              styles.viewArrow,
              {
                color: theme.primary,
              },
            ]}
          >
            ›
          </Text>
        </Pressable>
      </View>
    </View>
  );
}

const styles =
  StyleSheet.create({
    container: {
      paddingVertical: 18,

      borderBottomWidth:
        StyleSheet.hairlineWidth,
    },

    topRow: {
      flexDirection: "row",
      alignItems: "flex-start",

      gap: 16,
    },

    timeArea: {
      width: 84,
      paddingTop: 1,
    },

    time: {
      fontSize: 17,
      lineHeight: 21,

      fontWeight:
        fontWeight.bold,

      letterSpacing: -0.3,
    },

    today: {
      marginTop: 3,

      fontSize: 9,
      lineHeight: 12,

      fontWeight:
        fontWeight.bold,

      letterSpacing: 1.1,
    },

    typeArea: {
      flex: 1,

      flexDirection: "row",
      alignItems: "center",
      justifyContent:
        "space-between",

      gap: 10,
    },

    main: {
      marginTop: 12,

      flexDirection: "row",
      alignItems: "center",

      gap: 14,
    },

    vehicleArea: {
      flex: 1,
    },

    vehicle: {
      fontSize: 20,
      lineHeight: 25,

      fontWeight:
        fontWeight.bold,

      letterSpacing: -0.4,
    },

    registration: {
      marginTop: 3,

      fontSize: 12,
      lineHeight: 17,

      fontWeight:
        fontWeight.semibold,

      letterSpacing: 0.75,
    },

    location: {
      marginTop: 10,

      fontSize: 13,
      lineHeight: 18,

      fontWeight:
        fontWeight.semibold,
    },

    address: {
      marginTop: 3,

      fontSize: 12,
      lineHeight: 17,
    },

    actions: {
      marginTop: 15,

      flexDirection: "row",
      alignItems: "center",
      justifyContent:
        "space-between",

      gap: 10,
    },

    primaryAction: {
      minHeight: 40,

      paddingHorizontal: 16,

      alignItems: "center",
      justifyContent: "center",

      borderRadius: 11,

      borderWidth: 1,
      borderColor: "rgba(255,255,255,0.16)",
    },

    primaryActionText: {
      fontSize: 12,
      lineHeight: 16,

      fontWeight: fontWeight.bold,

      letterSpacing: 0.15,
    },

    viewAction: {
      minHeight: 38,

      paddingLeft: 14,
      paddingRight: 11,

      flexDirection: "row",
      alignItems: "center",
      justifyContent: "center",

      gap: 7,

      borderWidth: 1,
      borderRadius: 999,
    },

    viewActionText: {
      fontSize: 12,
      lineHeight: 16,

      fontWeight:
        fontWeight.bold,
    },

    viewArrow: {
      marginTop: -1,

      fontSize: 20,
      lineHeight: 20,
    },
  });

export default memo(
  TodayJobRowComponent,
);

