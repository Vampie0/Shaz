import { Ionicons } from "@expo/vector-icons";
import type { ComponentProps } from "react";
import {
  StyleSheet,
  Text,
  View,
} from "react-native";

import {
  fontSize,
  fontWeight,
  spacing,
} from "@/constants/theme";
import { useAppTheme } from "@/hooks/use-app-theme";

type IconName =
  ComponentProps<
    typeof Ionicons
  >["name"];

type SellCarSectionHeaderProps = {
  step: string;
  title: string;
  subtitle: string;
  icon: IconName;
};

export default function SellCarSectionHeader({
  step,
  title,
  subtitle,
  icon,
}: SellCarSectionHeaderProps) {
  const theme =
    useAppTheme();

  return (
    <View style={styles.row}>
      <View
        style={[
          styles.marker,
          {
            backgroundColor:
              theme.primarySoft,
          },
        ]}
      >
        <Ionicons
          name={icon}
          size={20}
          color={
            theme.primary
          }
        />
      </View>

      <View style={styles.copy}>
        <Text
          style={[
            styles.step,
            {
              color:
                theme.primary,
            },
          ]}
        >
          {step}
        </Text>

        <Text
          style={[
            styles.title,
            {
              color:
                theme.text,
            },
          ]}
        >
          {title}
        </Text>

        <Text
          style={[
            styles.subtitle,
            {
              color:
                theme.textSecondary,
            },
          ]}
        >
          {subtitle}
        </Text>
      </View>
    </View>
  );
}

const styles =
  StyleSheet.create({
    row: {
      flexDirection: "row",
      alignItems:
        "flex-start",
      gap: spacing.md,
    },

    marker: {
      width: 44,
      height: 44,
      borderRadius: 14,
      alignItems: "center",
      justifyContent:
        "center",
    },

    copy: {
      flex: 1,
      gap: 3,
    },

    step: {
      fontSize: 11,
      fontWeight:
        fontWeight.bold,
      letterSpacing: 1,
    },

    title: {
      fontSize:
        fontSize.lg,
      fontWeight:
        fontWeight.bold,
    },

    subtitle: {
      fontSize:
        fontSize.sm,
      lineHeight: 20,
    },
  });

