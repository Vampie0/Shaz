import { Ionicons } from "@expo/vector-icons";
import type {
  ComponentProps,
  Ref,
} from "react";
import {
  StyleSheet,
  Text,
  TextInput,
  View,
} from "react-native";
import type {
  KeyboardTypeOptions,
} from "react-native";

import {
  fontSize,
  fontWeight,
  radius,
  spacing,
} from "@/constants/theme";
import { useAppTheme } from "@/hooks/use-app-theme";

type IconName = ComponentProps<typeof Ionicons>["name"];

type SellCarFieldProps = {
  label: string;
  value: string;
  onChangeText: (value: string) => void;
  placeholder: string;

  required?: boolean;
  icon?: IconName;
  keyboardType?: KeyboardTypeOptions;
  autoCapitalize?: "none" | "sentences" | "words" | "characters";
  multiline?: boolean;
  maxLength?: number;

  fieldRef?: Ref<View>;
  invalid?: boolean;
  onFocus?: () => void;
  onBlur?: () => void;
};

export default function SellCarField({
  label,
  value,
  onChangeText,
  placeholder,
  required = false,
  icon,
  keyboardType,
  autoCapitalize = "sentences",
  multiline = false,
  maxLength,
  fieldRef,
  invalid = false,
  onFocus,
  onBlur,
}: SellCarFieldProps) {
  const theme = useAppTheme();

  return (
    <View
      ref={fieldRef}
      collapsable={false}
      style={styles.field}
    >
      <Text
        style={[
          styles.label,
          {
            color: invalid ? theme.danger : theme.textSecondary,
          },
        ]}
      >
        {label}
        {required ? (
          <Text style={{ color: theme.primary }}> *</Text>
        ) : null}
      </Text>

      <View
        style={[
          styles.control,
          multiline && styles.multilineControl,
          {
            borderColor: invalid ? theme.danger : theme.border,
            borderWidth: invalid ? 2 : 1,
            backgroundColor: invalid ? theme.dangerSoft : theme.surface,
          },
        ]}
      >
        {icon ? (
          <Ionicons
            name={icon}
            size={19}
            color={invalid ? theme.danger : theme.textMuted}
            style={multiline ? styles.multilineIcon : undefined}
          />
        ) : null}

        <TextInput
          value={value}
          onChangeText={onChangeText}
          placeholder={placeholder}
          placeholderTextColor={theme.textMuted}
          keyboardType={keyboardType}
          autoCapitalize={autoCapitalize}
          multiline={multiline}
          maxLength={maxLength}
          onFocus={onFocus}
          onBlur={onBlur}
          textAlignVertical={multiline ? "top" : "center"}
          style={[
            styles.input,
            multiline && styles.multilineInput,
            { color: theme.text },
          ]}
        />
      </View>
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
  control: {
    minHeight: 54,
    flexDirection: "row",
    alignItems: "center",
    gap: spacing.sm,
    borderRadius: radius.lg,
    paddingHorizontal: spacing.md,
  },
  multilineControl: {
    minHeight: 150,
    alignItems: "flex-start",
    paddingTop: spacing.sm,
  },
  multilineIcon: {
    marginTop: 12,
  },
  input: {
    flex: 1,
    minHeight: 50,
    paddingVertical: 10,
    fontSize: fontSize.md,
  },
  multilineInput: {
    minHeight: 130,
    paddingTop: 10,
    lineHeight: 22,
  },
});
