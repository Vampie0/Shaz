import { Ionicons } from "@expo/vector-icons";
import {
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
import type { CustomerServiceType } from "@/types/customer-service";

type MobileServiceItemProps = {
  service: CustomerServiceType;
  onPress: () => void;
};

function formatPrice(
  value: number,
) {
  return (
    "£" +
    value.toLocaleString(
      "en-GB",
      {
        maximumFractionDigits: 0,
      },
    )
  );
}

export default function MobileServiceItem({
  service,
  onPress,
}: MobileServiceItemProps) {
  const theme =
    useAppTheme();

  const description =
    service.shortDescription ??
    service.description;

  return (
    <Pressable
      accessibilityRole="button"
      onPress={onPress}
      style={({ pressed }) => [
        styles.wrap,
        {
          borderColor:
            theme.border,
          backgroundColor:
            theme.surface,
        },
        pressed &&
          styles.pressed,
      ]}
    >
      <View
        style={[
          styles.priceFlag,
          {
            backgroundColor:
              theme.nav,
          },
        ]}
      >
        <Text
          style={[
            styles.priceEyebrow,
            {
              color:
                theme.primary,
            },
          ]}
        >
          MOBILE SERVICE
        </Text>

        <Text
          style={[
            styles.price,
            {
              color:
                theme.navText,
            },
          ]}
        >
          From{" "}
          {formatPrice(
            service.basePrice,
          )}
        </Text>
      </View>

      <View style={styles.content}>
        <View style={styles.titleRow}>
          <View style={styles.titleCopy}>
            <Text
              style={[
                styles.name,
                {
                  color:
                    theme.text,
                },
              ]}
            >
              {service.name}
            </Text>

            <Text
              style={[
                styles.description,
                {
                  color:
                    theme.textSecondary,
                },
              ]}
            >
              {description}
            </Text>
          </View>

          <View
            style={[
              styles.arrow,
              {
                backgroundColor:
                  theme.primarySoft,
              },
            ]}
          >
            <Ionicons
              name="arrow-forward"
              size={19}
              color={
                theme.primary
              }
            />
          </View>
        </View>

        {service.estimatedDurationMinutes !==
        null ? (
          <>
            <View
              style={[
                styles.divider,
                {
                  backgroundColor:
                    theme.border,
                },
              ]}
            />

            <View style={styles.durationRow}>
              <Ionicons
                name="time-outline"
                size={18}
                color={
                  theme.textMuted
                }
              />

              <Text
                style={[
                  styles.duration,
                  {
                    color:
                      theme.textSecondary,
                  },
                ]}
              >
                Estimated:{" "}
                {service.estimatedDurationMinutes} mins
              </Text>
            </View>
          </>
        ) : null}
      </View>
    </Pressable>
  );
}

const styles =
  StyleSheet.create({
    wrap: {
      overflow: "hidden",
      borderWidth: 1,
      borderTopLeftRadius:
        radius.md,
      borderTopRightRadius: 26,
      borderBottomLeftRadius: 26,
      borderBottomRightRadius:
        radius.md,
    },

    priceFlag: {
      alignSelf:
        "stretch",
      paddingHorizontal:
        spacing.lg,
      paddingVertical:
        spacing.lg,
      gap: 5,
    },

    priceEyebrow: {
      fontSize: 11,
      fontWeight:
        fontWeight.bold,
      letterSpacing: 1.2,
    },

    price: {
      fontSize: 27,
      lineHeight: 32,
      fontWeight:
        fontWeight.bold,
      letterSpacing: -0.5,
    },

    content: {
      padding:
        spacing.lg,
      gap: spacing.lg,
    },

    titleRow: {
      flexDirection: "row",
      alignItems:
        "flex-start",
      gap: spacing.md,
    },

    titleCopy: {
      flex: 1,
      gap: spacing.sm,
    },

    name: {
      fontSize:
        fontSize.xl,
      fontWeight:
        fontWeight.bold,
    },

    description: {
      fontSize:
        fontSize.sm,
      lineHeight: 21,
    },

    arrow: {
      width: 42,
      height: 42,
      borderTopLeftRadius: 15,
      borderTopRightRadius: 5,
      borderBottomLeftRadius: 5,
      borderBottomRightRadius: 15,
      alignItems: "center",
      justifyContent:
        "center",
    },

    divider: {
      height:
        StyleSheet.hairlineWidth,
    },

    durationRow: {
      flexDirection: "row",
      alignItems: "center",
      gap: spacing.sm,
    },

    duration: {
      fontSize:
        fontSize.sm,
      fontWeight:
        fontWeight.semibold,
    },

    pressed: {
      opacity: 0.76,
      transform: [
        {
          scale: 0.992,
        },
      ],
    },
  });

