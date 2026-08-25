import {
  Pressable,
  StyleSheet,
  Text,
  View,
} from "react-native";

import {
  fontSize,
  fontWeight,
  spacing,
} from "@/constants/theme";
import { useAppTheme } from "@/hooks/use-app-theme";

type CustomerSectionHeaderProps = {
  title: string;
  subtitle?: string;
  actionLabel?: string;
  onAction?: () => void;
};

export default function CustomerSectionHeader({
  title,
  subtitle,
  actionLabel,
  onAction,
}: CustomerSectionHeaderProps) {
  const theme = useAppTheme();

  return (
    <View style={styles.row}>
      <View style={styles.copy}>
        <Text
          style={[
            styles.title,
            {
              color: theme.text,
            },
          ]}
        >
          {title}
        </Text>

        {subtitle ? (
          <Text
            style={[
              styles.subtitle,
              {
                color:
                  theme.textSecondary,
              },
            ]}
          >
            {subtitle}
          </Text>
        ) : null}
      </View>

      {actionLabel && onAction ? (
        <Pressable
          accessibilityRole="button"
          onPress={onAction}
          hitSlop={8}
          style={({ pressed }) => [
            styles.action,
            pressed &&
              styles.pressed,
          ]}
        >
          <Text
            style={[
              styles.actionText,
              {
                color:
                  theme.primary,
              },
            ]}
          >
            {actionLabel} →
          </Text>
        </Pressable>
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  row: {
    flexDirection: "row",
    alignItems: "flex-start",
    justifyContent: "space-between",
    gap: spacing.lg,
  },

  copy: {
    flex: 1,
    gap: spacing.xs,
  },

  title: {
    fontSize: fontSize.xl,
    fontWeight: fontWeight.bold,
    letterSpacing: -0.35,
  },

  subtitle: {
    fontSize: fontSize.sm,
    lineHeight: 20,
  },

  action: {
    minHeight: 34,
    justifyContent: "center",
  },

  actionText: {
    fontSize: fontSize.sm,
    fontWeight: fontWeight.bold,
  },

  pressed: {
    opacity: 0.62,
  },
});

