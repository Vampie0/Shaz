import { Ionicons } from "@expo/vector-icons";
import { useState } from "react";
import {
  Pressable,
  StyleSheet,
  Text,
  TextInput,
  TextInputProps,
  View,
} from "react-native";

import { fontSize, fontWeight, radius } from "@/constants/theme";
import { useAppTheme } from "@/hooks/use-app-theme";

type AppInputProps = TextInputProps & {
  label?: string;
  hint?: string;
  error?: string;
  success?: string;
  password?: boolean;
};

export default function AppInput({
  label,
  hint,
  error,
  success,
  password = false,
  style,
  onFocus,
  onBlur,
  editable = true,
  ...props
}: AppInputProps) {
  const theme = useAppTheme();
  const [focused, setFocused] = useState(false);
  const [passwordVisible, setPasswordVisible] = useState(false);

  const borderColor = error
    ? theme.danger
    : focused
      ? theme.primary
      : theme.inputBorder;

  return (
    <View style={styles.wrapper}>
      {label ? (
        <Text style={[styles.label, { color: theme.textSecondary }]}>
          {label}
        </Text>
      ) : null}

      <View style={styles.fieldShell}>
        {focused && !error ? (
          <View
            pointerEvents="none"
            style={[
              styles.focusRing,
              {
                borderColor: theme.primarySoft,
              },
            ]}
          />
        ) : null}

        <View
          style={[
            styles.field,
            {
              backgroundColor: editable
                ? theme.surface
                : theme.surfaceSecondary,
              borderColor,
            },
          ]}
        >
          <TextInput
            {...props}
            editable={editable}
            secureTextEntry={
              password ? !passwordVisible : props.secureTextEntry
            }
            placeholderTextColor={theme.textMuted}
            selectionColor={theme.primary}
            cursorColor={theme.primary}
            onFocus={(event) => {
              setFocused(true);
              onFocus?.(event);
            }}
            onBlur={(event) => {
              setFocused(false);
              onBlur?.(event);
            }}
            style={[
              styles.input,
              {
                color: editable ? theme.text : theme.textMuted,
              },
              password && styles.passwordInput,
              style,
            ]}
          />

          {password ? (
            <Pressable
              accessibilityRole="button"
              accessibilityLabel={
                passwordVisible ? "Hide password" : "Show password"
              }
              disabled={!editable}
              hitSlop={10}
              onPress={() => setPasswordVisible((current) => !current)}
              style={({ pressed }) => [
                styles.eyeButton,
                pressed && styles.eyePressed,
              ]}
            >
              <Ionicons
                name={passwordVisible ? "eye-off-outline" : "eye-outline"}
                size={18}
                color={focused ? theme.primary : theme.textMuted}
              />
            </Pressable>
          ) : null}
        </View>
      </View>

      {error ? (
        <View style={[styles.statusBox, { backgroundColor: theme.dangerSoft }]}>
          <Text style={[styles.statusText, { color: theme.danger }]}>
            {error}
          </Text>
        </View>
      ) : success ? (
        <View
          style={[styles.statusBox, { backgroundColor: theme.successSoft }]}
        >
          <Text style={[styles.statusText, { color: theme.success }]}>
            {success}
          </Text>
        </View>
      ) : hint ? (
        <Text style={[styles.hint, { color: theme.textMuted }]}>{hint}</Text>
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  wrapper: {
    width: "100%",
    gap: 6,
  },

  label: {
    fontSize: fontSize.sm,
    fontWeight: fontWeight.bold,
    marginBottom: 0,
  },

  fieldShell: {
    width: "100%",
    position: "relative",
  },

  focusRing: {
    position: "absolute",
    top: -3,
    left: -3,
    right: -3,
    bottom: -3,
    borderWidth: 3,
    borderRadius: radius.md + 3,
  },

  field: {
    minHeight: 42,
    flexDirection: "row",
    alignItems: "center",
    borderWidth: 1.5,
    borderRadius: radius.md,
    overflow: "hidden",
  },

  input: {
    flex: 1,
    minHeight: 42,
    paddingHorizontal: 12,
    paddingVertical: 10,
    fontSize: fontSize.sm,
  },

  passwordInput: {
    paddingRight: 44,
  },

  eyeButton: {
    position: "absolute",
    right: 10,
    top: 0,
    bottom: 0,
    width: 32,
    alignItems: "center",
    justifyContent: "center",
  },

  eyePressed: {
    opacity: 0.55,
  },

  hint: {
    fontSize: fontSize.xs,
    lineHeight: 16,
    marginTop: 2,
  },

  statusBox: {
    marginTop: 4,
    borderRadius: radius.md,
    paddingHorizontal: 12,
    paddingVertical: 8,
  },

  statusText: {
    fontSize: fontSize.xs,
    lineHeight: 16,
    fontWeight: fontWeight.medium,
  },
});
