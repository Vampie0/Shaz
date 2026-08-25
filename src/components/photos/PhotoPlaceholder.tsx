import { StyleSheet, Text, View } from "react-native";

import { fontSize, fontWeight, radius, spacing } from "@/constants/theme";
import { useAppTheme } from "@/hooks/use-app-theme";

type PhotoPlaceholderProps = {
  title: string;
  message: string;
};

export default function PhotoPlaceholder({
  title,
  message,
}: PhotoPlaceholderProps) {
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
      <View style={[styles.plus, { borderColor: theme.primary }]}>
        <Text style={[styles.plusText, { color: theme.primary }]}>+</Text>
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
    borderRadius: radius.md,
    padding: spacing.lg,
    gap: spacing.md,
    flexDirection: "row",
    alignItems: "flex-start",
  },

  plus: {
    width: 38,
    height: 38,
    borderRadius: 19,
    borderWidth: 1,
    alignItems: "center",
    justifyContent: "center",
  },

  plusText: {
    fontSize: 22,
    fontWeight: fontWeight.medium,
  },

  copy: {
    flex: 1,
    gap: spacing.xs,
  },

  title: {
    fontSize: fontSize.sm,
    fontWeight: fontWeight.bold,
  },

  message: {
    fontSize: fontSize.sm,
    lineHeight: 20,
  },
});
