import {
  StyleSheet,
  Text,
  View,
} from "react-native";

import {
  fontWeight,
} from "@/constants/theme";
import {
  formatStatus,
} from "@/features/jobs/job.helpers";
import { useAppTheme } from "@/hooks/use-app-theme";

export default function JobStatusBadge({
  status,
}: {
  status: string;
}) {
  const theme = useAppTheme();

  const completed =
    status === "completed";

  const cancelled =
    status === "cancelled" ||
    status === "declined";

  const backgroundColor =
    completed
      ? theme.successSoft
      : cancelled
        ? theme.dangerSoft
        : theme.surfaceMuted;

  const color =
    completed
      ? theme.success
      : cancelled
        ? theme.danger
        : theme.textSecondary;

  return (
    <View
      style={[
        styles.badge,
        {
          backgroundColor,
        },
      ]}
    >
      <Text
        numberOfLines={1}
        style={[
          styles.text,
          {
            color,
          },
        ]}
      >
        {formatStatus(status)}
      </Text>
    </View>
  );
}

const styles =
  StyleSheet.create({
    badge: {
      alignSelf: "flex-start",

      paddingHorizontal: 9,
      paddingVertical: 5,

      borderRadius: 999,
    },

    text: {
      fontSize: 10,
      lineHeight: 13,

      fontWeight:
        fontWeight.semibold,
    },
  });

