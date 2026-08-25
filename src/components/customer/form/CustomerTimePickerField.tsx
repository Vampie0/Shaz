import DateTimePicker, {
  type DateTimePickerEvent,
} from "@react-native-community/datetimepicker";
import { Ionicons } from "@expo/vector-icons";
import type { Ref } from "react";
import { useMemo, useState } from "react";
import {
  Platform,
  Pressable,
  StyleSheet,
  Text,
  View,
} from "react-native";

import {
  fontSize,
  fontWeight,
  radius,
  spacing,
} from "@/constants/theme";
import { useAppTheme } from "@/hooks/use-app-theme";

type CustomerTimePickerFieldProps = {
  label: string;
  value: string;
  onChange: (value: string) => void;

  required?: boolean;
  optional?: boolean;
  placeholder?: string;

  fieldRef?: Ref<View>;
  invalid?: boolean;
};

function formatTime(value: Date) {
  const hour =
    String(
      value.getHours(),
    ).padStart(2, "0");

  const minute =
    String(
      value.getMinutes(),
    ).padStart(2, "0");

  return `${hour}:${minute}`;
}

function parseTime(
  value: string,
) {
  const match =
    value
      .trim()
      .match(
        /^([01]?\d|2[0-3]):([0-5]\d)$/,
      );

  const date =
    new Date();

  date.setSeconds(0);
  date.setMilliseconds(0);

  if (!match) {
    return date;
  }

  date.setHours(
    Number(match[1]),
    Number(match[2]),
    0,
    0,
  );

  return date;
}

export default function CustomerTimePickerField({
  label,
  value,
  onChange,
  required = false,
  optional = false,
  placeholder = "HH:MM",
  fieldRef,
  invalid = false,
}: CustomerTimePickerFieldProps) {
  const theme =
    useAppTheme();

  const [
    showPicker,
    setShowPicker,
  ] = useState(false);

  const selectedTime =
    useMemo(
      () =>
        parseTime(value),
      [value],
    );

  const handleChange = (
    event: DateTimePickerEvent,
    date?: Date,
  ) => {
    if (
      Platform.OS ===
      "android"
    ) {
      setShowPicker(false);
    }

    if (
      event.type ===
        "dismissed" ||
      !date
    ) {
      return;
    }

    onChange(
      formatTime(date),
    );
  };

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
            color:
              invalid
                ? theme.danger
                : theme.textSecondary,
          },
        ]}
      >
        {label}

        {required ? (
          <Text
            style={{
              color:
                theme.primary,
            }}
          >
            {" "}*
          </Text>
        ) : null}

        {optional ? (
          <Text
            style={{
              color:
                theme.textMuted,
              fontWeight:
                fontWeight.medium,
            }}
          >
            {" "}(optional)
          </Text>
        ) : null}
      </Text>

      <Pressable
        accessibilityRole="button"
        accessibilityLabel={
          `Choose ${label}`
        }
        onPress={() =>
          setShowPicker(true)
        }
        style={({ pressed }) => [
          styles.control,
          {
            borderColor:
              invalid
                ? theme.danger
                : showPicker
                  ? theme.primary
                  : theme.border,
            borderWidth:
              invalid
                ? 2
                : 1,
            backgroundColor:
              invalid
                ? theme.dangerSoft
                : theme.surface,
          },
          pressed &&
            styles.pressed,
        ]}
      >
        <Ionicons
          name="time-outline"
          size={20}
          color={
            invalid
              ? theme.danger
              : theme.textMuted
          }
        />

        <Text
          style={[
            styles.value,
            {
              color:
                value
                  ? theme.text
                  : theme.textMuted,
            },
          ]}
        >
          {value ||
            placeholder}
        </Text>

        <Ionicons
          name="chevron-down"
          size={17}
          color={
            invalid
              ? theme.danger
              : theme.textMuted
          }
        />
      </Pressable>

      {showPicker ? (
        <DateTimePicker
          value={
            selectedTime
          }
          mode="time"
          display={
            Platform.OS ===
            "android"
              ? "clock"
              : "default"
          }
          is24Hour
          onChange={
            handleChange
          }
        />
      ) : null}
    </View>
  );
}

const styles =
  StyleSheet.create({
    field: {
      flex: 1,
      gap: 7,
      borderRadius:
        radius.lg,
    },

    label: {
      fontSize:
        fontSize.xs,
      fontWeight:
        fontWeight.bold,
    },

    control: {
      minHeight: 54,
      flexDirection: "row",
      alignItems: "center",
      gap: spacing.sm,
      borderRadius:
        radius.lg,
      paddingHorizontal:
        spacing.md,
    },

    value: {
      flex: 1,
      fontSize:
        fontSize.md,
    },

    pressed: {
      opacity: 0.64,
    },
  });

