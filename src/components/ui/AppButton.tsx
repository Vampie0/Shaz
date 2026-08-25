import {
  ActivityIndicator,
  Pressable,
  StyleProp,
  StyleSheet,
  Text,
  ViewStyle,
} from "react-native";

import { fontWeight, radius, spacing } from "@/constants/theme";
import { useAppTheme } from "@/hooks/use-app-theme";

type Variant = "primary" | "secondary" | "danger" | "ghost";

type AppButtonProps = {
  title: string;
  onPress: () => void;
  variant?: Variant;
  loading?: boolean;
  disabled?: boolean;
  fullWidth?: boolean;
  style?: StyleProp<ViewStyle>;
};

export default function AppButton({
  title,
  onPress,
  variant = "primary",
  loading = false,
  disabled = false,
  fullWidth = true,
  style,
}: AppButtonProps) {
  const theme = useAppTheme();
  const isDisabled = disabled || loading;

  const backgroundColor =
    variant === "primary"
      ? theme.action
      : variant === "danger"
        ? theme.actionPressed
        : variant === "secondary"
          ? theme.surface
          : "transparent";

  const borderColor =
    variant === "primary"
      ? theme.action
      : variant === "danger"
        ? theme.actionPressed
        : variant === "secondary"
          ? theme.border
          : "transparent";

  const textColor =
    variant === "primary" || variant === "danger"
      ? theme.actionText
      : variant === "secondary"
        ? theme.text
        : theme.primary;

  return (
    <Pressable
      accessibilityRole="button"
      accessibilityState={{
        disabled: isDisabled,
        busy: loading,
      }}
      disabled={isDisabled}
      onPress={onPress}
      style={({ pressed }) => [
        styles.button,
        {
          backgroundColor,
          borderColor,
        },
        fullWidth && styles.fullWidth,
        pressed && !isDisabled && styles.pressed,
        isDisabled && styles.disabled,
        style,
      ]}
    >
      {loading ? (
        <ActivityIndicator size="small" color={textColor} />
      ) : (
        <Text style={[styles.title, { color: textColor }]}>
          {title}
        </Text>
      )}
    </Pressable>
  );
}

const styles = StyleSheet.create({
  button: {
    minHeight: 46,
    alignItems: "center",
    justifyContent: "center",
    paddingHorizontal: spacing.lg,
    borderRadius: radius.md,
    borderWidth: 1,
  },

  fullWidth: {
    width: "100%",
  },

  title: {
    fontSize: 14,
    fontWeight: fontWeight.bold,
  },

  pressed: {
    opacity: 0.82,
    transform: [{ scale: 0.99 }],
  },

  disabled: {
    opacity: 0.48,
  },
});
