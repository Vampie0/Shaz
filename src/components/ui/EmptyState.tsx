import { StyleSheet, Text, View } from "react-native";

import { fontSize, fontWeight, radius, spacing } from "@/constants/theme";
import { useAppTheme } from "@/hooks/use-app-theme";

type EmptyStateProps = {
  title: string;
  message: string;
};

export default function EmptyState({
  title,
  message,
}: EmptyStateProps) {
  const theme = useAppTheme();

  return (
    <View
      style={[
        styles.container,
        {
          backgroundColor: theme.surfaceSecondary,
          borderColor: theme.inputBorder,
        },
      ]}
    >
      <View style={[styles.icon, { borderColor: theme.primary }]}>
        <Text style={[styles.iconText, { color: theme.primary }]}>→</Text>
      </View>

      <View style={styles.copy}>
        <Text style={[styles.title, { color: theme.text }]}>{title}</Text>
        <Text style={[styles.message, { color: theme.textSecondary }]}>
          {message}
        </Text>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    borderWidth: 1,
    borderStyle: "dashed",
    borderRadius: radius.lg,
    padding: spacing.xl,
    gap: spacing.lg,
    flexDirection: "row",
    alignItems: "flex-start",
  },

  icon: {
    width: 38,
    height: 38,
    borderRadius: 19,
    borderWidth: 1,
    alignItems: "center",
    justifyContent: "center",
  },

  iconText: {
    fontSize: fontSize.lg,
    fontWeight: fontWeight.bold,
  },

  copy: {
    flex: 1,
    gap: spacing.xs,
  },

  title: {
    fontSize: fontSize.md,
    fontWeight: fontWeight.bold,
  },

  message: {
    fontSize: fontSize.sm,
    lineHeight: 21,
  },
});
