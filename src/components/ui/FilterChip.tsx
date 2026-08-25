import { Pressable, StyleSheet, Text } from "react-native";

import { fontSize, fontWeight, radius, spacing } from "@/constants/theme";
import { useAppTheme } from "@/hooks/use-app-theme";

type FilterChipProps = {
  label: string;
  selected: boolean;
  onPress: () => void;
};

export default function FilterChip({
  label,
  selected,
  onPress,
}: FilterChipProps) {
  const theme = useAppTheme();

  return (
    <Pressable
      accessibilityRole="button"
      accessibilityState={{ selected }}
      onPress={onPress}
      style={({ pressed }) => [
        styles.container,
        {
          backgroundColor: selected ? theme.action : theme.surface,
          borderColor: selected ? theme.action : theme.border,
        },
        pressed && styles.pressed,
      ]}
    >
      <Text
        style={[
          styles.label,
          {
            color: selected ? theme.actionText : theme.textSecondary,
          },
        ]}
      >
        {label}
      </Text>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  container: {
    minHeight: 40,
    justifyContent: "center",
    paddingHorizontal: spacing.lg,
    borderRadius: radius.pill,
    borderWidth: 1,
  },

  label: {
    fontSize: fontSize.sm,
    fontWeight: fontWeight.semibold,
  },

  pressed: {
    opacity: 0.78,
  },
});
