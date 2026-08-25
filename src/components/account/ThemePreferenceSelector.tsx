import { Pressable, StyleSheet, Text, View } from "react-native";

import {
  type ThemePreference,
  useThemePreference,
} from "@/features/theme/theme-preference";
import { useAppTheme } from "@/hooks/use-app-theme";

const options: Array<{
  value: ThemePreference;
  label: string;
  detail: string;
}> = [
  {
    value: "system",
    label: "System",
    detail: "Follow your phone setting",
  },
  {
    value: "light",
    label: "Light",
    detail: "Always use light mode",
  },
  {
    value: "dark",
    label: "Dark",
    detail: "Always use dark mode",
  },
];

export default function ThemePreferenceSelector() {
  const theme = useAppTheme();
  const { preference, setPreference } = useThemePreference();

  return (
    <View style={styles.section}>
      <Text style={[styles.eyebrow, { color: theme.textMuted }]}>
        APP THEME
      </Text>

      <Text style={[styles.heading, { color: theme.text }]}>
        Appearance
      </Text>

      <View style={[styles.options, { borderTopColor: theme.border }]}>
        {options.map((option) => {
          const selected = preference === option.value;

          return (
            <Pressable
              key={option.value}
              accessibilityRole="radio"
              accessibilityState={{ selected }}
              onPress={() => void setPreference(option.value)}
              style={({ pressed }) => [
                styles.row,
                { borderBottomColor: theme.border },
                pressed && { opacity: 0.6 },
              ]}
            >
              <View style={styles.copy}>
                <Text style={[styles.label, { color: theme.text }]}>
                  {option.label}
                </Text>
                <Text style={[styles.detail, { color: theme.textSecondary }]}>
                  {option.detail}
                </Text>
              </View>

              <View
                style={[
                  styles.radio,
                  {
                    borderColor: selected ? theme.primary : theme.border,
                  },
                ]}
              >
                {selected ? (
                  <View
                    style={[
                      styles.dot,
                      { backgroundColor: theme.primary },
                    ]}
                  />
                ) : null}
              </View>
            </Pressable>
          );
        })}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  section: {
    paddingTop: 26,
    paddingBottom: 18,
  },
  eyebrow: {
    fontSize: 10,
    lineHeight: 14,
    fontWeight: "700",
    letterSpacing: 1,
  },
  heading: {
    marginTop: 7,
    fontSize: 20,
    lineHeight: 26,
    fontWeight: "700",
  },
  options: {
    marginTop: 16,
    borderTopWidth: StyleSheet.hairlineWidth,
  },
  row: {
    minHeight: 68,
    flexDirection: "row",
    alignItems: "center",
    gap: 16,
    borderBottomWidth: StyleSheet.hairlineWidth,
  },
  copy: {
    flex: 1,
  },
  label: {
    fontSize: 14,
    lineHeight: 20,
    fontWeight: "600",
  },
  detail: {
    marginTop: 2,
    fontSize: 12,
    lineHeight: 17,
  },
  radio: {
    width: 22,
    height: 22,
    borderWidth: 1.5,
    borderRadius: 11,
    alignItems: "center",
    justifyContent: "center",
  },
  dot: {
    width: 10,
    height: 10,
    borderRadius: 5,
  },
});

