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

type CustomerDatePickerFieldProps = {
  label: string;
  value: string;
  onChange: (value: string) => void;

  required?: boolean;
  optional?: boolean;
  placeholder?: string;
  minimumDate?: Date;
  maximumDate?: Date;
  allowClear?: boolean;

  fieldRef?: Ref<View>;
  invalid?: boolean;
};

function formatDate(value: Date) {
  const day = String(
    value.getDate(),
  ).padStart(2, "0");

  const month = String(
    value.getMonth() + 1,
  ).padStart(2, "0");

  const year =
    value.getFullYear();

  return `${day}/${month}/${year}`;
}

function parseDate(
  value: string,
) {
  const match =
    value
      .trim()
      .match(
        /^(\d{1,2})\/(\d{1,2})\/(\d{4})$/,
      );

  if (!match) {
    return null;
  }

  const day =
    Number(match[1]);

  const month =
    Number(match[2]);

  const year =
    Number(match[3]);

  const date =
    new Date(
      year,
      month - 1,
      day,
      12,
      0,
      0,
      0,
    );

  if (
    date.getFullYear() !== year ||
    date.getMonth() !==
      month - 1 ||
    date.getDate() !== day
  ) {
    return null;
  }

  return date;
}

export default function CustomerDatePickerField({
  label,
  value,
  onChange,
  required = false,
  optional = false,
  placeholder = "DD/MM/YYYY",
  minimumDate,
  maximumDate,
  allowClear = false,
  fieldRef,
  invalid = false,
}: CustomerDatePickerFieldProps) {
  const theme =
    useAppTheme();

  const [
    showPicker,
    setShowPicker,
  ] = useState(false);

  const selectedDate =
    useMemo(
      () =>
        parseDate(value) ??
        minimumDate ??
        new Date(),
      [
        value,
        minimumDate,
      ],
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
      formatDate(date),
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
          name="calendar-outline"
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

        {allowClear &&
        value ? (
          <Pressable
            accessibilityRole="button"
            accessibilityLabel={
              `Clear ${label}`
            }
            hitSlop={8}
            onPress={(event) => {
              event.stopPropagation();
              onChange("");
            }}
            style={({ pressed }) => [
              styles.clear,
              pressed &&
                styles.pressed,
            ]}
          >
            <Ionicons
              name="close-circle"
              size={20}
              color={
                theme.textMuted
              }
            />
          </Pressable>
        ) : null}

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
            selectedDate
          }
          mode="date"
          display={
            Platform.OS ===
            "android"
              ? "calendar"
              : "default"
          }
          minimumDate={
            minimumDate
          }
          maximumDate={
            maximumDate
          }
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

    clear: {
      width: 28,
      height: 28,
      alignItems: "center",
      justifyContent:
        "center",
    },

    pressed: {
      opacity: 0.64,
    },
  });

