import { fontWeight } from "@/constants/theme";
import { formatStatus } from "@/features/jobs/job.helpers";
import { useAppTheme } from "@/hooks/use-app-theme";
import { StyleSheet, Text, View } from "react-native";

export default function JobStatusBadge({ status }: { status: string }) {
  const theme = useAppTheme();

  const assigned =
    status === "assigned" ||
    status === "confirmed" ||
    status === "inspection_scheduled";
  const onTheWay = status === "on_the_way";
  const inProgress =
    status === "in_progress" || status === "inspection_in_progress";
  const reportSubmitted = status === "report_submitted";
  const completed = status === "completed";
  const cancelled = status === "cancelled" || status === "declined";

  // FIX: background, color, border ab same family se
  const backgroundColor =
    completed || reportSubmitted
      ? theme.successSoft
      : cancelled
        ? theme.dangerSoft
        : onTheWay || inProgress
          ? (theme as any).actionSoft || theme.primarySoft
          : assigned
            ? theme.primarySoft
            : theme.surfaceMuted;
  const color =
    completed || reportSubmitted
      ? theme.success
      : cancelled
        ? theme.danger
        : onTheWay || inProgress
          ? theme.action
          : assigned
            ? theme.primary
            : theme.textSecondary;
  const borderColor =
    completed || reportSubmitted
      ? theme.success
      : cancelled
        ? theme.danger
        : onTheWay || inProgress
          ? theme.action
          : assigned
            ? theme.primary
            : theme.border;

  return (
    <View style={[styles.badge, { backgroundColor, borderColor }]}>
      <Text numberOfLines={1} style={[styles.text, { color }]}>
        {formatStatus(status)}
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  badge: {
    flexShrink: 1,
    alignSelf: "flex-start",
    paddingHorizontal: 9,
    paddingVertical: 5,
    borderRadius: 999,
    borderWidth: StyleSheet.hairlineWidth,
  },
  text: {
    flexShrink: 1,
    fontSize: 10,
    lineHeight: 13,
    fontWeight: fontWeight.semibold,
  },
});
