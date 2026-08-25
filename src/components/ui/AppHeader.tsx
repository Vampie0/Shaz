import { useRouter } from "expo-router";
import { Pressable, StyleSheet, Text, View } from "react-native";

import { fontSize, fontWeight, layout, spacing } from "@/constants/theme";
import { useResolvedColorScheme } from "@/features/theme/theme-preference";
import { useAppTheme } from "@/hooks/use-app-theme";

type AppHeaderProps = {
  title: string;
  showBack?: boolean;
};

export default function AppHeader({
  title,
  showBack = false,
}: AppHeaderProps) {
  const router = useRouter();
  const theme = useAppTheme();
  const colorScheme = useResolvedColorScheme();
  const isDark = colorScheme === "dark";

  const headerBackground = isDark ? theme.nav : theme.surface;
  const headerText = isDark ? theme.navText : theme.text;

  return (
    <View
      style={[
        styles.header,
        {
          backgroundColor: headerBackground,
          borderBottomColor: theme.border,
        },
      ]}
    >
      <View style={styles.side}>
        {showBack ? (
          <Pressable
            accessibilityRole="button"
            accessibilityLabel="Go back"
            hitSlop={10}
            onPress={() => router.back()}
            style={({ pressed }) => [
              styles.backButton,
              pressed && styles.pressed,
            ]}
          >
            <Text style={[styles.backIcon, { color: headerText }]}>
              ←
            </Text>
          </Pressable>
        ) : null}
      </View>

      <Text
        numberOfLines={1}
        style={[styles.title, { color: headerText }]}
      >
        {title}
      </Text>

      <View style={styles.side} />
    </View>
  );
}

const styles = StyleSheet.create({
  header: {
    minHeight: layout.topBarHeight,
    paddingHorizontal: spacing.lg,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    borderBottomWidth: StyleSheet.hairlineWidth,
  },

  side: {
    width: 44,
    alignItems: "flex-start",
  },

  backButton: {
    width: 44,
    height: 44,
    justifyContent: "center",
  },

  backIcon: {
    fontSize: 26,
    fontWeight: fontWeight.medium,
  },

  title: {
    flex: 1,
    textAlign: "center",
    fontSize: fontSize.md,
    fontWeight: fontWeight.bold,
  },

  pressed: {
    opacity: 0.65,
  },
});
