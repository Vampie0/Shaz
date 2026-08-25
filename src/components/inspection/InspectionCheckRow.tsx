import { StyleSheet, Text, View } from "react-native";

import FilterChip from "@/components/ui/FilterChip";
import { fontSize, fontWeight, spacing } from "@/constants/theme";
import { useAppTheme } from "@/hooks/use-app-theme";
import type { ConditionRating } from "@/services/inspection/inspection-report.service";

type InspectionCheckRowProps = {
  label: string;
  value: ConditionRating;
  onChange: (value: ConditionRating) => void;
};

const options: { label: string; value: ConditionRating }[] = [
  { label: "Excellent", value: "excellent" },
  { label: "Good", value: "good" },
  { label: "Fair", value: "fair" },
  { label: "Poor", value: "poor" },
];

export default function InspectionCheckRow({
  label,
  value,
  onChange,
}: InspectionCheckRowProps) {
  const theme = useAppTheme();

  return (
    <View style={styles.container}>
      <Text style={[styles.label, { color: theme.text }]}>{label}</Text>

      <View style={styles.options}>
        {options.map((option) => (
          <FilterChip
            key={option.value}
            label={option.label}
            selected={value === option.value}
            onPress={() => onChange(option.value)}
          />
        ))}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    gap: spacing.sm,
  },

  label: {
    fontSize: fontSize.sm,
    fontWeight: fontWeight.semibold,
  },

  options: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: spacing.sm,
  },
});
