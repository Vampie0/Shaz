import { Ionicons } from "@expo/vector-icons";
import type { ComponentProps } from "react";
import { Pressable, StyleSheet, Text, View } from "react-native";

import { fontSize, fontWeight, radius, spacing } from "@/constants/theme";
import { useAppTheme } from "@/hooks/use-app-theme";

type IconName = ComponentProps<typeof Ionicons>["name"];

type CustomerQuickActionProps = {
  icon: IconName;
  title: string;
  subtitle: string;
  onPress: () => void;
  accentColor?: string;
  badgeBg?: string;
};

export default function CustomerQuickAction({
  icon,
  title,
  subtitle,
  onPress,
  accentColor,
  badgeBg,
}: CustomerQuickActionProps) {
  const theme = useAppTheme();

  const iconColor = accentColor || theme.primary;
  const bg = badgeBg || theme.primarySoft;

  return (
    <Pressable
      accessibilityRole="button"
      onPress={onPress}
      style={({ pressed }) => [
        styles.card,
        {
          backgroundColor: theme.surface,
          borderColor: theme.border,
        },
        pressed && styles.pressed,
      ]}
    >
      <View style={[styles.iconWrap, { backgroundColor: bg }]}>
        <Ionicons name={icon} size={22} color={iconColor} />
      </View>

      <View style={styles.copy}>
        <Text style={[styles.title, { color: theme.text }]}>
          {title} →
        </Text>

        <Text numberOfLines={2} style={[styles.subtitle, { color: theme.textSecondary }]}>
          {subtitle}
        </Text>
      </View>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  card: {
    width: "48%",
    minHeight: 124,
    borderWidth: 1,
    borderRadius: radius.xl,
    padding: spacing.lg,
    gap: spacing.md,
    justifyContent: "space-between",
  },
  iconWrap: {
    width: 40,
    height: 40,
    borderRadius: 14,
    alignItems: "center",
    justifyContent: "center",
  },
  copy: {
    gap: 3,
  },
  title: {
    fontSize: fontSize.sm,
    fontWeight: fontWeight.bold,
  },
  subtitle: {
    fontSize: fontSize.xs,
    lineHeight: 17,
  },
  pressed: {
    opacity: 0.72,
    transform: [{ scale: 0.985 }],
  },
});
