import { Ionicons } from "@expo/vector-icons";
import type { ComponentProps, Ref } from "react";
import type { KeyboardTypeOptions } from "react-native";
import { View } from "react-native";

import AppInput from "@/components/ui/AppInput";

type IconName = ComponentProps<typeof Ionicons>["name"];

type SellCarFieldProps = {
  label: string;
  value: string;
  onChangeText: (value: string) => void;
  placeholder: string;

  required?: boolean;
  editable?: boolean;
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
  editable = true,
  keyboardType,
  autoCapitalize = "sentences",
  multiline = false,
  maxLength,
  fieldRef,
  onFocus,
  onBlur,
}: SellCarFieldProps) {
  const displayLabel = `${label}${required && editable ? " *" : ""}${
    !editable ? " (Locked)" : ""
  }`;

  return (
    <View ref={fieldRef} collapsable={false}>
      <AppInput
        label={displayLabel}
        value={value}
        onChangeText={onChangeText}
        placeholder={placeholder}
        editable={editable}
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
