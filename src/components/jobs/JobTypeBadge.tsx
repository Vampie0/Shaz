import { fontWeight } from "@/constants/theme";
import { useAppTheme } from "@/hooks/use-app-theme";
import type { WorkerJobKind } from "@/types/job";
import { StyleSheet, Text, View } from "react-native";

export default function JobTypeBadge({
  kind,
  label,
}: {
  kind: WorkerJobKind;
  label?: string;
}) {
  const theme = useAppTheme();
  const text = (
    label || (kind === "service" ? "Mobile Service" : "Vehicle Inspection")
  ).toUpperCase();
  const isService = kind === "service";

  return (
    <View
      style={[
        styles.badge,
        {
          backgroundColor: isService ? theme.primarySoft : theme.surfaceMuted,
          borderColor: isService ? theme.primary : theme.border,
        },
      ]}
    >
      <Text
        style={[
          styles.text,
          { color: isService ? theme.primary : theme.textSecondary },
        ]}
      >
        {text}
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  badge: {
    alignSelf: "flex-start",
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 6,
    borderWidth: StyleSheet.hairlineWidth,
  },
  text: {
    flexShrink: 1,
    fontSize: 10,
    lineHeight: 14,
    fontWeight: fontWeight.bold,
    letterSpacing: 1.05,
  },
});
