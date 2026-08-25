import { StyleSheet, Text, View } from "react-native";

import { fontSize, fontWeight, radius } from "@/constants/theme";
import { useAppTheme } from "@/hooks/use-app-theme";

type Tone = "success" | "info" | "warning" | "danger" | "neutral";

type CustomerStatusBadgeProps = {
  label: string;
  tone?: Tone;
};

export default function CustomerStatusBadge({
  label,
  tone = "neutral",
}: CustomerStatusBadgeProps) {
  const theme = useAppTheme();

  const palette = (() => {
    switch (tone) {
      case "success":
        return {
          backgroundColor: theme.successSoft,
          color: theme.success,
        };

      case "info":
        return {
          backgroundColor: theme.infoSoft,
          color: theme.info,
        };

      case "warning":
        return {
          backgroundColor: theme.warningSoft,
          color: theme.warning,
        };

      case "danger":
        return {
          backgroundColor: theme.dangerSoft,
          color: theme.danger,
        };

      case "neutral":
      default:
        return {
          backgroundColor: theme.surfaceMuted,
          color: theme.textSecondary,
        };
    }
  })();

  return (
    <View
      style={[
        styles.badge,
        {
          backgroundColor: palette.backgroundColor,
        },
      ]}
    >
      <Text
        numberOfLines={1}
        style={[
          styles.text,
          {
            color: palette.color,
          },
        ]}
      >
        {label}
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  badge: {
    alignSelf: "flex-start",
    maxWidth: "100%",
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: radius.sm,
  },

  text: {
    fontSize: 10,
    fontWeight: fontWeight.bold,
    letterSpacing: 0.3,
  },
});
