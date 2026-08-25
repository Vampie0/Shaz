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

import { fontSize, fontWeight } from "@/constants/theme";
import { useAppTheme } from "@/hooks/use-app-theme";

type AppInputProps = TextInputProps & {
  label?: string;
  error?: string;
  password?: boolean;
};

export default function AppInput({
  label,
  error,
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

  return (
    <View style={[styles.wrapper, !editable && styles.disabled]}>
      {label ? (
        <Text style={[styles.label, { color: theme.text }]}>
          {label}
        </Text>
      ) : null}

      <View style={styles.fieldShell}>
        {focused ? (
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
              backgroundColor: theme.surface,
              borderColor: error
                ? theme.danger
                : focused
                  ? theme.primary
                  : theme.inputBorder,
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
                color: theme.text,
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
                size={21}
                color={focused ? theme.primary : theme.textMuted}
              />
            </Pressable>
          ) : null}
        </View>
      </View>

      {error ? (
        <Text style={[styles.error, { color: theme.danger }]}>
          {error}
        </Text>
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  wrapper: {
    width: "100%",
    gap: 7,
  },

  label: {
    fontSize: fontSize.sm,
    fontWeight: fontWeight.medium,
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
    borderRadius: 15,
  },

  field: {
    minHeight: 48,
    flexDirection: "row",
    alignItems: "center",
    borderWidth: 1,
    borderRadius: 12,
    overflow: "hidden",
  },

  input: {
    flex: 1,
    minHeight: 48,
    paddingHorizontal: 15,
    paddingVertical: 0,
    fontSize: 15,
  },

  passwordInput: {
    paddingRight: 52,
  },

  eyeButton: {
    position: "absolute",
    right: 14,
    top: 0,
    bottom: 0,
    width: 34,
    alignItems: "center",
    justifyContent: "center",
  },

  eyePressed: {
    opacity: 0.55,
  },

  error: {
    fontSize: fontSize.xs,
    lineHeight: 17,
    marginTop: 1,
  },

  disabled: {
    opacity: 0.6,
  },
});
