import { StyleSheet, Text, View } from "react-native";

import { fontSize, fontWeight, spacing } from "@/constants/theme";
import { useAppTheme } from "@/hooks/use-app-theme";

type ScreenHeadingProps = {
  eyebrow?: string;
  title: string;
  subtitle?: string;
};

export default function ScreenHeading({
  eyebrow,
  title,
  subtitle,
}: ScreenHeadingProps) {
  const theme = useAppTheme();

  return (
    <View style={styles.wrapper}>
      {eyebrow ? (
        <Text style={[styles.eyebrow, { color: theme.primary }]}>
          {eyebrow.toUpperCase()}
        </Text>
      ) : null}

      <Text style={[styles.title, { color: theme.text }]}>
        {title}
      </Text>

      {subtitle ? (
        <Text style={[styles.subtitle, { color: theme.textSecondary }]}>
          {subtitle}
        </Text>
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  wrapper: {
    gap: spacing.sm,
  },

  eyebrow: {
    fontSize: fontSize.xs,
    fontWeight: fontWeight.bold,
    letterSpacing: 1.35,
  },

  title: {
    fontSize: fontSize.xxl,
    fontWeight: fontWeight.bold,
    letterSpacing: -0.45,
  },

  subtitle: {
    fontSize: fontSize.md,
    lineHeight: 23,
  },
});
