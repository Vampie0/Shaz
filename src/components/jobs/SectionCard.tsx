import { PropsWithChildren } from "react";
import { StyleSheet, Text, View } from "react-native";

import { fontSize, fontWeight, radius, spacing } from "@/constants/theme";
import { useAppTheme } from "@/hooks/use-app-theme";

type SectionCardProps = PropsWithChildren<{
  title: string;
}>;

export default function SectionCard({
  title,
  children,
}: SectionCardProps) {
  const theme = useAppTheme();

  return (
    <View
      style={[
        styles.card,
        {
          backgroundColor: theme.surface,
          borderColor: theme.border,
        },
      ]}
    >
      <Text style={[styles.title, { color: theme.text }]}>
        {title}
      </Text>

      <View>{children}</View>
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    borderWidth: 1,
    borderRadius: radius.lg,
    padding: spacing.lg,
    gap: spacing.sm,
  },

  title: {
    fontSize: fontSize.md,
    fontWeight: fontWeight.bold,
  },
});
