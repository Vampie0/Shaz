import { ActivityIndicator, Modal, StyleSheet, Text, View } from "react-native";

import { fontSize, fontWeight, radius, spacing } from "@/constants/theme";
import { useAppTheme } from "@/hooks/use-app-theme";

type AppLoadingOverlayProps = {
  visible: boolean;
  message?: string;
};

export default function AppLoadingOverlay({
  visible,
  message = "Please wait...",
}: AppLoadingOverlayProps) {
  const theme = useAppTheme();

  if (!visible) return null;

  return (
    <Modal
      transparent
      animationType="fade"
      visible={visible}
      statusBarTranslucent
    >
      <View
        style={[
          styles.overlay,
          {
            // Dark mode mein halka sa gehra backdrop, light mode mein standard dim
            backgroundColor: "rgba(0, 0, 0, 0.55)",
          },
        ]}
      >
        <View
          style={[
            styles.card,
            {
              backgroundColor: theme.surface,
              borderColor: theme.border,
              shadowColor: theme.text, // Shadow bhi theme ke hisab se adapt hogi
            },
          ]}
        >
          <ActivityIndicator size="large" color={theme.primary} />
          {message ? (
            <Text style={[styles.message, { color: theme.text }]}>
              {message}
            </Text>
          ) : null}
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    padding: spacing.xl,
  },
  card: {
    minWidth: 150,
    maxWidth: 240,
    paddingVertical: spacing.xl,
    paddingHorizontal: spacing.xl,
    borderRadius: radius.xl,
    borderWidth: 1,
    alignItems: "center",
    justifyContent: "center",
    gap: spacing.md,
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.2,
    shadowRadius: 12,
    elevation: 10,
  },
  message: {
    fontSize: fontSize.sm,
    fontWeight: fontWeight.semibold,
    textAlign: "center",
  },
});
