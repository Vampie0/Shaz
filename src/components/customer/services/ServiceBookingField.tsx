import { Ionicons } from "@expo/vector-icons";
import type { ComponentProps, Ref } from "react";
import type { KeyboardTypeOptions } from "react-native";
import { View } from "react-native";

import AppInput from "@/components/ui/AppInput";

type IconName = ComponentProps<typeof Ionicons>["name"];

type ServiceBookingFieldProps = {
  label: string;
  value: string;
  onChangeText: (value: string) => void;
  placeholder: string;

  required?: boolean;
  optional?: boolean;
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

export default function ServiceBookingField({
  label,
  value,
  onChangeText,
  placeholder,
  required = false,
  optional = false,
  keyboardType,
  autoCapitalize = "sentences",
  multiline = false,
  maxLength,
  fieldRef,
  onFocus,
  onBlur,
}: ServiceBookingFieldProps) {
  const displayLabel = `${label}${required ? " *" : ""}${
    optional ? " (optional)" : ""
  }`;

  return (
    <View ref={fieldRef} collapsable={false}>
      <AppInput
        label={displayLabel}
        value={value}
        onChangeText={onChangeText}
        placeholder={placeholder}
        keyboardType={keyboardType}
        autoCapitalize={autoCapitalize}
        multiline={multiline}
        maxLength={maxLength}
        onFocus={onFocus}
        onBlur={onBlur}
        textAlignVertical={multiline ? "top" : "center"}
      />
    </View>
  );
}
