import {
  StyleSheet,
  Text,
} from "react-native";

import {
  fontWeight,
} from "@/constants/theme";
import { useAppTheme } from "@/hooks/use-app-theme";
import type {
  WorkerJobKind,
} from "@/types/job";

export default function JobTypeBadge({
  kind,
}: {
  kind: WorkerJobKind;
}) {
  const theme = useAppTheme();

  return (
    <Text
      style={[
        styles.text,
        {
          color: theme.primary,
        },
      ]}
    >
      {kind === "service"
        ? "MOBILE SERVICE"
        : "VEHICLE INSPECTION"}
    </Text>
  );
}

const styles =
  StyleSheet.create({
    text: {
      fontSize: 10,
      lineHeight: 14,

      fontWeight:
        fontWeight.bold,

      letterSpacing: 1.05,
    },
  });

