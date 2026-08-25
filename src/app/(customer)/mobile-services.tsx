import { Ionicons } from "@expo/vector-icons";
import {
  router,
} from "expo-router";
import {
  useState,
} from "react";
import {
  ActivityIndicator,
  RefreshControl,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from "react-native";

import CustomerTopBar from "@/components/customer/CustomerTopBar";
import MobileServiceDetailsSheet from "@/components/customer/services/MobileServiceDetailsSheet";
import MobileServiceItem from "@/components/customer/services/MobileServiceItem";
import ScreenContainer from "@/components/ui/ScreenContainer";
import {
  fontSize,
  fontWeight,
  spacing,
} from "@/constants/theme";
import { useCustomerMobileServices } from "@/features/customer/use-customer-mobile-services";
import { useAppTheme } from "@/hooks/use-app-theme";
import type { CustomerServiceType } from "@/types/customer-service";

const steps = [
  {
    number: "1",
    title: "Book online",
    description:
      "Choose your service, date and time. We'll confirm your appointment.",
    icon: "calendar-outline" as const,
  },
  {
    number: "2",
    title: "We come to you",
    description:
      "A qualified worker travels to your location with all necessary equipment.",
    icon: "navigate-outline" as const,
  },
  {
    number: "3",
    title: "Service completed",
    description:
      "Your car is ready. Pay securely through the platform.",
    icon: "checkmark-done-outline" as const,
  },
  {
    number: "4",
    title: "We come to you",
    description:
      "Our mobile team comes to your chosen location to carry out the booked service.",
    icon: "car-outline" as const,
  },
];

export default function CustomerMobileServicesScreen() {
  const theme =
    useAppTheme();

  const query =
    useCustomerMobileServices();

  const services =
    query.data ?? [];

  const [
    selectedService,
    setSelectedService,
  ] =
    useState<CustomerServiceType | null>(
      null,
    );

  const openService = (
    service: CustomerServiceType,
  ) => {
    setSelectedService(
      service,
    );
  };

  const closeService = () => {
    setSelectedService(
      null,
    );
  };

  const bookService = (
    service: CustomerServiceType,
  ) => {
    closeService();

    router.push({
      pathname:
        "/(customer)/book-service/[serviceId]",
      params: {
        serviceId:
          service.id,
      },
    });
  };

  return (
    <ScreenContainer
      contentStyle={
        styles.screen
      }
    >
      <CustomerTopBar
        title="Mobile Services"
        showBack
      />

      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={
          styles.content
        }
        refreshControl={
          <RefreshControl
            refreshing={
              query.isRefetching
            }
            onRefresh={() =>
              void query.refetch()
            }
            tintColor={
              theme.primary
            }
            colors={[
              theme.primary,
            ]}
          />
        }
      >
        <View style={styles.hero}>
          <View style={styles.heroEyebrowRow}>
            <View
              style={[
                styles.heroAccent,
                {
                  backgroundColor:
                    theme.primary,
                },
              ]}
            />

            <Text
              style={[
                styles.eyebrow,
                {
                  color:
                    theme.primary,
                },
              ]}
            >
              MOBILE SERVICES
            </Text>
          </View>

          <Text
            style={[
              styles.heroTitle,
              {
                color:
                  theme.text,
              },
            ]}
          >
            Car care that comes to you
          </Text>

          <Text
            style={[
              styles.heroSubtitle,
              {
                color:
                  theme.textSecondary,
              },
            ]}
          >
            No garage visit needed. We send a qualified worker to your location.
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

        <View style={styles.howSection}>
          <View style={styles.sectionHeading}>
            <Text
              style={[
                styles.sectionTitle,
                {
                  color:
                    theme.text,
                },
              ]}
            >
              How it works
            </Text>

            <Text
              style={[
                styles.sectionSubtitle,
                {
                  color:
                    theme.textSecondary,
                },
              ]}
            >
              Book practical car care where your car is parked. No garage visit required.
            </Text>
          </View>

          <View style={styles.timeline}>
            {steps.map(
              (
                step,
                index,
              ) => (
                <View
                  key={
                    step.number
                  }
                  style={
                    styles.stepRow
                  }
                >
                  <View style={styles.timelineColumn}>
                    <View
                      style={[
                        styles.stepMarker,
                        {
                          backgroundColor:
                            theme.primary,
                        },
                      ]}
                    >
                      <Text style={styles.stepNumber}>
                        {step.number}
                      </Text>
                    </View>

                    {index <
                    steps.length -
                      1 ? (
                      <View
                        style={[
                          styles.line,
                          {
                            backgroundColor:
                              theme.border,
                          },
                        ]}
                      />
                    ) : null}
                  </View>

                  <View style={styles.stepCopy}>
                    <View style={styles.stepTitleRow}>
                      <Ionicons
                        name={
                          step.icon
                        }
                        size={19}
                        color={
                          theme.primary
                        }
                      />

                      <Text
                        style={[
                          styles.stepTitle,
                          {
                            color:
                              theme.text,
                          },
                        ]}
                      >
                        {step.title}
                      </Text>
                    </View>

                    <Text
                      style={[
                        styles.stepDescription,
                        {
                          color:
                            theme.textSecondary,
                        },
                      ]}
                    >
                      {step.description}
                    </Text>
                  </View>
                </View>
              ),
            )}
          </View>
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

        <View style={styles.servicesSection}>
          <View style={styles.sectionHeading}>
            <Text
              style={[
                styles.serviceEyebrow,
                {
                  color:
                    theme.primary,
                },
              ]}
            >
              AVAILABLE SERVICES
            </Text>

            <Text
              style={[
                styles.sectionTitle,
                {
                  color:
                    theme.text,
                },
              ]}
            >
              Choose the care your car needs
            </Text>

            <Text
              style={[
                styles.sectionSubtitle,
                {
                  color:
                    theme.textSecondary,
                },
              ]}
            >
              Tap a service to see its details, price and estimated time.
            </Text>
          </View>

          {query.isLoading ? (
            <View style={styles.state}>
              <ActivityIndicator
                color={
                  theme.primary
                }
              />

              <Text
                style={[
                  styles.stateText,
                  {
                    color:
                      theme.textSecondary,
                  },
                ]}
              >
                Loading services…
              </Text>
            </View>
          ) : null}

          {query.isError ? (
            <View style={styles.state}>
              <Ionicons
                name="alert-circle-outline"
                size={26}
                color={
                  theme.primary
                }
              />

              <Text
                style={[
                  styles.stateTitle,
                  {
                    color:
                      theme.text,
                  },
                ]}
              >
                Couldn&apos;t load services
              </Text>

              <Text
                style={[
                  styles.stateText,
                  {
                    color:
                      theme.textSecondary,
                  },
                ]}
              >
                Pull down to try again.
              </Text>
            </View>
          ) : null}

          {!query.isLoading &&
          !query.isError &&
          services.length ===
            0 ? (
            <View style={styles.state}>
              <Ionicons
                name="build-outline"
                size={27}
                color={
                  theme.textMuted
                }
              />

              <Text
                style={[
                  styles.stateTitle,
                  {
                    color:
                      theme.text,
                  },
                ]}
              >
                No services available
              </Text>

              <Text
                style={[
                  styles.stateText,
                  {
                    color:
                      theme.textSecondary,
                  },
                ]}
              >
                Active mobile services will appear here.
              </Text>
            </View>
          ) : null}

          <View style={styles.serviceList}>
            {services.map(
              (service) => (
                <MobileServiceItem
                  key={
                    service.id
                  }
                  service={
                    service
                  }
                  onPress={() =>
                    openService(
                      service,
                    )
                  }
                />
              ),
            )}
          </View>
        </View>
      </ScrollView>

      <MobileServiceDetailsSheet
        visible={
          selectedService !==
          null
        }
        service={
          selectedService
        }
        onClose={
          closeService
        }
        onBook={
          bookService
        }
      />
    </ScreenContainer>
  );
}

const styles =
  StyleSheet.create({
    screen: {
      paddingHorizontal: 0,
    },

    content: {
      paddingBottom:
        spacing.xxxl,
    },

    hero: {
      paddingHorizontal:
        spacing.xl,
      paddingTop:
        spacing.xxl,
      paddingBottom:
        spacing.xxl,
      gap: spacing.md,
    },

    heroEyebrowRow: {
      minHeight: 28,
      flexDirection: "row",
      alignItems: "center",
      gap: spacing.md,
    },

    heroAccent: {
      width: 4,
      height: 24,
      borderRadius: 2,
    },

    eyebrow: {
      fontSize:
        fontSize.xs,
      fontWeight:
        fontWeight.bold,
      letterSpacing: 1.5,
    },

    heroTitle: {
      maxWidth: 560,
      fontSize: 32,
      lineHeight: 38,
      fontWeight:
        fontWeight.bold,
      letterSpacing: -0.9,
    },

    heroSubtitle: {
      maxWidth: 560,
      fontSize:
        fontSize.md,
      lineHeight: 24,
    },

    divider: {
      height:
        StyleSheet.hairlineWidth,
      marginHorizontal:
        spacing.xl,
    },

    howSection: {
      paddingHorizontal:
        spacing.xl,
      paddingVertical:
        spacing.xxl,
      gap: spacing.xxl,
    },

    sectionHeading: {
      gap: spacing.sm,
    },

    sectionTitle: {
      fontSize:
        fontSize.xxl,
      fontWeight:
        fontWeight.bold,
      letterSpacing: -0.5,
    },

    sectionSubtitle: {
      fontSize:
        fontSize.sm,
      lineHeight: 21,
    },

    timeline: {
      gap: 0,
    },

    stepRow: {
      minHeight: 112,
      flexDirection: "row",
      gap: spacing.lg,
    },

    timelineColumn: {
      width: 42,
      alignItems: "center",
    },

    stepMarker: {
      width: 38,
      height: 38,
      borderRadius: 19,
      alignItems: "center",
      justifyContent:
        "center",
    },

    stepNumber: {
      color: "#FFFFFF",
      fontSize:
        fontSize.sm,
      fontWeight:
        fontWeight.bold,
    },

    line: {
      width: 1,
      flex: 1,
      marginVertical: 7,
    },

    stepCopy: {
      flex: 1,
      paddingBottom:
        spacing.xl,
      gap: spacing.sm,
    },

    stepTitleRow: {
      minHeight: 38,
      flexDirection: "row",
      alignItems: "center",
      gap: spacing.sm,
    },

    stepTitle: {
      flex: 1,
      fontSize:
        fontSize.lg,
      fontWeight:
        fontWeight.bold,
    },

    stepDescription: {
      fontSize:
        fontSize.sm,
      lineHeight: 21,
    },

    servicesSection: {
      paddingHorizontal:
        spacing.xl,
      paddingTop:
        spacing.xxl,
      gap: spacing.xl,
    },

    serviceEyebrow: {
      fontSize:
        fontSize.xs,
      fontWeight:
        fontWeight.bold,
      letterSpacing: 1.4,
    },

    serviceList: {
      gap: spacing.lg,
    },

    state: {
      minHeight: 150,
      alignItems: "center",
      justifyContent:
        "center",
      gap: spacing.sm,
      paddingHorizontal:
        spacing.xl,
    },

    stateTitle: {
      fontSize:
        fontSize.lg,
      fontWeight:
        fontWeight.bold,
      textAlign: "center",
    },

    stateText: {
      fontSize:
        fontSize.sm,
      lineHeight: 21,
      textAlign: "center",
    },
  });

