import { Ionicons } from "@expo/vector-icons";
import { router } from "expo-router";
import { Pressable, StyleSheet, Text, View } from "react-native";

import { fontSize, fontWeight, layout, spacing } from "@/constants/theme";
import { useAppTheme } from "@/hooks/use-app-theme";

type CustomerFlowTopBarProps = {
  title: string;
};

export default function CustomerFlowTopBar({ title }: CustomerFlowTopBarProps) {
  const theme = useAppTheme();

  const goBack = () => {
    if (router.canGoBack()) {
      router.back();
    } else {
      router.replace("/(customer)/(tabs)/overview");
    }
  };

  return (
    <View
      style={[
        styles.bar,
        {
          backgroundColor: theme.surface,
          borderBottomColor: theme.border,
        },
      ]}
    >
      <Pressable
        accessibilityRole="button"
        accessibilityLabel="Back"
        hitSlop={10}
        onPress={goBack}
        style={({ pressed }) => [styles.backButton, pressed && styles.pressed]}
      >
        <Ionicons name="arrow-back" size={26} color={theme.text} />
      </Pressable>

      <View style={styles.wordmark}>
        <Text style={[styles.wordmarkAccent, { color: theme.primary }]}>
          Shaz
        </Text>
      </View>

      <Text numberOfLines={1} style={[styles.title, { color: theme.textSecondary }]}>
        {title}
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  bar: {
    minHeight: layout.topBarHeight,
    paddingHorizontal: spacing.lg,
    flexDirection: "row",
    alignItems: "center",
    gap: spacing.md,
    borderBottomWidth: StyleSheet.hairlineWidth,
  },
  backButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    alignItems: "center",
    justifyContent: "center",
  },
  wordmark: {
    flexDirection: "row",
    alignItems: "center",
  },
  wordmarkAccent: {
    fontSize: fontSize.xl,
    fontWeight: fontWeight.bold,
    letterSpacing: -0.7,
  },
  title: {
    flex: 1,
    textAlign: "right",
    fontSize: fontSize.sm,
    fontWeight: fontWeight.semibold,
  },
  pressed: {
    opacity: 0.58,
  },
});
