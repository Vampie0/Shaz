// File: src/components/customer/sell/SellCarSelect.tsx

import { Ionicons } from "@expo/vector-icons";
import type { Ref } from "react";
import { Pressable, StyleSheet, Text, View } from "react-native";

import { fontSize, fontWeight, radius, spacing } from "@/constants/theme";
import { useAppTheme } from "@/hooks/use-app-theme";

type Option<T extends string> = {
  label: string;
  value: T;
};

type SellCarSelectProps<T extends string> = {
  label: string;
  value: T | "";
  placeholder: string;
  options: Option<T>[];
  required?: boolean;
  disabled?: boolean;
  expanded: boolean;
  onToggle: () => void;
  onSelect: (value: T) => void;

  fieldRef?: Ref<View>;
  invalid?: boolean;
};

export default function SellCarSelect<T extends string>({
  label,
  value,
  placeholder,
  options,
  required = false,
  disabled = false,
  expanded,
  onToggle,
  onSelect,
  fieldRef,
  invalid = false,
}: SellCarSelectProps<T>) {
  const theme = useAppTheme();

  const selected = options.find((option) => option.value === value);

  return (
    <View ref={fieldRef} collapsable={false} style={styles.field}>
      <Text
        style={[
          styles.label,
          {
            color: invalid
              ? theme.danger
              : disabled
                ? theme.textMuted
                : theme.textSecondary,
          },
        ]}
      >
        {label}
        {required && !disabled ? (
          <Text style={{ color: theme.primary }}> *</Text>
        ) : null}
        {disabled ? (
          <Text
            style={{ color: theme.textMuted, fontWeight: fontWeight.regular }}
          >
            {" "}
            (Locked)
          </Text>
        ) : null}
      </Text>

      <Pressable
        accessibilityRole="button"
        disabled={disabled}
        onPress={onToggle}
        style={({ pressed }) => [
          styles.trigger,
          {
            borderColor: invalid
              ? theme.danger
              : expanded
                ? theme.primary
                : theme.border,
            borderWidth: invalid ? 2 : 1,
            backgroundColor: invalid
              ? theme.dangerSoft
              : disabled
                ? theme.surfaceSecondary
                : theme.surface,
            opacity: disabled ? 0.75 : 1,
          },
          pressed && !disabled && styles.pressed,
        ]}
      >
        <Text
          style={[
            styles.value,
            {
              color: disabled
                ? theme.textSecondary
                : selected
                  ? theme.text
                  : theme.textMuted,
            },
          ]}
        >
          {selected?.label ?? placeholder}
        </Text>

        <Ionicons
          name={
            disabled ? "lock-closed" : expanded ? "chevron-up" : "chevron-down"
          }
          size={18}
          color={invalid ? theme.danger : theme.textMuted}
        />
      </Pressable>

      {expanded && !disabled ? (
        <View
          style={[
            styles.options,
            {
              borderColor: theme.border,
              backgroundColor: theme.surface,
            },
          ]}
        >
          {options.map((option) => {
            const active = option.value === value;

            return (
              <Pressable
                key={option.value}
                accessibilityRole="button"
                onPress={() => onSelect(option.value)}
                style={({ pressed }) => [
                  styles.option,
                  {
                    borderBottomColor: theme.border,
                  },
                  pressed && styles.pressed,
                ]}
              >
                <Text
                  style={[
                    styles.optionText,
                    {
                      color: active ? theme.primary : theme.text,
                      fontWeight: active ? fontWeight.bold : fontWeight.medium,
                    },
                  ]}
                >
                  {option.label}
                </Text>

                {active ? (
                  <Ionicons name="checkmark" size={18} color={theme.primary} />
                ) : null}
              </Pressable>
            );
          })}
        </View>
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  field: {
    gap: 7,
    borderRadius: radius.lg,
  },
  label: {
    fontSize: fontSize.xs,
    fontWeight: fontWeight.bold,
  },
  trigger: {
    minHeight: 54,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    gap: spacing.md,
    borderRadius: radius.lg,
    paddingHorizontal: spacing.md,
  },
  value: {
    flex: 1,
    fontSize: fontSize.md,
  },
  options: {
    overflow: "hidden",
    borderWidth: 1,
    borderRadius: radius.md,
  },
  option: {
    minHeight: 48,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    gap: spacing.md,
    paddingHorizontal: spacing.md,
    borderBottomWidth: StyleSheet.hairlineWidth,
  },
  optionText: {
    flex: 1,
    fontSize: fontSize.sm,
  },
  pressed: {
    opacity: 0.58,
  },
});
