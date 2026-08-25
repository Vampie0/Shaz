import { Ionicons } from "@expo/vector-icons";
import {
  Modal,
  Pressable,
  ScrollView,
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

type MobileServiceDetailsSheetProps = {
  visible: boolean;
  service: CustomerServiceType | null;
  onClose: () => void;
  onBook: (
    service: CustomerServiceType,
  ) => void;
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

export default function MobileServiceDetailsSheet({
  visible,
  service,
  onClose,
  onBook,
}: MobileServiceDetailsSheetProps) {
  const theme =
    useAppTheme();

  if (!service) {
    return null;
  }

  const description =
    service.shortDescription ??
    service.description;

  return (
    <Modal
      transparent
      visible={visible}
      animationType="slide"
      statusBarTranslucent
      onRequestClose={
        onClose
      }
    >
      <View style={styles.root}>
        <Pressable
          accessibilityRole="button"
          accessibilityLabel="Close service details"
          onPress={onClose}
          style={styles.backdrop}
        />

        <View
          style={[
            styles.sheet,
            {
              backgroundColor:
                theme.surface,
              borderColor:
                theme.border,
            },
          ]}
        >
          <View
            style={[
              styles.handle,
              {
                backgroundColor:
                  theme.border,
              },
            ]}
          />

          <ScrollView
            showsVerticalScrollIndicator={false}
            contentContainerStyle={
              styles.content
            }
          >
            <View style={styles.topRow}>
              <View style={styles.headingCopy}>
                <Text
                  style={[
                    styles.eyebrow,
                    {
                      color:
                        theme.primary,
                    },
                  ]}
                >
                  MOBILE CAR SERVICE
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
                  {service.name}
                </Text>
              </View>

              <Pressable
                accessibilityRole="button"
                accessibilityLabel="Close"
                hitSlop={10}
                onPress={onClose}
                style={({ pressed }) => [
                  styles.closeButton,
                  {
                    backgroundColor:
                      theme.surfaceSecondary,
                  },
                  pressed &&
                    styles.pressed,
                ]}
              >
                <Ionicons
                  name="close"
                  size={22}
                  color={
                    theme.text
                  }
                />
              </Pressable>
            </View>

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

            <View
              style={[
                styles.priceBlock,
                {
                  backgroundColor:
                    theme.nav,
                },
              ]}
            >
              <Text
                style={[
                  styles.priceLabel,
                  {
                    color:
                      theme.primary,
                  },
                ]}
              >
                FROM
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
                {formatPrice(
                  service.basePrice,
                )}
              </Text>

              <Text
                style={[
                  styles.priceHint,
                  {
                    color:
                      theme.navMuted,
                  },
                ]}
              >
                Starting price. Final arrangements are confirmed with you.
              </Text>
            </View>

            <View
              style={[
                styles.divider,
                {
                  backgroundColor:
                    theme.border,
                },
              ]}
            />

            <View style={styles.metaSection}>
              <View style={styles.metaRow}>
                <View
                  style={[
                    styles.metaIcon,
                    {
                      backgroundColor:
                        theme.primarySoft,
                    },
                  ]}
                >
                  <Ionicons
                    name="cash-outline"
                    size={20}
                    color={
                      theme.primary
                    }
                  />
                </View>

                <View style={styles.metaCopy}>
                  <Text
                    style={[
                      styles.metaLabel,
                      {
                        color:
                          theme.textMuted,
                      },
                    ]}
                  >
                    BASE PRICE
                  </Text>

                  <Text
                    style={[
                      styles.metaValue,
                      {
                        color:
                          theme.text,
                      },
                    ]}
                  >
                    From{" "}
                    {formatPrice(
                      service.basePrice,
                    )}
                  </Text>
                </View>
              </View>

              {service.estimatedDurationMinutes !==
              null ? (
                <View style={styles.metaRow}>
                  <View
                    style={[
                      styles.metaIcon,
                      {
                        backgroundColor:
                          theme.surfaceSecondary,
                      },
                    ]}
                  >
                    <Ionicons
                      name="time-outline"
                      size={20}
                      color={
                        theme.textSecondary
                      }
                    />
                  </View>

                  <View style={styles.metaCopy}>
                    <Text
                      style={[
                        styles.metaLabel,
                        {
                          color:
                            theme.textMuted,
                        },
                      ]}
                    >
                      ESTIMATED TIME
                    </Text>

                    <Text
                      style={[
                        styles.metaValue,
                        {
                          color:
                            theme.text,
                        },
                      ]}
                    >
                      {service.estimatedDurationMinutes} minutes
                    </Text>
                  </View>
                </View>
              ) : null}
            </View>

            <Pressable
              accessibilityRole="button"
              onPress={() =>
                onBook(service)
              }
              style={({ pressed }) => [
                styles.bookButton,
                {
                  backgroundColor:
                    theme.primary,
                },
                pressed &&
                  styles.pressed,
              ]}
            >
              <Text style={styles.bookButtonText}>
                Book this service
              </Text>

              <Ionicons
                name="arrow-forward"
                size={19}
                color="#FFFFFF"
              />
            </Pressable>
          </ScrollView>
        </View>
      </View>
    </Modal>
  );
}

const styles =
  StyleSheet.create({
    root: {
      flex: 1,
      justifyContent:
        "flex-end",
    },

    backdrop: {
      ...StyleSheet.absoluteFillObject,
      backgroundColor:
        "rgba(3, 12, 22, 0.52)",
    },

    sheet: {
      maxHeight: "82%",
      overflow: "hidden",
      borderWidth: 1,
      borderTopLeftRadius: 28,
      borderTopRightRadius: 28,
    },

    handle: {
      width: 46,
      height: 5,
      alignSelf: "center",
      marginTop: 10,
      borderRadius: 999,
    },

    content: {
      paddingHorizontal:
        spacing.xl,
      paddingTop:
        spacing.lg,
      paddingBottom:
        spacing.xxxl,
      gap: spacing.lg,
    },

    topRow: {
      flexDirection: "row",
      alignItems:
        "flex-start",
      gap: spacing.md,
    },

    headingCopy: {
      flex: 1,
      gap: 5,
    },

    eyebrow: {
      fontSize:
        fontSize.xs,
      fontWeight:
        fontWeight.bold,
      letterSpacing: 1.3,
    },

    title: {
      fontSize: 28,
      lineHeight: 34,
      fontWeight:
        fontWeight.bold,
      letterSpacing: -0.6,
    },

    closeButton: {
      width: 42,
      height: 42,
      borderRadius: 21,
      alignItems: "center",
      justifyContent:
        "center",
    },

    description: {
      fontSize:
        fontSize.md,
      lineHeight: 24,
    },

    priceBlock: {
      paddingHorizontal:
        spacing.xl,
      paddingVertical:
        spacing.xl,
      borderTopLeftRadius: 8,
      borderTopRightRadius: 24,
      borderBottomLeftRadius: 24,
      borderBottomRightRadius: 8,
      gap: 5,
    },

    priceLabel: {
      fontSize: 11,
      fontWeight:
        fontWeight.bold,
      letterSpacing: 1.3,
    },

    price: {
      fontSize: 34,
      lineHeight: 40,
      fontWeight:
        fontWeight.bold,
      letterSpacing: -0.8,
    },

    priceHint: {
      marginTop: 3,
      fontSize:
        fontSize.sm,
      lineHeight: 20,
    },

    divider: {
      height:
        StyleSheet.hairlineWidth,
    },

    metaSection: {
      gap: spacing.lg,
    },

    metaRow: {
      flexDirection: "row",
      alignItems: "center",
      gap: spacing.md,
    },

    metaIcon: {
      width: 44,
      height: 44,
      borderRadius: 14,
      alignItems: "center",
      justifyContent:
        "center",
    },

    metaCopy: {
      flex: 1,
      gap: 3,
    },

    metaLabel: {
      fontSize: 10,
      fontWeight:
        fontWeight.bold,
      letterSpacing: 0.9,
    },

    metaValue: {
      fontSize:
        fontSize.md,
      fontWeight:
        fontWeight.bold,
    },

    bookButton: {
      minHeight: 54,
      marginTop: spacing.sm,
      flexDirection: "row",
      alignItems: "center",
      justifyContent:
        "center",
      gap: spacing.sm,
      borderRadius:
        radius.lg,
      paddingHorizontal:
        spacing.lg,
    },

    bookButtonText: {
      color: "#FFFFFF",
      fontSize:
        fontSize.md,
      fontWeight:
        fontWeight.bold,
    },

    pressed: {
      opacity: 0.7,
    },
  });

