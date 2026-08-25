import {
  StyleSheet,
  Text,
  View,
} from "react-native";

import {
  fontWeight,
} from "@/constants/theme";
import { useAppTheme } from "@/hooks/use-app-theme";

export default function JobDetailRow({
  label,
  value,
  last = false,
}: {
  label: string;
  value:
    | string
    | null
    | undefined;
  last?: boolean;
}) {
  const theme = useAppTheme();

  if (!value) {
    return null;
  }

  return (
    <View
      style={[
        styles.row,
        !last && {
          borderBottomWidth:
            StyleSheet.hairlineWidth,
          borderBottomColor:
            theme.border,
        },
      ]}
    >
      <Text
        style={[
          styles.label,
          {
            color: theme.textMuted,
          },
        ]}
      >
        {label}
      </Text>

      <Text
        selectable
        style={[
          styles.value,
          {
            color: theme.text,
          },
        ]}
      >
        {value}
      </Text>
    </View>
  );
}

const styles =
  StyleSheet.create({
    row: {
      paddingVertical: 15,

      flexDirection: "row",
      alignItems: "flex-start",

      gap: 16,
    },

    label: {
      width: 96,

      fontSize: 12,
      lineHeight: 18,

      fontWeight:
        fontWeight.medium,
    },

    value: {
      flex: 1,

      fontSize: 14,
      lineHeight: 20,

      fontWeight:
        fontWeight.medium,
    },
  });

