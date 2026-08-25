import { StyleSheet, Text, View } from "react-native";

import { fontSize, fontWeight, spacing } from "@/constants/theme";
import { useAppTheme } from "@/hooks/use-app-theme";

type InfoRowProps = {
  label: string;
  value: string;
  last?: boolean;
};

export default function InfoRow({
  label,
  value,
  last = false,
}: InfoRowProps) {
  const theme = useAppTheme();

  return (
    <View
      style={[
        styles.row,
        !last && {
          borderBottomWidth: 1,
          borderBottomColor: theme.border,
        },
      ]}
    >
      <Text style={[styles.label, { color: theme.textSecondary }]}>
        {label}
      </Text>

      <Text style={[styles.value, { color: theme.text }]}>
        {value}
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  row: {
    paddingVertical: spacing.md,
    gap: spacing.xs,
  },

  label: {
    fontSize: fontSize.xs,
    fontWeight: fontWeight.semibold,
  },

  value: {
    fontSize: fontSize.md,
    fontWeight: fontWeight.semibold,
    lineHeight: 22,
  },
});
