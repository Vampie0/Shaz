import { Ionicons } from "@expo/vector-icons";
import {
  Pressable,
  StyleSheet,
  Text,
  View,
} from "react-native";

import {
  fontSize,
  fontWeight,
  radius,
  spacing,
} from "@/constants/theme";
import { useAppTheme } from "@/hooks/use-app-theme";

type CustomerPageHeaderProps = {
  eyebrow?: string;
  title: string;
  subtitle: string;
  actionLabel?: string;
  onAction?: () => void;
  actionVariant?: "primary" | "secondary";
};

export default function CustomerPageHeader({
  eyebrow,
  title,
  subtitle,
  actionLabel,
  onAction,
  actionVariant = "primary",
}: CustomerPageHeaderProps) {
  const theme =
    useAppTheme();

  const primary =
    actionVariant ===
    "primary";

  return (
    <View style={styles.container}>
      <View style={styles.copy}>
        {eyebrow ? (
          <Text
            style={[
              styles.eyebrow,
              {
                color:
                  theme.primary,
              },
            ]}
          >
            {eyebrow.toUpperCase()}
          </Text>
        ) : null}

        <Text
          style={[
            styles.title,
            {
              color:
                theme.text,
            },
          ]}
        >
          {title}
        </Text>

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
      </View>

      {actionLabel &&
      onAction ? (
        <Pressable
          accessibilityRole="button"
          onPress={onAction}
          style={({ pressed }) => [
            styles.action,
            {
              backgroundColor:
                primary
                  ? theme.primary
                  : theme.surface,
              borderColor:
                primary
                  ? theme.primary
                  : theme.border,
            },
            pressed &&
              styles.pressed,
          ]}
        >
          <Text
            style={[
              styles.actionText,
              {
                color:
                  primary
                    ? "#FFFFFF"
                    : theme.text,
              },
            ]}
          >
            {actionLabel}
          </Text>

          <Ionicons
            name="arrow-forward"
            size={17}
            color={
              primary
                ? "#FFFFFF"
                : theme.text
            }
          />
        </Pressable>
      ) : null}
    </View>
  );
}

const styles =
  StyleSheet.create({
    container: {
      gap: spacing.lg,
    },

    copy: {
      gap: spacing.sm,
    },

    eyebrow: {
      fontSize:
        fontSize.xs,
      fontWeight:
        fontWeight.bold,
      letterSpacing: 1.4,
    },

    title: {
      fontSize: 30,
      lineHeight: 36,
      fontWeight:
        fontWeight.bold,
      letterSpacing: -0.8,
    },

    subtitle: {
      maxWidth: 560,
      fontSize:
        fontSize.sm,
      lineHeight: 21,
    },

    action: {
      minHeight: 46,
      alignSelf:
        "flex-start",
      flexDirection: "row",
      alignItems: "center",
      justifyContent:
        "center",
      gap: spacing.sm,
      paddingHorizontal:
        spacing.lg,
      borderWidth: 1,
      borderRadius:
        radius.md,
    },

    actionText: {
      fontSize:
        fontSize.sm,
      fontWeight:
        fontWeight.bold,
    },

    pressed: {
      opacity: 0.72,
      transform: [
        {
          scale: 0.985,
        },
      ],
    },
  });

